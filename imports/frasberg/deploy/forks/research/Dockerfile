FROM python:3.11-slim
WORKDIR /app
RUN pip install --no-cache-dir fastapi==0.109.0 uvicorn[standard]==0.27.0
COPY forks/research/main.py .
EXPOSE 8004
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8004"]
