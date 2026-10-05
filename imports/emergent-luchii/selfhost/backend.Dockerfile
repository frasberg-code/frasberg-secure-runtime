FROM python:3.11-slim

WORKDIR /app/backend

RUN apt-get update && apt-get install -y --no-install-recommends curl ffmpeg && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt \
    && pip install --no-cache-dir emergentintegrations --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/

# OPTIONAL: sovereign voice engines (Whisper STT + Coqui TTS + XTTS). Needs >=8GB RAM.
# COPY backend/requirements-ml.txt .
# RUN apt-get update && apt-get install -y espeak-ng && pip install --no-cache-dir -r requirements-ml.txt

COPY backend/ .

EXPOSE 8001

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "1"]
