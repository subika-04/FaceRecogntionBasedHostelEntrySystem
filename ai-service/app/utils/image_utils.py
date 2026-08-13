"""
Turning the base64 strings the frontend/backend send into OpenCV BGR arrays,
with defensive validation at every step -- this boundary is the single
biggest source of "works on my machine" bugs in face pipelines (truncated
base64, wrong MIME prefix, corrupt JPEG, huge images that blow up memory).
"""
import base64
import binascii
import logging

import cv2
import numpy as np

from app.errors import InvalidImageError

logger = logging.getLogger(__name__)

MAX_DECODED_BYTES = 15 * 1024 * 1024  # 15 MB safety cap after base64 decoding
MAX_DIMENSION = 4096  # reject absurdly large images before they hit the model


def strip_data_url_prefix(base64_str: str) -> str:
    """Accepts both raw base64 and `data:image/jpeg;base64,...` data URLs."""
    if not base64_str:
        return base64_str
    if "," in base64_str[:64]:
        return base64_str.split(",", 1)[1]
    return base64_str


def decode_base64_image(base64_str: str) -> np.ndarray:
    """
    Decode a base64-encoded image into a BGR np.ndarray suitable for OpenCV
    and InsightFace. Raises InvalidImageError (HTTP 400) on any failure so
    the caller gets a clear, actionable error instead of a 500.
    """
    if not base64_str or not isinstance(base64_str, str):
        raise InvalidImageError("Request is missing a valid base64 'image' field.")

    cleaned = strip_data_url_prefix(base64_str).strip()

    try:
        raw_bytes = base64.b64decode(cleaned, validate=False)
    except (binascii.Error, ValueError) as exc:
        raise InvalidImageError(f"Could not decode base64 image payload: {exc}") from exc

    if len(raw_bytes) == 0:
        raise InvalidImageError("Decoded image payload is empty.")
    if len(raw_bytes) > MAX_DECODED_BYTES:
        raise InvalidImageError(
            f"Decoded image is {len(raw_bytes) / (1024 * 1024):.1f}MB, "
            f"which exceeds the {MAX_DECODED_BYTES / (1024 * 1024):.0f}MB limit."
        )

    np_buffer = np.frombuffer(raw_bytes, dtype=np.uint8)
    image_bgr = cv2.imdecode(np_buffer, cv2.IMREAD_COLOR)

    if image_bgr is None:
        raise InvalidImageError("Payload is not a decodable image (unsupported or corrupt format).")

    height, width = image_bgr.shape[:2]
    if height == 0 or width == 0:
        raise InvalidImageError("Decoded image has zero width or height.")
    if height > MAX_DIMENSION or width > MAX_DIMENSION:
        raise InvalidImageError(
            f"Image dimensions {width}x{height} exceed the maximum allowed {MAX_DIMENSION}px."
        )

    return image_bgr


def to_grayscale(image_bgr: np.ndarray) -> np.ndarray:
    return cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
