#!/bin/bash
# Deployment script for Cloudflare Pages

# Check if Cloudflare credentials are set
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
  echo "Error: CLOUDFLARE_API_TOKEN is not set"
  exit 1
fi

if [ -z "$CLOUDFLARE_ACCOUNT_ID" ]; then
  echo "Error: CLOUDFLARE_ACCOUNT_ID is not set"
  exit 1
fi

# Install Wrangler CLI if not already installed
if ! command -v wrangler &> /dev/null; then
  echo "Installing Wrangler CLI..."
  npm install -g wrangler
fi

# Clean previous builds
echo "Cleaning previous builds..."
rm -rf .next
rm -rf .wrangler

# Copy production environment variables
echo "Setting up production environment..."
cp .env.production .env.local

# Install dependencies
echo "Installing dependencies..."
npm install --production

# Build the application
echo "Building application for Cloudflare..."
NEXT_PUBLIC_DEPLOY_ENV=cloudflare npm run build

# Deploy to Cloudflare Pages
echo "Deploying to Cloudflare Pages..."
wrangler pages publish .next --project-name=lamontai

echo "Deployment complete!" 