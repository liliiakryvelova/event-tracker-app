#!/bin/bash

echo "🎯 Starting Event Tracker with Live Attendees Feature!"
echo "================================================="

# Check if we're in the right directory
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ Please run this script from the event-tracker-app directory"
    exit 1
fi

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  Port $1 is already in use. Killing existing process..."
        lsof -ti:$1 | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
}

# Kill any existing processes
echo "🧹 Cleaning up existing processes..."
check_port 8000
check_port 3000

echo ""
echo "🚀 Starting Backend Server (Port 8000)..."
cd backend
node index.js &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

echo "🎨 Starting Frontend Server (Port 3000)..."
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Event Tracker is starting up!"
echo "📊 Backend PID: $BACKEND_PID"
echo "🎨 Frontend PID: $FRONTEND_PID"
echo ""
echo "🌐 Open your browser to: http://localhost:3000"
echo ""
echo "🎯 NEW FEATURES TO TEST:"
echo "   • Live attendee list with join order (#1, #2, etc.)"
echo "   • Real-time join timestamps (updates every 30 seconds)"
echo "   • Live indicator with pulsing animation"
echo "   • Quick stats showing total, latest join, and first attendee"
echo ""
echo "👤 Test as Admin:"
echo "   Phone: +1234567890"
echo "   Team: Alpha"
echo ""
echo "⏹️  To stop both servers: kill $BACKEND_PID $FRONTEND_PID"
echo "🔄 Live timestamps update every 30 seconds automatically"
echo ""

# Keep script running
wait
