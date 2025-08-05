#!/bin/bash

# AI Interview Agent - Development Startup Script
echo "🚀 Starting AI Interview Agent Development Environment"
echo "=================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

# Check if all dependencies are installed
if [ ! -d "node_modules" ] || [ ! -d "client/node_modules" ] || [ ! -d "server/node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm run install:all
fi

# Check if environment files exist
if [ ! -f "server/.env" ]; then
    echo "⚠️  Server .env file not found. Copying from .env.example..."
    cp server/.env.example server/.env
    echo "📝 Please edit server/.env and add your AI API keys"
fi

if [ ! -f "client/.env.local" ]; then
    echo "⚠️  Client .env.local file not found. Copying from .env.local.example..."
    cp client/.env.local.example client/.env.local
fi

echo ""
echo "🔥 Starting development servers..."
echo "📊 Server: http://localhost:5000"
echo "🎨 Client: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Start both servers concurrently
npm run dev