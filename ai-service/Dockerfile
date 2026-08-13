FROM python:3.11-slim AS base

# OpenCV/InsightFace need these system libs to import correctly on a slim image.
# build-essential (gcc/g++) is required because insightface compiles a native
# C++ extension (thirdparty/face3d/mesh/cython/mesh_core_cython) from source
# during `pip install`.
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        libgl1 \
        libglib2.0-0 \
        libgomp1 \
        curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN useradd --create-home --uid 1000 appuser \
    && mkdir -p /home/appuser/.insightface /app/logs \
    && chown -R appuser:appuser /app /home/appuser
USER appuser

ENV AI_MODEL_ROOT=/home/appuser/.insightface \
    AI_LOG_DIR=/app/logs \
    PYTHONUNBUFFERED=1

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# Single worker: see wsgi.py docstring for why (in-process embedding cache).
CMD ["gunicorn", "-w", "1", "--threads", "4", "-b", "0.0.0.0:5000", "--timeout", "60", "wsgi:app"]
