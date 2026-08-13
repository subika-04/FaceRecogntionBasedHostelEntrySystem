"""
Typed exceptions + a single place that turns them into consistent JSON error
responses. Mirrors the shape of GlobalExceptionHandler on the Spring Boot side
so logs/tickets referencing "AI service returned 4xx: {...}" are easy to read
on both ends of the wire.
"""
import logging
from datetime import datetime, timezone

from flask import jsonify

logger = logging.getLogger(__name__)


class AIServiceError(Exception):
    """Base class for all deliberate, handled errors in this service."""
    status_code = 500
    error_code = "AI_SERVICE_ERROR"

    def __init__(self, message, status_code=None, details=None):
        super().__init__(message)
        self.message = message
        if status_code is not None:
            self.status_code = status_code
        self.details = details or {}


class InvalidImageError(AIServiceError):
    status_code = 400
    error_code = "INVALID_IMAGE"


class UnauthorizedError(AIServiceError):
    status_code = 401
    error_code = "UNAUTHORIZED"


class ValidationError(AIServiceError):
    status_code = 422
    error_code = "VALIDATION_ERROR"


class ModelNotReadyError(AIServiceError):
    status_code = 503
    error_code = "MODEL_NOT_READY"


def _error_body(error_code, message, status_code, details=None):
    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "status": status_code,
        "errorCode": error_code,
        "message": message,
        "details": details or {},
    }


def register_error_handlers(app):

    @app.errorhandler(AIServiceError)
    def handle_ai_service_error(err):
        logger.warning("Handled AIServiceError: %s (%s)", err.message, err.error_code)
        return jsonify(_error_body(err.error_code, err.message, err.status_code, err.details)), err.status_code

    @app.errorhandler(404)
    def handle_not_found(err):
        return jsonify(_error_body("NOT_FOUND", "The requested resource does not exist.", 404)), 404

    @app.errorhandler(405)
    def handle_method_not_allowed(err):
        return jsonify(_error_body("METHOD_NOT_ALLOWED", "HTTP method not allowed for this endpoint.", 405)), 405

    @app.errorhandler(413)
    def handle_payload_too_large(err):
        return jsonify(_error_body("PAYLOAD_TOO_LARGE", "Uploaded image exceeds the maximum allowed size.", 413)), 413

    @app.errorhandler(Exception)
    def handle_unexpected(err):
        logger.exception("Unhandled exception in AI service")
        return jsonify(
            _error_body("INTERNAL_ERROR", "An unexpected error occurred while processing the request.", 500)
        ), 500
