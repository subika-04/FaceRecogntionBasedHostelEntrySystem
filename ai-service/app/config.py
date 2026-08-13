"""
Central configuration for the FRHES AI Service.

Everything is driven by environment variables so the exact same image can be
promoted from local dev -> staging -> production without code changes.
Copy `.env.example` to `.env` and adjust values for your machine.
"""
import os
from pathlib import Path
from types import SimpleNamespace

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent

# Docker Compose injects real environment variables directly (via the
# `environment:` block reading the repo-root .env), so this is a no-op
# there. For local `python run.py` / `python wsgi.py` outside Docker,
# nothing else in this codebase ever called load_dotenv() despite
# python-dotenv being a listed dependency and .env.example documenting
# that it should load the file -- confirmed by actually running `python
# run.py` locally, which failed with "FLASK_API_KEY is not set" even
# though ai-service/.env had it set. override=False so real environment
# variables (as set by Docker/systemd/CI) still win over the .env file.
load_dotenv(BASE_DIR / ".env", override=False)


def _bool(env_name: str, default: bool) -> bool:
    val = os.getenv(env_name)
    if val is None:
        return default
    return val.strip().lower() in ("1", "true", "yes", "on")


def _float(env_name: str, default: float) -> float:
    val = os.getenv(env_name)
    try:
        return float(val) if val is not None else default
    except ValueError:
        return default


def _int(env_name: str, default: int) -> int:
    val = os.getenv(env_name)
    try:
        return int(val) if val is not None else default
    except ValueError:
        return default


class Config:
    # ---- Service identity ----
    SERVICE_NAME = "frhes-ai-service"
    ENV = os.getenv("FLASK_ENV", "production")
    DEBUG = _bool("FLASK_DEBUG", False)

    # ---- Networking ----
    HOST = os.getenv("AI_SERVICE_HOST", "0.0.0.0")
    PORT = _int("AI_SERVICE_PORT", 5000)

    # ---- Security ----
    # Must match `app.flask-ai.api-key` / FLASK_API_KEY in the Spring Boot backend.
    API_KEY = os.getenv("FLASK_API_KEY", "")
    # Comma-separated list of origins allowed to call this service directly
    # (normally only the Spring Boot backend calls it server-to-server, so this
    # is empty/disabled by default; only needed if you expose the service to a
    # browser directly during development).
    CORS_ORIGINS = [o.strip() for o in os.getenv("AI_CORS_ORIGINS", "").split(",") if o.strip()]

    # ---- Rate limiting ----
    RATE_LIMIT_ENABLED = _bool("AI_RATE_LIMIT_ENABLED", True)
    RATE_LIMIT_DEFAULT = os.getenv("AI_RATE_LIMIT_DEFAULT", "120 per minute")

    # ---- Model configuration (InsightFace) ----
    MODEL_NAME = os.getenv("AI_MODEL_NAME", "buffalo_l")
    MODEL_ROOT = os.getenv("AI_MODEL_ROOT", str(Path.home() / ".insightface"))
    # -1 = CPU, 0/1/... = GPU device id (requires onnxruntime-gpu)
    CTX_ID = _int("AI_CTX_ID", -1)
    DETECTION_SIZE = _int("AI_DETECTION_SIZE", 640)
    MIN_DETECTION_SCORE = _float("AI_MIN_DETECTION_SCORE", 0.55)

    # ---- Quality gate thresholds (enrollment) ----
    MIN_FACE_AREA_RATIO = _float("AI_MIN_FACE_AREA_RATIO", 0.06)   # face bbox area / image area
    MAX_FACE_AREA_RATIO = _float("AI_MAX_FACE_AREA_RATIO", 0.85)
    BLUR_VARIANCE_THRESHOLD = _float("AI_BLUR_VARIANCE_THRESHOLD", 60.0)
    MIN_BRIGHTNESS = _float("AI_MIN_BRIGHTNESS", 40.0)
    MAX_BRIGHTNESS = _float("AI_MAX_BRIGHTNESS", 215.0)
    MAX_CENTER_OFFSET_RATIO = _float("AI_MAX_CENTER_OFFSET_RATIO", 0.22)
    MAX_YAW_DEGREES = _float("AI_MAX_YAW_DEGREES", 35.0)
    MAX_ROLL_DEGREES = _float("AI_MAX_ROLL_DEGREES", 25.0)

    # ---- Recognition ----
    EMBEDDING_DIM = _int("AI_EMBEDDING_DIM", 512)

    # ---- Logging ----
    LOG_LEVEL = os.getenv("AI_LOG_LEVEL", "INFO")
    LOG_DIR = os.getenv("AI_LOG_DIR", str(BASE_DIR / "logs"))
    LOG_TO_FILE = _bool("AI_LOG_TO_FILE", True)

    # Keys read by app.engine.quality.assess_quality(). Flask's `current_app.config`
    # is a dict subclass (no attribute access), but quality.py is written against
    # a plain attribute-style object so it stays trivially unit-testable without
    # a Flask app context (see tests/test_quality.py's `make_config`). This helper
    # bridges the two without duplicating the threshold values anywhere.
    QUALITY_KEYS = (
        "MIN_BRIGHTNESS", "MAX_BRIGHTNESS", "BLUR_VARIANCE_THRESHOLD",
        "MIN_FACE_AREA_RATIO", "MAX_FACE_AREA_RATIO", "MAX_CENTER_OFFSET_RATIO",
        "MAX_YAW_DEGREES", "MAX_ROLL_DEGREES",
    )

    @classmethod
    def validate(cls):
        """Fail fast at startup if required config is missing/insecure."""
        problems = []
        if not cls.API_KEY:
            problems.append("FLASK_API_KEY is not set. Refusing to start with an open API.")
        if cls.API_KEY in ("secret-flask-api-key-12345", "changeme", "change-me"):
            problems.append(
                "FLASK_API_KEY is still set to a known placeholder value. "
                "Generate a real secret and update both this service and the Spring Boot .env."
            )
        return problems


def quality_thresholds_from(flask_config) -> SimpleNamespace:
    """Build the attribute-style config view `assess_quality()` expects from
    a Flask app's dict-style `current_app.config`."""
    return SimpleNamespace(**{key: flask_config[key] for key in Config.QUALITY_KEYS})
