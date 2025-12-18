#!/bin/bash
set -e

echo "=== Building LeanIt ==="

# Build frontend
echo "Building frontend..."
cd frontend
npm install
NEXT_PUBLIC_API_URL="" npm run build

# Copy to backend static folder
echo "Copying frontend build to backend..."
rm -rf ../backend/static
cp -r out ../backend/static

# Install backend dependencies
echo "Installing backend dependencies..."
cd ../backend
pip install -r requirements.txt

echo "=== Build complete! ==="
