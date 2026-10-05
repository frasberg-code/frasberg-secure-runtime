# FRASBERG Core v1.0.0 - Canonical Core
# Docker Image

FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install core dependencies first
RUN pip install --upgrade pip && \
    pip install "fastapi==0.115.0" "uvicorn[standard]==0.34.0" "python-dotenv==1.0.0"

# Copy and install remaining dependencies (skip conflicts)
COPY backend/requirements.txt .
RUN pip install -r requirements.txt || true

# Copy application code
COPY backend/app /app/app

# Expose port
EXPOSE 8000

# No health check in Dockerfile - handled by docker-compose
# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
