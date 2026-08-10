#!/bin/bash

echo "Stopping all Frasberg AI services..."

# Stop Docker services if they exist
if [ -d "deploy/canonical-core" ]; then
    cd deploy/canonical-core && docker-compose down 2>/dev/null
    cd ../..
fi

# Kill any running uvicorn processes
pkill -f "uvicorn main:app" 2>/dev/null

echo "✅ All services stopped"
