#!/bin/bash

echo "🚀 Starting Render build process..."

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Run database migrations
echo "🗄️ Running database migrations..."
npm run db:migrate

echo "✅ Build completed successfully!"
