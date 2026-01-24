#!/bin/bash

# Production Deployment Script for Stokk
set -e

echo "🚀 Starting production deployment of Stokk..."

# Check if we're on main branch
if [ "$(git branch --show-current)" != "master" ]; then
    echo "❌ Not on master branch. Please switch to master branch."
    exit 1
fi

# Check if working directory is clean
if [ -n "$(git status --porcelain)" ]; then
    echo "❌ Working directory is not clean. Please commit all changes."
    exit 1
fi

echo "✅ Environment checks passed"

# Run tests
echo "🧪 Running tests..."
npm test
echo "✅ Tests passed"

# Run linting
echo "📝 Running linting..."
npm run lint
echo "✅ Linting passed"

# Type checking
echo "🔍 Type checking..."
npm run type-check
echo "✅ Type checking passed"

# Build for production
echo "📱 Building for production..."

# iOS build
echo "🍎 Building iOS..."
eas build --platform ios --profile production

# Android build
echo "🤖 Building Android..."
eas build --platform android --profile production

echo "✅ Production builds completed!"
echo "📋 Check your EAS dashboard for build status"
echo "🚀 Ready for App Store deployment!"