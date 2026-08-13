"""
A minimal, dependency-free sliding-window rate limiter.

This service is normally called only by the Spring Boot backend from inside
your own network, so this exists as a defensive backstop (e.g. against a bug
in the caller retrying in a tight loop) rather than as internet-facing abuse
protection. If you later expose this service more broadly, swap this for
`Flask-Limiter` backed by Redis so limits are shared across worker processes
-- this in-memory version is per-process only, same caveat as the embedding
cache (see cache/embedding_cache.py's module docstring).
"""
import threading
import time
from collections import deque

from flask import current_app, jsonify, request


class SlidingWindowRateLimiter:
    def __init__(self):
        self._lock = threading.Lock()
        self._hits = {}  # key -> deque[timestamps]

    def _parse_limit(self, limit_str: str):
        # "120 per minute" -> (120, 60.0)
        try:
            count_str, _, period = limit_str.partition(" per ")
            count = int(count_str.strip())
            period = period.strip().lower()
            seconds = {"second": 1, "minute": 60, "hour": 3600, "day": 86400}.get(period, 60)
            return count, float(seconds)
        except Exception:
            return 120, 60.0

    def allow(self, key: str, limit_str: str) -> bool:
        limit, window_seconds = self._parse_limit(limit_str)
        now = time.monotonic()
        with self._lock:
            bucket = self._hits.setdefault(key, deque())
            while bucket and now - bucket[0] > window_seconds:
                bucket.popleft()
            if len(bucket) >= limit:
                return False
            bucket.append(now)
            return True


_limiter = SlidingWindowRateLimiter()


def init_rate_limiting(app):
    if not app.config.get("RATE_LIMIT_ENABLED", True):
        return

    @app.before_request
    def _enforce_rate_limit():
        if request.path == "/health":
            return None
        # Keyed by caller IP; since the only expected caller is the backend,
        # this effectively limits total backend throughput as a safety valve.
        key = request.headers.get("X-Forwarded-For", request.remote_addr or "unknown")
        limit_str = current_app.config.get("RATE_LIMIT_DEFAULT", "120 per minute")
        if not _limiter.allow(key, limit_str):
            return jsonify({
                "status": 429,
                "errorCode": "RATE_LIMITED",
                "message": f"Rate limit exceeded ({limit_str}). Slow down and retry shortly.",
            }), 429
        return None
