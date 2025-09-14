#!/bin/bash

echo "🚀 Starting Render build process..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Run migrations with production config
echo "🗄️ Running database migrations..."
NODE_ENV=production npx sequelize-cli db:migrate

echo "✅ Build completed successfully!"
