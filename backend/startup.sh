#!/bin/bash
# Azure App Service startup script for Zaytoun Vision FastAPI backend
# This script is used when deploying via ZIP deploy or GitHub Actions

# Install dependencies if they weren't bundled
if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
fi

# Start the FastAPI app with uvicorn on the port Azure provides
exec uvicorn main:app --host 0.0.0.0 --port "${PORT:-8000}"
