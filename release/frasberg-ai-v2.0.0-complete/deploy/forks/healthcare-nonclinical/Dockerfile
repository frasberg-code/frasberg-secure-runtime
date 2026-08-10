FROM python:3.11-slim
WORKDIR /app
RUN pip install --no-cache-dir fastapi==0.115.0 uvicorn[standard]==0.34.0
COPY forks/healthcare-nonclinical/main.py .
EXPOSE 8002
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8002"]
