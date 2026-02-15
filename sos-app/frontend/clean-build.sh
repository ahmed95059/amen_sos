#!/bin/bash
# Clean rebuild script for SOS Hackathon Frontend

echo "🧹 Cleaning build artifacts..."
rm -rf .next dist node_modules/.cache .turbo

echo "📦 Reinstalling dependencies..."
npm ci

echo "🔨 Building project..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful! Starting dev server..."
    npm run dev
else
    echo "❌ Build failed. Fix errors above before running dev server."
    exit 1
fi
