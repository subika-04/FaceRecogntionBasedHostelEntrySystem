"""
In-RAM cache of every enrolled student's face embeddings, plus the
vectorized cosine-similarity search used by /ai/recognition/match.

Design notes (important for anyone scaling this beyond a single dev box):
  - All embeddings coming out of InsightFace's buffalo_l pack are already
    L2-normalized, so cosine similarity between two vectors is just their
    dot product. We defensively re-normalize on write in case a caller ever
    sends a non-normalized vector (e.g. reconstructed from storage).
  - The cache is protected by a single `threading.RLock`. That is correct
    and sufficient for Flask's built-in dev server or a single-worker
    Gunicorn/uvicorn process. It is *not* shared across multiple worker
    processes -- if you scale this service horizontally (multiple Gunicorn
    workers or multiple containers), each process/container gets its own
    independent cache. `StartupCacheSync` on the Spring Boot side already
    re-seeds the cache from MySQL on every backend restart, which covers a
    single-process deployment; for a true multi-worker deployment, replace
    this module's storage with Redis (a `HSET`/`SSCAN` + a vector index, or
    a proper vector DB such as pgvector/FAISS/Milvus) and keep the exact
    same public methods so nothing above this module has to change.
"""
import logging
import threading
from typing import Dict, List, Optional

import numpy as np

logger = logging.getLogger(__name__)


class EmbeddingCache:
    def __init__(self, embedding_dim: int):
        self._embedding_dim = embedding_dim
        self._lock = threading.RLock()
        # student_id -> { pose_name -> np.ndarray(embedding_dim,) }
        self._store: Dict[int, Dict[str, np.ndarray]] = {}
        # Rebuilt lazily on read after any mutation, for fast vectorized search.
        self._matrix: Optional[np.ndarray] = None       # shape (N, embedding_dim)
        self._owners: List[int] = []                     # owners[i] = student_id for matrix row i
        self._dirty = True

    # ---------------------------------------------------------------- writes
    def _normalize(self, vector) -> np.ndarray:
        arr = np.asarray(vector, dtype=np.float32).reshape(-1)
        if arr.shape[0] != self._embedding_dim:
            raise ValueError(f"Expected embedding of dimension {self._embedding_dim}, got {arr.shape[0]}")
        norm = np.linalg.norm(arr)
        return arr / norm if norm > 1e-9 else arr

    def replace_all(self, candidates: list):
        """
        Full resync, called by Spring Boot's StartupCacheSync on backend boot.
        `candidates` is a list of dicts: {"studentId": int, "embeddings": [{"pose": str, "vector": [float, ...]}]}
        """
        with self._lock:
            new_store: Dict[int, Dict[str, np.ndarray]] = {}
            skipped = 0
            for candidate in candidates:
                student_id = candidate.get("studentId")
                embeddings = candidate.get("embeddings") or []
                if student_id is None:
                    skipped += 1
                    continue
                pose_map = {}
                for item in embeddings:
                    pose = item.get("pose")
                    vector = item.get("vector")
                    if pose is None or vector is None:
                        continue
                    try:
                        pose_map[pose] = self._normalize(vector)
                    except ValueError as exc:
                        logger.warning("Skipping malformed embedding for student %s pose %s: %s",
                                        student_id, pose, exc)
                if pose_map:
                    new_store[int(student_id)] = pose_map
            self._store = new_store
            self._dirty = True
            logger.info(
                "Cache fully resynced: %d students loaded (%d skipped due to malformed data).",
                len(new_store), skipped,
            )

    def upsert_student(self, student_id: int, embeddings: list):
        """Used after a (re-)enrollment completes for a single student."""
        with self._lock:
            pose_map = {}
            for item in embeddings:
                pose = item.get("pose")
                vector = item.get("vector")
                if pose is None or vector is None:
                    continue
                pose_map[pose] = self._normalize(vector)
            if pose_map:
                self._store[int(student_id)] = pose_map
            else:
                self._store.pop(int(student_id), None)
            self._dirty = True
            logger.info("Cache updated for student %s (%d pose embeddings).", student_id, len(pose_map))

    def remove_student(self, student_id: int) -> bool:
        with self._lock:
            existed = self._store.pop(int(student_id), None) is not None
            if existed:
                self._dirty = True
                logger.info("Cache entry removed for student %s.", student_id)
            return existed

    def clear(self):
        with self._lock:
            self._store.clear()
            self._dirty = True

    # ----------------------------------------------------------------- reads
    def student_count(self) -> int:
        with self._lock:
            return len(self._store)

    def embedding_count(self) -> int:
        with self._lock:
            return sum(len(poses) for poses in self._store.values())

    def _rebuild_matrix_if_needed(self):
        if not self._dirty:
            return
        rows = []
        owners = []
        for student_id, pose_map in self._store.items():
            for _pose, vector in pose_map.items():
                rows.append(vector)
                owners.append(student_id)
        self._matrix = np.vstack(rows) if rows else np.zeros((0, self._embedding_dim), dtype=np.float32)
        self._owners = owners
        self._dirty = False

    def match(self, probe_embedding) -> tuple:
        """
        Returns (best_student_id_or_None, best_similarity_float).
        Similarity is cosine similarity in [-1, 1] (in practice ~[0, 1] for
        genuine face embeddings), taken as the single best-scoring stored
        embedding across all students and all poses -- not an average, since
        averaging across poses would unfairly penalize a perfect frontal
        match against a poor side-profile enrollment sample.
        """
        with self._lock:
            self._rebuild_matrix_if_needed()
            matrix = self._matrix
            owners = self._owners

        if matrix is None or matrix.shape[0] == 0:
            return None, 0.0

        probe = np.asarray(probe_embedding, dtype=np.float32).reshape(-1)
        if probe.shape[0] != self._embedding_dim:
            raise ValueError(f"Expected probe embedding of dimension {self._embedding_dim}, got {probe.shape[0]}")
        norm = np.linalg.norm(probe)
        if norm > 1e-9:
            probe = probe / norm

        # Both sides are L2-normalized -> dot product == cosine similarity.
        similarities = matrix @ probe
        best_idx = int(np.argmax(similarities))
        best_score = float(similarities[best_idx])
        best_student_id = owners[best_idx]
        return best_student_id, max(0.0, min(1.0, best_score))
