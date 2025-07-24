#!/bin/bash

echo "Starting Event Tracker App..."

# Start backend in the background
echo "Starting backend server..."
cd backend && node index.js &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 2

# Start frontend
echo "Starting frontend..."
cd ../frontend && npm start &
FRONTEND_PID=$!

echo "Backend running on port 8000 (PID: $BACKEND_PID)"
echo "Frontend running on port 3000 (PID: $FRONTEND_PID)"
echo "To stop both servers, run: kill $BACKEND_PID $FRONTEND_PID"

# Keep script running
wait
