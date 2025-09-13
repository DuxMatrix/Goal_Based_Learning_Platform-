@echo off
REM Goal Achievement Platform - Development Startup Script

echo 🚀 Starting Goal Achievement Platform Development Environment
echo ============================================================

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

REM Check if .env files exist
if not exist "backend\.env" (
    echo 📝 Creating backend\.env from env.example...
    copy "backend\env.example" "backend\.env"
    echo ⚠️  Please update backend\.env with your configuration before continuing
)

if not exist ".env.local" (
    echo 📝 Creating .env.local for frontend...
    echo NEXT_PUBLIC_API_URL=http://localhost:5000/api > .env.local
)

echo 📦 Installing backend dependencies...
cd backend
if not exist "node_modules" (
    npm install
) else (
    echo ✅ Backend dependencies already installed
)

echo 📦 Installing frontend dependencies...
cd ..
if not exist "node_modules" (
    npm install
) else (
    echo ✅ Frontend dependencies already installed
)

echo.
echo 🎯 Setup complete! You can now start the development servers:
echo.
echo For Backend (Command Prompt 1):
echo   cd backend ^&^& npm run dev
echo.
echo For Frontend (Command Prompt 2):
echo   npm run dev
echo.
echo 📱 The application will be available at:
echo   Frontend: http://localhost:3000
echo   Backend API: http://localhost:5000
echo.
echo 🔧 Don't forget to:
echo   1. Update backend\.env with your MongoDB URI and JWT secret
echo   2. Add your OpenAI API key for AI features
echo   3. Start MongoDB if running locally
echo.
echo Happy coding! 🎉
pause
