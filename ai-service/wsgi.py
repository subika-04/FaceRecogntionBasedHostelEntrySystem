"""
Production entrypoint: `gunicorn -w 1 -b 0.0.0.0:5000 wsgi:app`

NOTE on worker count: keep `-w 1` unless you move the embedding cache to a
shared store (Redis/pgvector/FAISS server). Each Gunicorn worker is a
separate process with its own copy of the in-RAM cache (see
app/cache/embedding_cache.py's docstring) -- running multiple workers today
would mean some requests get routed to a worker whose cache was never synced.
Scale vertically (bigger box) or move the cache external before scaling out.
"""
from app import create_app

app = create_app()

if __name__ == "__main__":
    app.run(host=app.config["HOST"], port=app.config["PORT"])
