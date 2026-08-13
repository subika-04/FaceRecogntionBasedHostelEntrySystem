import types

import numpy as np

from app.engine.quality import assess_quality


class FakeFace:
    def __init__(self, area_ratio=0.2, center_offset=0.0, yaw=0.0, roll=0.0):
        self._area_ratio = area_ratio
        self._center_offset = center_offset
        self.yaw = yaw
        self.roll = roll

    def bbox_area_ratio(self, _shape):
        return self._area_ratio

    def center_offset_ratio(self, _shape):
        return self._center_offset


def make_config(**overrides):
    defaults = dict(
        MIN_BRIGHTNESS=40.0,
        MAX_BRIGHTNESS=215.0,
        BLUR_VARIANCE_THRESHOLD=60.0,
        MIN_FACE_AREA_RATIO=0.06,
        MAX_FACE_AREA_RATIO=0.85,
        MAX_CENTER_OFFSET_RATIO=0.22,
        MAX_YAW_DEGREES=35.0,
        MAX_ROLL_DEGREES=25.0,
    )
    defaults.update(overrides)
    return types.SimpleNamespace(**defaults)


def sharp_bright_image(size=200, mean=128):
    # Random noise is "sharp" (high Laplacian variance) and mid-brightness by construction.
    rng = np.random.default_rng(0)
    img = np.clip(rng.normal(loc=mean, scale=40, size=(size, size, 3)), 0, 255).astype(np.uint8)
    return img


def flat_image(size=200, value=128):
    # A perfectly flat image has ~zero Laplacian variance -> "blurry".
    return np.full((size, size, 3), value, dtype=np.uint8)


def test_no_face_rejected():
    result = assess_quality(sharp_bright_image(), [], make_config())
    assert result.accepted is False
    assert result.reason == "NO_FACE_DETECTED"
    assert result.face_detected is False


def test_multiple_faces_rejected():
    faces = [FakeFace(), FakeFace()]
    result = assess_quality(sharp_bright_image(), faces, make_config())
    assert result.accepted is False
    assert result.reason == "MULTIPLE_FACES_DETECTED"


def test_blurry_image_rejected():
    result = assess_quality(flat_image(), [FakeFace()], make_config())
    assert result.accepted is False
    assert result.reason == "IMAGE_TOO_BLURRY"


def test_too_dark_rejected():
    img = sharp_bright_image(mean=10)
    result = assess_quality(img, [FakeFace()], make_config())
    assert result.accepted is False
    assert result.reason in ("TOO_DARK", "IMAGE_TOO_BLURRY")


def test_face_too_small_rejected():
    result = assess_quality(sharp_bright_image(), [FakeFace(area_ratio=0.01)], make_config())
    assert result.accepted is False
    assert result.reason == "FACE_TOO_SMALL"


def test_face_not_centered_rejected():
    result = assess_quality(sharp_bright_image(), [FakeFace(center_offset=0.5)], make_config())
    assert result.accepted is False
    assert result.reason == "FACE_NOT_CENTERED"


def test_head_tilted_rejected():
    result = assess_quality(sharp_bright_image(), [FakeFace(roll=40)], make_config())
    assert result.accepted is False
    assert result.reason == "HEAD_TILTED"


def test_good_frame_accepted():
    result = assess_quality(sharp_bright_image(), [FakeFace(area_ratio=0.2, center_offset=0.05)], make_config())
    assert result.accepted is True
    assert result.reason == "OK"
    assert result.face_detected is True
    assert result.single_face is True
