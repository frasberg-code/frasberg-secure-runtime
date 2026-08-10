import pytest
from fastapi.testclient import TestClient
import sys
import os

# Add backend/app to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../../backend/app'))

from main import app

client = TestClient(app)

def test_health_endpoint():
    """Test basic health endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
    assert "version" in response.json()
    assert response.json()["version"] == "5.1.0"

def test_health_includes_service():
    """Test health endpoint includes service field"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["service"] == "frasberg-ai"

def test_health_includes_integrations():
    """Test health endpoint includes integrations block"""
    response = client.get("/health")
    assert response.status_code == 200
    assert "integrations" in response.json()

def test_root_endpoint():
    """Test root endpoint returns v5.1.0 info"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["version"] == "5.1.0"
    assert data["name"] == "Frasberg AI"
    assert data["status"] == "operational"
