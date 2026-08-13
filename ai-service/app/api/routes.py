"""
REST endpoints consumed by `FlaskAiClientService.java` on the Spring Boot
side. Field names below are chosen to match that Java code's DTOs exactly
(Jackson serializes Java getters as camelCase JSON keys, so `bestMatchStudentId`,
`recognitionDurationMs`-style names must line up character-for-character).

Contract summary:
  POST   /ai/quality/check          {image}                          -> FaceFrameResponse shape
  POST   /ai/embeddings/generate    {image}                          -> {embeddings: [{bbox, embedding}]}
  POST   /ai/recognition/match      {probeEmbedding}                 -> {bestMatchStudentId, confidence}
  POST   /ai/cache/sync             [{studentId, embeddings}]        -> 200, no body needed (Void.class on Java side)
  POST   /ai/cache/refresh-student  {studentId, embeddings}          -> 200
  DELETE /ai/cache/student/<id>                                       -> 200

Design choice worth calling out explicitly: when no face is found in
/ai/embeddings/generate, this returns HTTP 200 with an EMPTY embeddings list
rather than a 4xx error. That is deliberate -- `RecognitionService.java` on
the Java side treats an empty `embeddings` array as the normal "no face /
unknown" case and turns it into a clean `UNKNOWN` recognition result itself;
if this service instead threw a 4xx here, Java would wrap it in a generic
`AiServiceException` and (per RecognitionService's own catch block) treat
it as a *system* failure rather than a normal "nobody was in frame" result.
"""
import logging

from flask import Blueprint, current_app, jsonify, request

from app.auth import require_api_key
from app.config import quality_thresholds_from
from app.engine.quality import assess_quality
from app.errors import InvalidImageError, ValidationError
from app.utils.image_utils import decode_base64_image

logger = logging.getLogger(__name__)

ai_bp = Blueprint("ai", __name__, url_prefix="/ai")


def _engine():
    return current_app.extensions["face_engine"]


def _cache():
    return current_app.extensions["embedding_cache"]


def _require_json_field(body, field_name):
    if not isinstance(body, dict) or field_name not in body or body[field_name] in (None, ""):
        raise ValidationError(f"Request body is missing required field '{field_name}'.")
    return body[field_name]


@ai_bp.post("/quality/check")
@require_api_key
def quality_check():
    body = request.get_json(silent=True) or {}
    image_b64 = _require_json_field(body, "image")

    image_bgr = decode_base64_image(image_b64)
    faces = _engine().detect_faces(image_bgr)
    result = assess_quality(image_bgr, faces, quality_thresholds_from(current_app.config))

    logger.info("Quality check: accepted=%s reason=%s sharpness=%.1f lighting=%s",
                result.accepted, result.reason, result.sharpness, result.lighting)

    return jsonify({
        "accepted": result.accepted,
        "reason": result.reason,
        "quality": {
            "faceDetected": result.face_detected,
            "singleFace": result.single_face,
            "sharpness": round(result.sharpness, 2),
            "lighting": result.lighting,
            "centered": result.centered,
        },
    }), 200


@ai_bp.post("/embeddings/generate")
@require_api_key
def generate_embeddings():
    body = request.get_json(silent=True) or {}
    image_b64 = _require_json_field(body, "image")

    image_bgr = decode_base64_image(image_b64)
    faces = _engine().detect_faces(image_bgr)

    if not faces:
        logger.info("No face detected during embedding generation.")
        return jsonify({"embeddings": []}), 200

    # For recognition frames there may be bystanders in the background; only
    # the most prominent (largest) face is a candidate for identification.
    # For enrollment frames the quality gate already enforced exactly one
    # face, so this is a no-op in that case.
    primary = _engine().largest_face(faces, image_bgr.shape)

    return jsonify({
        "embeddings": [{
            "bbox": [round(v, 2) for v in primary.bbox],
            "embedding": [round(float(v), 8) for v in primary.embedding.tolist()],
        }],
    }), 200


@ai_bp.post("/recognition/match")
@require_api_key
def match_face():
    body = request.get_json(silent=True) or {}
    probe = _require_json_field(body, "probeEmbedding")

    if not isinstance(probe, list) or not probe:
        raise ValidationError("'probeEmbedding' must be a non-empty array of numbers.")

    try:
        student_id, confidence = _cache().match(probe)
    except ValueError as exc:
        raise ValidationError(str(exc)) from exc

    logger.info("Match result: studentId=%s confidence=%.4f", student_id, confidence)

    return jsonify({
        "bestMatchStudentId": student_id,
        "confidence": round(confidence, 6),
    }), 200


@ai_bp.post("/cache/sync")
@require_api_key
def sync_cache():
    body = request.get_json(silent=True)
    if not isinstance(body, list):
        raise ValidationError("Request body must be a JSON array of {studentId, embeddings} objects.")

    _cache().replace_all(body)
    return jsonify({
        "message": "Cache synchronized.",
        "studentsLoaded": _cache().student_count(),
        "embeddingsLoaded": _cache().embedding_count(),
    }), 200


@ai_bp.post("/cache/refresh-student")
@require_api_key
def refresh_student_cache():
    body = request.get_json(silent=True) or {}
    student_id = _require_json_field(body, "studentId")
    embeddings = body.get("embeddings") or []

    _cache().upsert_student(student_id, embeddings)
    return jsonify({
        "message": f"Cache refreshed for student {student_id}.",
        "poseCount": len(embeddings),
    }), 200


@ai_bp.delete("/cache/student/<int:student_id>")
@require_api_key
def delete_student_cache(student_id):
    removed = _cache().remove_student(student_id)
    return jsonify({
        "message": f"Cache entry removed for student {student_id}." if removed
                   else f"Student {student_id} was not present in the cache (no-op).",
        "removed": removed,
    }), 200
