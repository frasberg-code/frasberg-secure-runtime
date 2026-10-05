#!/bin/bash

echo "╔════════════════════════════════════════════════╗"
echo "║  Frasberg v4.0.1 - Quick Start Script       ║"
echo "╚════════════════════════════════════════════════╝"
echo ""

# Check prerequisites
echo "Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Install from: https://docs.docker.com/get-docker/"
    exit 1
fi
echo "✅ Docker found"

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose not found"
    exit 1
fi
echo "✅ Docker Compose found"

echo ""
echo "Starting Frasberg v4.0.1..."
echo ""

# Deploy Canonical Core
echo "Deploying Canonical Core..."
cd deploy/canonical-core 2>/dev/null || {
    echo "⚠️  Deploy directory not found, starting development mode..."
    cd /workspaces/frasberg 2>/dev/null || cd .
    python -m pip install -q -r backend/requirements.txt 2>/dev/null
    echo ""
    echo "Starting development server..."
    cd backend/app
    python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
    SERVER_PID=$!
    sleep 5
    
    if curl -s http://localhost:8000/health > /dev/null; then
        echo "✅ Frasberg is healthy"
    else
        echo "❌ Frasberg failed to start"
        kill $SERVER_PID 2>/dev/null
        exit 1
    fi
    
    echo ""
    echo "╔════════════════════════════════════════════════╗"
    echo "║  ✅ Frasberg v4.0.1 is now running!         ║"
    echo "╚════════════════════════════════════════════════╝"
    echo ""
    echo "Services:"
    echo "  • Canonical Core:  http://localhost:8000"
    echo "  • API Docs:        http://localhost:8000/docs"
    echo "  • Health Check:    http://localhost:8000/health"
    echo ""
    echo "Press Ctrl+C to stop"
    echo ""
    
    wait $SERVER_PID
    exit 0
}

docker-compose up -d --build
sleep 10

# Verify
if curl -s http://localhost:8000/health > /dev/null; then
    echo "✅ Canonical Core is healthy"
else
    echo "❌ Canonical Core failed to start"
    exit 1
fi

cd ../..

echo ""
echo "╔════════════════════════════════════════════════╗"
echo "║  ✅ Frasberg v4.0.1 is now running!         ║"
echo "╚════════════════════════════════════════════════╝"
echo ""
echo "Services:"
echo "  • Canonical Core:  http://localhost:8000"
echo "  • API Docs:        http://localhost:8000/docs"
echo "  • Health Check:    http://localhost:8000/health"
echo ""
echo "To stop all services:"
echo "  ./stop-all.sh"
echo ""
