"""
Structured, rotating logging for the AI service.

Every request gets a correlation id so a single recognition attempt can be
traced across the Spring Boot logs and the AI service logs (the correlation
id is accepted from the incoming `X-Correlation-Id` header if the caller
supplies one, otherwise one is generated).
"""
import logging
import os
import sys
import uuid
from logging.handlers import RotatingFileHandler

from flask import g, has_request_context, request


class CorrelationIdFilter(logging.Filter):
    def filter(self, record):
        if has_request_context():
            record.correlation_id = getattr(g, "correlation_id", "-")
        else:
            record.correlation_id = "-"
        return True


LOG_FORMAT = "%(asctime)s [%(levelname)s] [corr=%(correlation_id)s] %(name)s: %(message)s"


def configure_logging(app):
    level = getattr(logging, app.config.get("LOG_LEVEL", "INFO").upper(), logging.INFO)

    root = logging.getLogger()
    root.setLevel(level)
    # Avoid duplicate handlers if the reloader re-imports this module.
    root.handlers.clear()

    corr_filter = CorrelationIdFilter()
    formatter = logging.Formatter(LOG_FORMAT)

    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    console_handler.addFilter(corr_filter)
    root.addHandler(console_handler)

    if app.config.get("LOG_TO_FILE", True):
        log_dir = app.config.get("LOG_DIR")
        os.makedirs(log_dir, exist_ok=True)
        file_handler = RotatingFileHandler(
            os.path.join(log_dir, "ai-service.log"),
            maxBytes=10 * 1024 * 1024,
            backupCount=5,
        )
        file_handler.setFormatter(formatter)
        file_handler.addFilter(corr_filter)
        root.addHandler(file_handler)

    # Werkzeug's own access log is noisy at INFO; keep it but let our filter apply.
    logging.getLogger("werkzeug").addFilter(corr_filter)

    @app.before_request
    def _assign_correlation_id():
        g.correlation_id = request.headers.get("X-Correlation-Id", str(uuid.uuid4())[:8])

    @app.after_request
    def _echo_correlation_id(response):
        response.headers["X-Correlation-Id"] = getattr(g, "correlation_id", "-")
        return response

    return root
