#!/bin/bash

# AI Interview Agent - Start Script
# This script helps you get the interview agent running quickly

echo "🚀 AI Interview Agent - Starting..."
echo "=================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version is too old. Please upgrade to Node.js 18+ from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check if dependencies are installed
if [ ! -d "node_modules" ] || [ ! -d "client/node_modules" ] || [ ! -d "server/node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm run install:all
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
    echo "✅ Dependencies installed"
else
    echo "✅ Dependencies already installed"
fi

# Check if environment files exist
if [ ! -f "server/.env" ]; then
    echo "⚙️  Creating server environment file..."
    cp server/.env server/.env 2>/dev/null || echo "PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Add your AI API key here for better experience:
# GOOGLE_API_KEY=your_google_api_key_here
# OPENAI_API_KEY=your_openai_api_key_here

MAX_QUESTIONS=15
INTERVIEW_TIMEOUT_MINUTES=60" > server/.env
    echo "✅ Server environment file created"
fi

if [ ! -f "client/.env.local" ]; then
    echo "⚙️  Creating client environment file..."
    echo "NEXT_PUBLIC_SERVER_URL=http://localhost:5000
NEXT_PUBLIC_APP_NAME=\"AI Interview Agent\"
NEXT_PUBLIC_VERSION=\"1.0.0\"" > client/.env.local
    echo "✅ Client environment file created"
fi

# Start the application
echo ""
echo "🚀 Starting AI Interview Agent..."
echo "=================================="
echo "📱 Frontend will be available at: http://localhost:3000"
echo "🔧 Backend API will be available at: http://localhost:5000"
echo ""
echo "💡 For better AI responses, add an API key to server/.env"
echo "   Google Gemini (free): https://makersuite.google.com/app/apikey"
echo "   OpenAI (paid): https://platform.openai.com/api-keys"
echo ""
echo "Press Ctrl+C to stop the servers"
echo ""

# Start both client and server
npm run dev