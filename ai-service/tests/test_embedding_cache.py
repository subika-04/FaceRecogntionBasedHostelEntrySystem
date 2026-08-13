import numpy as np
import pytest

from app.cache.embedding_cache import EmbeddingCache

DIM = 8


def unit_vector(seed: int) -> np.ndarray:
    rng = np.random.default_rng(seed)
    v = rng.normal(size=DIM).astype(np.float32)
    return v / np.linalg.norm(v)


def test_empty_cache_returns_no_match():
    cache = EmbeddingCache(embedding_dim=DIM)
    student_id, confidence = cache.match(unit_vector(1))
    assert student_id is None
    assert confidence == 0.0


def test_exact_match_returns_high_confidence():
    cache = EmbeddingCache(embedding_dim=DIM)
    vec = unit_vector(42)
    cache.upsert_student(101, [{"pose": "STRAIGHT", "vector": vec.tolist()}])

    student_id, confidence = cache.match(vec)

    assert student_id == 101
    assert confidence > 0.999  # identical normalized vector -> cosine similarity ~1.0


def test_distinguishes_between_students():
    cache = EmbeddingCache(embedding_dim=DIM)
    cache.replace_all([
        {"studentId": 1, "embeddings": [{"pose": "STRAIGHT", "vector": unit_vector(1).tolist()}]},
        {"studentId": 2, "embeddings": [{"pose": "STRAIGHT", "vector": unit_vector(2).tolist()}]},
        {"studentId": 3, "embeddings": [{"pose": "STRAIGHT", "vector": unit_vector(3).tolist()}]},
    ])

    for seed, expected_id in [(1, 1), (2, 2), (3, 3)]:
        student_id, confidence = cache.match(unit_vector(seed))
        assert student_id == expected_id
        assert confidence > 0.99


def test_upsert_overwrites_previous_embeddings_for_same_student():
    cache = EmbeddingCache(embedding_dim=DIM)
    cache.upsert_student(5, [{"pose": "STRAIGHT", "vector": unit_vector(10).tolist()}])
    assert cache.student_count() == 1

    cache.upsert_student(5, [{"pose": "STRAIGHT", "vector": unit_vector(20).tolist()}])
    assert cache.student_count() == 1  # still one student, embeddings replaced not accumulated

    student_id, confidence = cache.match(unit_vector(20))
    assert student_id == 5
    assert confidence > 0.99


def test_remove_student_drops_from_search_results():
    cache = EmbeddingCache(embedding_dim=DIM)
    cache.upsert_student(7, [{"pose": "STRAIGHT", "vector": unit_vector(7).tolist()}])
    assert cache.remove_student(7) is True
    assert cache.remove_student(7) is False  # already gone, idempotent no-op

    student_id, confidence = cache.match(unit_vector(7))
    assert student_id is None
    assert confidence == 0.0


def test_replace_all_skips_malformed_candidates_without_crashing():
    cache = EmbeddingCache(embedding_dim=DIM)
    cache.replace_all([
        {"studentId": None, "embeddings": []},                       # missing id -> skipped
        {"studentId": 9, "embeddings": [{"pose": "STRAIGHT", "vector": [1, 2]}]},  # wrong dim -> skipped
        {"studentId": 10, "embeddings": [{"pose": "STRAIGHT", "vector": unit_vector(10).tolist()}]},
    ])
    assert cache.student_count() == 1
    student_id, _ = cache.match(unit_vector(10))
    assert student_id == 10


def test_match_rejects_wrong_dimension_probe():
    cache = EmbeddingCache(embedding_dim=DIM)
    cache.upsert_student(1, [{"pose": "STRAIGHT", "vector": unit_vector(1).tolist()}])
    with pytest.raises(ValueError):
        cache.match([0.1, 0.2, 0.3])  # wrong length
