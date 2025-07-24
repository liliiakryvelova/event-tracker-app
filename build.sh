#!/bin/bash
set -e

echo "🏗️  Building Event Tracker Application..."

# Install root dependencies
echo "📦 Installing root dependencies..."
npm ci

# Install frontend dependencies and build
echo "📦 Installing frontend dependencies..."
cd frontend
npm ci

echo "🏗️  Building React frontend..."
npm run build

echo "✅ Build completed successfully!"
echo "📁 Frontend build files are in: frontend/build/"

# List build contents
echo "📋 Build contents:"
ls -la build/ | head -10
