from flask import Blueprint, current_app, jsonify

health_bp = Blueprint("health", __name__)


@health_bp.get("/health")
def health():
    """
    Unauthenticated liveness/readiness probe for Docker/Kubernetes and for
    the Spring Boot backend to check before relying on this service.
    Returns 200 with modelReady=false rather than a 5xx while the model is
    still loading at startup, so orchestrators don't flap the container --
    but callers should check `modelReady` before sending real traffic.
    """
    engine = current_app.extensions.get("face_engine")
    cache = current_app.extensions.get("embedding_cache")

    model_ready = bool(engine and engine.ready)
    body = {
        "status": "ok" if model_ready else "starting",
        "service": current_app.config.get("SERVICE_NAME"),
        "modelReady": model_ready,
        "modelLoadError": engine.load_error if engine and engine.load_error else None,
        "cachedStudents": cache.student_count() if cache else 0,
        "cachedEmbeddings": cache.embedding_count() if cache else 0,
    }
    return jsonify(body), 200
