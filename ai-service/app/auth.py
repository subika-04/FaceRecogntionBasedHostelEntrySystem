"""
API key enforcement for every /ai/** route.

The Spring Boot backend is the only intended caller of this service, and it
authenticates itself with a static, shared secret sent as `X-API-Key`
(configured on both sides via FLASK_API_KEY). This is deliberately simple
(no OAuth/JWT here) because this is an internal, server-to-server call that
never reaches a browser directly -- but it is still checked with a
constant-time comparison to avoid timing side-channels, and the service
refuses to start at all if no key is configured (see config.Config.validate).
"""
import hmac
from functools import wraps

from flask import current_app, request

from app.errors import UnauthorizedError


def require_api_key(view_func):
    @wraps(view_func)
    def wrapped(*args, **kwargs):
        expected = current_app.config.get("API_KEY", "")
        provided = request.headers.get("X-API-Key", "")

        if not expected:
            # Should never happen in a correctly started service (Config.validate
            # blocks startup), but fail closed rather than open if it ever does.
            raise UnauthorizedError("AI service has no API key configured; rejecting all requests.")

        if not provided or not hmac.compare_digest(provided, expected):
            raise UnauthorizedError("Missing or invalid X-API-Key header.")

        return view_func(*args, **kwargs)

    return wrapped
