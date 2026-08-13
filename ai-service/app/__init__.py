import logging
import sys

from flask import Flask

from app.config import Config
from app.logging_setup import configure_logging
from app.errors import register_error_handlers
from app.rate_limit import init_rate_limiting
from app.engine.face_engine import FaceEngine
from app.cache.embedding_cache import EmbeddingCache


def create_app(config_object: type = Config) -> Flask:
    app = Flask(__name__)
    app.config.from_object(config_object)

    configure_logging(app)
    logger = logging.getLogger(__name__)

    # Fail fast on insecure/missing configuration rather than starting a
    # service that would silently accept unauthenticated requests.
    problems = config_object.validate()
    if problems:
        for p in problems:
            logger.critical("CONFIG ERROR: %s", p)
        if not app.config.get("DEBUG"):
            logger.critical("Refusing to start in a non-debug environment with invalid configuration.")
            sys.exit(1)
        logger.warning("Continuing in DEBUG mode despite config problems above -- do NOT do this in production.")

    # Optional CORS, only relevant if you ever expose this service to a browser directly.
    if app.config.get("CORS_ORIGINS"):
        _apply_cors(app)

    register_error_handlers(app)
    init_rate_limiting(app)

    # --- Core singletons: model engine + in-RAM embedding cache ---
    engine = FaceEngine(
        model_name=app.config["MODEL_NAME"],
        model_root=app.config["MODEL_ROOT"],
        ctx_id=app.config["CTX_ID"],
        det_size=app.config["DETECTION_SIZE"],
        min_det_score=app.config["MIN_DETECTION_SCORE"],
    )
    cache = EmbeddingCache(embedding_dim=app.config["EMBEDDING_DIM"])
    app.extensions["face_engine"] = engine
    app.extensions["embedding_cache"] = cache

    try:
        engine.load()
    except Exception:
        # Logged in detail inside FaceEngine.load(). The service still starts
        # so /health can report the failure clearly instead of the process
        # crash-looping with no diagnostic output reachable over HTTP.
        logger.critical(
            "AI service is starting in a DEGRADED state: the face model failed to load. "
            "All /ai/** endpoints will return 503 until this is fixed and the service restarted."
        )

    from app.api.routes import ai_bp
    from app.api.health import health_bp
    app.register_blueprint(ai_bp)
    app.register_blueprint(health_bp)

    logger.info(
        "FRHES AI service initialized. model_ready=%s cached_students=%d",
        engine.ready, cache.student_count(),
    )

    return app


def _apply_cors(app: Flask):
    origins = set(app.config["CORS_ORIGINS"])

    @app.after_request
    def _add_cors_headers(response):
        origin = None
        from flask import request
        req_origin = request.headers.get("Origin")
        if req_origin in origins:
            origin = req_origin
        if origin:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Headers"] = "Content-Type, X-API-Key, X-Correlation-Id"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, DELETE, OPTIONS"
        return response
