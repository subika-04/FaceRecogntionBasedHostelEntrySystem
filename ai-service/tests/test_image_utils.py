import base64

import cv2
import numpy as np
import pytest

from app.errors import InvalidImageError
from app.utils.image_utils import decode_base64_image, strip_data_url_prefix


def _make_jpeg_base64(width=64, height=64) -> str:
    img = np.full((height, width, 3), 128, dtype=np.uint8)
    ok, buf = cv2.imencode(".jpg", img)
    assert ok
    return base64.b64encode(buf.tobytes()).decode("ascii")


def test_strip_data_url_prefix_removes_prefix():
    raw = "iVBORw0KGgo="
    assert strip_data_url_prefix(f"data:image/png;base64,{raw}") == raw


def test_strip_data_url_prefix_passthrough_when_no_prefix():
    raw = "iVBORw0KGgo="
    assert strip_data_url_prefix(raw) == raw


def test_decode_valid_jpeg_roundtrip():
    b64 = _make_jpeg_base64(32, 32)
    image = decode_base64_image(b64)
    assert image is not None
    assert image.shape[0] == 32 and image.shape[1] == 32
    assert image.shape[2] == 3


def test_decode_with_data_url_prefix():
    b64 = _make_jpeg_base64(16, 16)
    image = decode_base64_image(f"data:image/jpeg;base64,{b64}")
    assert image.shape[:2] == (16, 16)


def test_decode_empty_string_raises():
    with pytest.raises(InvalidImageError):
        decode_base64_image("")


def test_decode_garbage_base64_raises():
    with pytest.raises(InvalidImageError):
        decode_base64_image("not-valid-base64!!!")


def test_decode_valid_base64_but_not_an_image_raises():
    junk = base64.b64encode(b"this is not an image, just text").decode("ascii")
    with pytest.raises(InvalidImageError):
        decode_base64_image(junk)
