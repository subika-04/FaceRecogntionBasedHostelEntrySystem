# FRHES AI Service (Flask + InsightFace)

The third tier of the Face Recognition Hostel Entry System. This service owns
everything camera-frame-related: face detection, alignment, quality gating
for enrollment, embedding generation, and cosine-similarity matching against
an in-memory cache of every enrolled student. The Spring Boot backend is the
only intended caller (see `FlaskAiClientService.java`).

## 1. Quick start (local development)

```bash
cd ai-service
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env: set FLASK_API_KEY to the SAME value as FLASK_API_KEY in backend/.env

python run.py
# -> AI service listening on http://localhost:5000
```

The first time `FaceAnalysis(name="buffalo_l").prepare(...)` runs, InsightFace
downloads the model weights (~300MB) to `AI_MODEL_ROOT` (`~/.insightface` by
default). **This requires internet access on first run only** — after that,
the weights are cached on disk and no further downloads happen. If your
deployment environment has no internet access at all, pre-download the
`buffalo_l` pack on a machine that does and copy the `~/.insightface`
directory into the container/host before starting the service.

Check it came up correctly:
```bash
curl http://localhost:5000/health
# {"status":"ok","modelReady":true,"cachedStudents":0,...}
```

If `modelReady` is `false`, check `modelLoadError` in the same response and
the service logs — the two most common causes are no internet on first run
and a missing/incompatible `onnxruntime` build for your CPU/OS.

## 2. Running with Docker

```bash
docker build -t frhes-ai-service .
docker run --env-file .env -p 5000:5000 -v frhes-model-cache:/home/appuser/.insightface frhes-ai-service
```

Or use the root `docker-compose.yml`, which wires this service together with
the Spring Boot backend, MySQL, and the React frontend in one command (see
the repository root `README.md`).

## 3. API contract (must match `FlaskAiClientService.java` exactly)

All endpoints below except `/health` require an `X-API-Key` header matching
`FLASK_API_KEY`.

| Method | Path | Request body | Response body |
|---|---|---|---|
| GET | `/health` | — | `{status, modelReady, cachedStudents, cachedEmbeddings, ...}` |
| POST | `/ai/quality/check` | `{"image": "<base64>"}` | `{"accepted": bool, "reason": str, "quality": {faceDetected, singleFace, sharpness, lighting, centered}}` |
| POST | `/ai/embeddings/generate` | `{"image": "<base64>"}` | `{"embeddings": [{"bbox": [x1,y1,x2,y2], "embedding": [512 floats]}]}` (empty list if no face — **this is a 200, not an error**) |
| POST | `/ai/recognition/match` | `{"probeEmbedding": [512 floats]}` | `{"bestMatchStudentId": int\|null, "confidence": float}` |
| POST | `/ai/cache/sync` | `[{"studentId": int, "embeddings": [{"pose": str, "vector": [floats]}]}]` | `{"message", "studentsLoaded", "embeddingsLoaded"}` |
| POST | `/ai/cache/refresh-student` | `{"studentId": int, "embeddings": [{"pose": str, "vector": [floats]}]}` | `{"message", "poseCount"}` |
| DELETE | `/ai/cache/student/<id>` | — | `{"message", "removed": bool}` |

## 4. Why embeddings/generate returns 200+empty-list instead of an error

`RecognitionService.java` treats an empty `embeddings` array as the normal
"nobody in frame / unrecognizable" case and converts it into a clean
`UNKNOWN` recognition result on its own. If this service instead returned a
4xx/5xx here, the Java client would wrap it in a generic `AiServiceException`
and the recognition attempt would be logged as a *system failure* rather than
a normal "no match" — which would pollute your error monitoring with noise
every time someone simply isn't facing the camera. Keep this behavior if you
ever modify this endpoint.

## 5. Scaling beyond one process

The embedding cache (`app/cache/embedding_cache.py`) and the rate limiter
(`app/rate_limit.py`) are both **in-process, in-memory** structures protected
by a thread lock. That is correct and sufficient for a single Gunicorn worker
(`-w 1`, the Dockerfile default) because `StartupCacheSync` on the Spring
Boot side re-seeds the cache from MySQL every time the backend restarts.

If you need to scale this service horizontally (multiple workers/containers):
1. Replace `EmbeddingCache`'s internal dict + matrix with Redis (`HSET` per
   student) or a vector database (pgvector, FAISS server, Milvus) so all
   workers see the same data.
2. Replace `SlidingWindowRateLimiter` with `Flask-Limiter` backed by the same
   Redis instance.
3. Keep the public method signatures on `EmbeddingCache` identical
   (`replace_all`, `upsert_student`, `remove_student`, `match`) so
   `app/api/routes.py` doesn't need to change at all.

## 6. Tuning quality-gate thresholds

Every threshold in `.env.example`'s "Quality gate" section is a starting
point tuned for a typical laptop webcam at ~640x480–1280x720. If enrollment
is rejecting too many legitimate frames (or accepting too many bad ones) in
your actual lighting/camera setup, adjust these rather than changing code:

- `AI_BLUR_VARIANCE_THRESHOLD` — lower it if a decent camera is still being
  flagged as too blurry; raise it if visibly blurry frames are getting through.
- `AI_MIN_BRIGHTNESS` / `AI_MAX_BRIGHTNESS` — adjust for your rooms' lighting.
- `AI_MIN_FACE_AREA_RATIO` — lower it if the enrollment kiosk camera is far
  from the subject.

## 7. Running the test suite

```bash
pip install pytest
pytest -v
```

All tests run against a stubbed face-detection engine (`tests/conftest.py`'s
`FakeFaceEngine`) so they execute in milliseconds and require **no** model
weights, GPU, or internet access — they validate the Flask layer (routing,
auth, validation, error handling, the cache/matching math) independently of
InsightFace itself. That means a green test run does not by itself prove
recognition accuracy against real faces; validate that separately against a
real dataset before relying on the configured thresholds in production.
