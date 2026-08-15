"""
Thin, defensive wrapper around InsightFace's FaceAnalysis app.

InsightFace's `buffalo_l` model pack already performs detection, 5-point
landmark alignment, and embedding extraction in a single `app.get(image)`
call, returning `Face` objects whose `.normed_embedding` is an L2-normalized
512-d vector -- which is exactly why cosine similarity between two of these
vectors collapses to a plain dot product (see cache/embedding_cache.py).

This module is the only place that imports `insightface`/`onnxruntime`, so
the rest of the codebase (routes, cache, quality checks) can be unit-tested
without the model weights or a GPU present.
"""
import logging
import threading

import numpy as np

from app.errors import ModelNotReadyError

logger = logging.getLogger(__name__)


class DetectedFace:
    """Plain data holder so the rest of the app never touches InsightFace's
    internal `Face` object directly (keeps the model library swappable)."""

    __slots__ = ("bbox", "embedding", "det_score", "landmarks", "yaw", "pitch", "roll")

    def __init__(self, bbox, embedding, det_score, landmarks, yaw=0.0, pitch=0.0, roll=0.0):
        self.bbox = bbox                # [x1, y1, x2, y2] floats, pixel coords
        self.embedding = embedding      # np.ndarray, shape (512,), L2-normalized float32
        self.det_score = det_score      # detector confidence, 0..1
        self.landmarks = landmarks      # 5x2 np.ndarray (eyes, nose, mouth corners)
        self.yaw = yaw
        self.pitch = pitch
        self.roll = roll

    def bbox_area_ratio(self, image_shape) -> float:
        h, w = image_shape[:2]
        x1, y1, x2, y2 = self.bbox
        face_area = max(0.0, x2 - x1) * max(0.0, y2 - y1)
        return face_area / float(w * h) if w and h else 0.0

    def center_offset_ratio(self, image_shape) -> float:
        """0.0 = perfectly centered, larger = further from image center."""
        h, w = image_shape[:2]
        x1, y1, x2, y2 = self.bbox
        face_cx, face_cy = (x1 + x2) / 2.0, (y1 + y2) / 2.0
        img_cx, img_cy = w / 2.0, h / 2.0
        dx = abs(face_cx - img_cx) / (w / 2.0) if w else 0.0
        dy = abs(face_cy - img_cy) / (h / 2.0) if h else 0.0
        return max(dx, dy)


def _estimate_pose_from_landmarks(landmarks: np.ndarray):
    """
    Cheap, model-free pose estimate from the 5-point landmark set
    (left eye, right eye, nose, left mouth corner, right mouth corner).
    Good enough to gate obviously extreme poses during enrollment; this is
    intentionally simple rather than running a separate 3D head-pose model.
    """
    left_eye, right_eye, nose, left_mouth, right_mouth = landmarks

    eye_dx = right_eye[0] - left_eye[0]
    eye_dy = right_eye[1] - left_eye[1]
    roll = np.degrees(np.arctan2(eye_dy, eye_dx))

    eye_mid_x = (left_eye[0] + right_eye[0]) / 2.0
    mouth_mid_x = (left_mouth[0] + right_mouth[0]) / 2.0
    eye_span = max(abs(right_eye[0] - left_eye[0]), 1e-6)
    # Nose deviation from the eye midline, normalized by eye span, as a yaw proxy.
    yaw = np.degrees(np.arctan2((nose[0] - eye_mid_x), eye_span)) * 1.6

    eye_mid_y = (left_eye[1] + right_eye[1]) / 2.0
    mouth_mid_y = (left_mouth[1] + right_mouth[1]) / 2.0
    vertical_span = max(abs(mouth_mid_y - eye_mid_y), 1e-6)
    pitch = np.degrees(np.arctan2((nose[1] - eye_mid_y) - vertical_span * 0.55, vertical_span)) * 0.8

    return float(yaw), float(pitch), float(roll)


class FaceEngine:
    """
    Process-wide singleton around InsightFace's FaceAnalysis. Loading the
    model is expensive (reads ONNX weights from disk), so it happens exactly
    once at application startup, not per-request.
    """

    def __init__(self, model_name: str, model_root: str, ctx_id: int, det_size: int,
                 min_det_score: float):
        self._model_name = model_name
        self._model_root = model_root
        self._ctx_id = ctx_id
        self._det_size = det_size
        self._min_det_score = min_det_score
        self._app = None
        self._lock = threading.Lock()
        self._ready = False
        self._load_error = None

    @property
    def ready(self) -> bool:
        return self._ready

    @property
    def load_error(self):
        return self._load_error

    def load(self):
        """
        Loads the InsightFace model pack. Called once during application
        startup. Any failure here is logged clearly and re-raised so the
        service's /health endpoint (and container orchestrator) can see the
        service is not actually usable, rather than silently accepting
        traffic it can never fulfil.
        """
        with self._lock:
            if self._ready:
                return
            try:
                # Imported lazily so importing this module doesn't require
                # onnxruntime/insightface to be installed just to run the
                # quality/cache unit tests.
                from insightface.app import FaceAnalysis

                logger.info(
                    "Loading InsightFace model pack '%s' from %s (ctx_id=%s, det_size=%s)...",
                    self._model_name, self._model_root, self._ctx_id, self._det_size,
                )
                self._app = FaceAnalysis(name=self._model_name, root=self._model_root, allowed_modules=["detection", "recognition"])
                self._app.prepare(ctx_id=self._ctx_id, det_size=(self._det_size, self._det_size))
                self._ready = True
                logger.info("InsightFace model pack loaded successfully.")
            except Exception as exc:  # noqa: BLE001 - we want to catch and report *any* load failure
                self._load_error = str(exc)
                logger.error(
                    "FAILED to load InsightFace model '%s'. The AI service will report itself as "
                    "not-ready and reject recognition requests until this is fixed. "
                    "Common causes: no internet access on first run (model auto-download), "
                    "missing onnxruntime, or an unwritable AI_MODEL_ROOT directory. Error: %s",
                    self._model_name, exc,
                )
                raise

    def detect_faces(self, image_bgr: np.ndarray):
        """Returns a list of DetectedFace, best detection score first."""
        if not self._ready:
            raise ModelNotReadyError(
                "Face recognition model is not loaded yet. The service is starting up "
                "or failed to initialize -- check /health."
            )

        raw_faces = self._app.get(image_bgr)
        results = []
        for face in raw_faces:
            if face.det_score is not None and face.det_score < self._min_det_score:
                continue
            embedding = getattr(face, "normed_embedding", None)
            if embedding is None:
                # Fallback: normalize manually if the model didn't provide a
                # pre-normalized vector for some reason.
                raw = np.asarray(face.embedding, dtype=np.float32)
                norm = np.linalg.norm(raw)
                embedding = raw / norm if norm > 0 else raw
            embedding = np.asarray(embedding, dtype=np.float32)

            landmarks = np.asarray(face.kps, dtype=np.float32) if getattr(face, "kps", None) is not None else None
            yaw = pitch = roll = 0.0
            if landmarks is not None and landmarks.shape == (5, 2):
                yaw, pitch, roll = _estimate_pose_from_landmarks(landmarks)

            results.append(DetectedFace(
                bbox=[float(v) for v in face.bbox],
                embedding=embedding,
                det_score=float(face.det_score) if face.det_score is not None else 0.0,
                landmarks=landmarks,
                yaw=yaw,
                pitch=pitch,
                roll=roll,
            ))

        results.sort(key=lambda f: f.det_score, reverse=True)
        return results

    def largest_face(self, faces, image_shape):
        """Pick the most prominent face when multiple are detected (e.g. the
        person being enrolled, not someone walking by in the background)."""
        if not faces:
            return None
        return max(faces, key=lambda f: f.bbox_area_ratio(image_shape))
