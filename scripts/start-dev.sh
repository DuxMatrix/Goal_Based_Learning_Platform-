#!/bin/bash

# Goal Achievement Platform - Development Startup Script

echo "🚀 Starting Goal Achievement Platform Development Environment"
echo "============================================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if MongoDB is running (optional check)
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB doesn't appear to be running. Please start MongoDB first."
    echo "   On macOS with Homebrew: brew services start mongodb-community"
    echo "   On Linux: sudo systemctl start mongod"
    echo "   Or use MongoDB Atlas for cloud database"
    echo ""
fi

# Check if .env files exist
if [ ! -f "backend/.env" ]; then
    echo "📝 Creating backend/.env from env.example..."
    cp backend/env.example backend/.env
    echo "⚠️  Please update backend/.env with your configuration before continuing"
fi

if [ ! -f ".env.local" ]; then
    echo "📝 Creating .env.local for frontend..."
    echo "NEXT_PUBLIC_API_URL=http://localhost:5000/api" > .env.local
fi

echo "📦 Installing backend dependencies..."
cd backend
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "✅ Backend dependencies already installed"
fi

echo "📦 Installing frontend dependencies..."
cd ..
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "✅ Frontend dependencies already installed"
fi

echo ""
echo "🎯 Setup complete! You can now start the development servers:"
echo ""
echo "For Backend (Terminal 1):"
echo "  cd backend && npm run dev"
echo ""
echo "For Frontend (Terminal 2):"
echo "  npm run dev"
echo ""
echo "📱 The application will be available at:"
echo "  Frontend: http://localhost:3000"
echo "  Backend API: http://localhost:5000"
echo ""
echo "🔧 Don't forget to:"
echo "  1. Update backend/.env with your MongoDB URI and JWT secret"
echo "  2. Add your OpenAI API key for AI features"
echo "  3. Start MongoDB if running locally"
echo ""
echo "Happy coding! 🎉"
