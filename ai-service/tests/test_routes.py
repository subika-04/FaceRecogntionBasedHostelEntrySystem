import base64

import cv2
import numpy as np

from tests.conftest import FakeDetectedFace


def _jpeg_b64(size=200, mean=128):
    rng = np.random.default_rng(0)
    img = np.clip(rng.normal(loc=mean, scale=40, size=(size, size, 3)), 0, 255).astype(np.uint8)
    ok, buf = cv2.imencode(".jpg", img)
    assert ok
    return base64.b64encode(buf.tobytes()).decode("ascii")


# --------------------------------------------------------------------- health

def test_health_is_public_and_reports_model_state(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    body = resp.get_json()
    assert body["modelReady"] is True  # fake engine reports ready=True
    assert "cachedStudents" in body


# ----------------------------------------------------------------------- auth

def test_protected_endpoint_without_api_key_is_rejected(client):
    resp = client.post("/ai/embeddings/generate", json={"image": "irrelevant"})
    assert resp.status_code == 401


def test_protected_endpoint_with_wrong_api_key_is_rejected(client):
    resp = client.post(
        "/ai/embeddings/generate",
        json={"image": "irrelevant"},
        headers={"X-API-Key": "wrong-key"},
    )
    assert resp.status_code == 401


# ---------------------------------------------------------- embeddings/generate

def test_generate_embeddings_no_face_returns_empty_list_not_error(client, auth_headers, fake_engine):
    fake_engine.next_faces = []
    resp = client.post("/ai/embeddings/generate", json={"image": _jpeg_b64()}, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.get_json()["embeddings"] == []


def test_generate_embeddings_returns_largest_face(client, auth_headers, fake_engine):
    small = FakeDetectedFace(embedding=[0.1] * 8, bbox=(0, 0, 10, 10))
    big = FakeDetectedFace(embedding=[0.2] * 8, bbox=(0, 0, 150, 150))
    fake_engine.next_faces = [small, big]

    resp = client.post("/ai/embeddings/generate", json={"image": _jpeg_b64()}, headers=auth_headers)
    assert resp.status_code == 200
    body = resp.get_json()
    assert len(body["embeddings"]) == 1
    assert body["embeddings"][0]["embedding"] == [round(0.2, 8)] * 8


def test_generate_embeddings_missing_image_field_is_422(client, auth_headers):
    resp = client.post("/ai/embeddings/generate", json={}, headers=auth_headers)
    assert resp.status_code == 422


def test_generate_embeddings_bad_base64_is_400(client, auth_headers):
    resp = client.post("/ai/embeddings/generate", json={"image": "!!!not-base64!!!"}, headers=auth_headers)
    assert resp.status_code == 400


# -------------------------------------------------------------- quality/check

def test_quality_check_accepts_a_good_frame(client, auth_headers, fake_engine):
    fake_engine.next_faces = [FakeDetectedFace(embedding=[0.1] * 8, bbox=(50, 50, 150, 150))]
    resp = client.post("/ai/quality/check", json={"image": _jpeg_b64()}, headers=auth_headers)
    assert resp.status_code == 200
    body = resp.get_json()
    assert body["accepted"] is True
    assert body["quality"]["faceDetected"] is True
    assert body["quality"]["singleFace"] is True


def test_quality_check_rejects_when_no_face(client, auth_headers, fake_engine):
    fake_engine.next_faces = []
    resp = client.post("/ai/quality/check", json={"image": _jpeg_b64()}, headers=auth_headers)
    assert resp.status_code == 200  # quality check itself is a normal 200; "accepted" carries the verdict
    body = resp.get_json()
    assert body["accepted"] is False
    assert body["reason"] == "NO_FACE_DETECTED"


# ------------------------------------------------------------- recognition/match

def test_match_with_empty_cache_returns_null_student(client, auth_headers):
    resp = client.post("/ai/recognition/match", json={"probeEmbedding": [0.1] * 8}, headers=auth_headers)
    assert resp.status_code == 200
    body = resp.get_json()
    assert body["bestMatchStudentId"] is None
    assert body["confidence"] == 0.0


def test_full_enroll_then_match_cycle(client, auth_headers):
    vector = [1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]

    sync_resp = client.post(
        "/ai/cache/refresh-student",
        json={"studentId": 55, "embeddings": [{"pose": "STRAIGHT", "vector": vector}]},
        headers=auth_headers,
    )
    assert sync_resp.status_code == 200

    match_resp = client.post("/ai/recognition/match", json={"probeEmbedding": vector}, headers=auth_headers)
    assert match_resp.status_code == 200
    body = match_resp.get_json()
    assert body["bestMatchStudentId"] == 55
    assert body["confidence"] > 0.99


def test_delete_student_cache_removes_match_candidate(client, auth_headers):
    vector = [0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]
    client.post("/ai/cache/refresh-student", json={"studentId": 9, "embeddings": [{"pose": "STRAIGHT", "vector": vector}]}, headers=auth_headers)

    del_resp = client.delete("/ai/cache/student/9", headers=auth_headers)
    assert del_resp.status_code == 200
    assert del_resp.get_json()["removed"] is True

    match_resp = client.post("/ai/recognition/match", json={"probeEmbedding": vector}, headers=auth_headers)
    assert match_resp.get_json()["bestMatchStudentId"] is None


def test_cache_sync_replaces_entire_cache(client, auth_headers):
    payload = [
        {"studentId": 1, "embeddings": [{"pose": "STRAIGHT", "vector": [1, 0, 0, 0, 0, 0, 0, 0]}]},
        {"studentId": 2, "embeddings": [{"pose": "STRAIGHT", "vector": [0, 1, 0, 0, 0, 0, 0, 0]}]},
    ]
    resp = client.post("/ai/cache/sync", json=payload, headers=auth_headers)
    assert resp.status_code == 200
    body = resp.get_json()
    assert body["studentsLoaded"] == 2
