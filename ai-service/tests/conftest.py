import numpy as np
import pytest

from app import create_app
from app.config import Config


TEST_API_KEY = "test-api-key-for-pytest-only"


class TestConfig(Config):
    DEBUG = True
    API_KEY = TEST_API_KEY
    RATE_LIMIT_ENABLED = False
    LOG_TO_FILE = False
    EMBEDDING_DIM = 8


class FakeDetectedFace:
    def __init__(self, embedding, bbox=(10.0, 10.0, 100.0, 100.0), det_score=0.99):
        self.embedding = np.asarray(embedding, dtype=np.float32)
        self.bbox = list(bbox)
        self.det_score = det_score
        self.landmarks = None
        self.yaw = self.pitch = self.roll = 0.0

    def bbox_area_ratio(self, image_shape):
        h, w = image_shape[:2]
        x1, y1, x2, y2 = self.bbox
        return ((x2 - x1) * (y2 - y1)) / float(w * h)

    def center_offset_ratio(self, image_shape):
        return 0.05


class FakeFaceEngine:
    """
    Drop-in replacement for engine.face_engine.FaceEngine that never touches
    InsightFace/onnxruntime, so route-level tests can run in any environment.
    Tests control what it "detects" via `next_faces`.
    """
    def __init__(self):
        self.ready = True
        self.load_error = None
        self.next_faces = []  # test sets this before calling an endpoint

    def detect_faces(self, image_bgr):
        return self.next_faces

    def largest_face(self, faces, image_shape):
        if not faces:
            return None
        return max(faces, key=lambda f: f.bbox_area_ratio(image_shape))


@pytest.fixture()
def fake_engine():
    return FakeFaceEngine()


@pytest.fixture()
def app(fake_engine):
    flask_app = create_app(config_object=TestConfig)
    # Swap the real (unloaded) engine for our deterministic fake.
    flask_app.extensions["face_engine"] = fake_engine
    flask_app.extensions["embedding_cache"].clear()
    yield flask_app


@pytest.fixture()
def client(app):
    return app.test_client()


@pytest.fixture()
def auth_headers():
    return {"X-API-Key": TEST_API_KEY, "Content-Type": "application/json"}
