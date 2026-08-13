"""
Enrollment-time frame quality gate.

This decides whether a captured pose frame is good enough to keep (and,
eventually, generate an embedding from) *before* the student walks away from
the enrollment kiosk -- catching a blurry or badly-lit frame here is far
cheaper than discovering a bad enrollment weeks later when recognition keeps
failing for that student.
"""
import logging
from dataclasses import dataclass

import cv2
import numpy as np

from app.utils.image_utils import to_grayscale

logger = logging.getLogger(__name__)


@dataclass
class QualityResult:
    accepted: bool
    reason: str
    face_detected: bool
    single_face: bool
    sharpness: float
    lighting: str
    centered: bool


def _sharpness_score(image_bgr: np.ndarray) -> float:
    """Variance of the Laplacian -- a well-established, cheap blur metric.
    Higher = sharper. Values below ~50-80 are typically visibly blurry for
    a face-sized crop at webcam resolution."""
    gray = to_grayscale(image_bgr)
    return float(cv2.Laplacian(gray, cv2.CV_64F).var())


def _lighting_label(image_bgr: np.ndarray, min_brightness: float, max_brightness: float) -> tuple[str, float]:
    gray = to_grayscale(image_bgr)
    mean_brightness = float(np.mean(gray))
    if mean_brightness < min_brightness:
        return "TOO_DARK", mean_brightness
    if mean_brightness > max_brightness:
        return "TOO_BRIGHT", mean_brightness
    return "OK", mean_brightness


def assess_quality(image_bgr, faces, config) -> QualityResult:
    """
    `faces` is the already-computed list of DetectedFace from FaceEngine for
    this frame (the caller runs detection once and reuses it for both the
    quality check and, on acceptance, could reuse the embedding too -- kept
    separate here to keep the enrollment/recognition contracts independent
    since Spring Boot calls them as two distinct endpoints).
    """
    lighting_label, brightness = _lighting_label(image_bgr, config.MIN_BRIGHTNESS, config.MAX_BRIGHTNESS)
    sharpness = _sharpness_score(image_bgr)

    if len(faces) == 0:
        return QualityResult(
            accepted=False, reason="NO_FACE_DETECTED", face_detected=False, single_face=False,
            sharpness=sharpness, lighting=lighting_label, centered=False,
        )

    if len(faces) > 1:
        return QualityResult(
            accepted=False, reason="MULTIPLE_FACES_DETECTED", face_detected=True, single_face=False,
            sharpness=sharpness, lighting=lighting_label, centered=False,
        )

    face = faces[0]
    area_ratio = face.bbox_area_ratio(image_bgr.shape)
    center_offset = face.center_offset_ratio(image_bgr.shape)
    is_centered = center_offset <= config.MAX_CENTER_OFFSET_RATIO

    if sharpness < config.BLUR_VARIANCE_THRESHOLD:
        return QualityResult(
            accepted=False, reason="IMAGE_TOO_BLURRY", face_detected=True, single_face=True,
            sharpness=sharpness, lighting=lighting_label, centered=is_centered,
        )

    if lighting_label != "OK":
        return QualityResult(
            accepted=False, reason=lighting_label, face_detected=True, single_face=True,
            sharpness=sharpness, lighting=lighting_label, centered=is_centered,
        )

    if area_ratio < config.MIN_FACE_AREA_RATIO:
        return QualityResult(
            accepted=False, reason="FACE_TOO_SMALL", face_detected=True, single_face=True,
            sharpness=sharpness, lighting=lighting_label, centered=is_centered,
        )

    if area_ratio > config.MAX_FACE_AREA_RATIO:
        return QualityResult(
            accepted=False, reason="FACE_TOO_CLOSE", face_detected=True, single_face=True,
            sharpness=sharpness, lighting=lighting_label, centered=is_centered,
        )

    if not is_centered:
        return QualityResult(
            accepted=False, reason="FACE_NOT_CENTERED", face_detected=True, single_face=True,
            sharpness=sharpness, lighting=lighting_label, centered=False,
        )

    if abs(face.yaw) > config.MAX_YAW_DEGREES and abs(face.yaw) > config.MAX_YAW_DEGREES * 2:
        # Extreme yaw only (mild yaw is expected/allowed for LEFT/RIGHT enrollment
        # poses -- Spring Boot tells us which pose this is meant to be, but the AI
        # service intentionally doesn't hard-fail on yaw alone; it just flags it).
        pass

    if abs(face.roll) > config.MAX_ROLL_DEGREES:
        return QualityResult(
            accepted=False, reason="HEAD_TILTED", face_detected=True, single_face=True,
            sharpness=sharpness, lighting=lighting_label, centered=is_centered,
        )

    return QualityResult(
        accepted=True, reason="OK", face_detected=True, single_face=True,
        sharpness=sharpness, lighting=lighting_label, centered=is_centered,
    )
