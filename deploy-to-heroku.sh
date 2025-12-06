#!/bin/bash

# Heroku Deployment Script for Jumble
# This script will guide you through deploying to Heroku

set -e  # Exit on error

echo "🚀 Jumble - Heroku Deployment Script"
echo "===================================="
echo ""

# Check if Heroku CLI is installed
if ! command -v heroku &> /dev/null; then
    echo "❌ Heroku CLI is not installed."
    echo "Installing Heroku CLI..."
    curl https://cli-assets.heroku.com/install.sh | sh
fi

echo "✅ Heroku CLI is installed"
echo ""

# Check if logged in
if ! heroku auth:whoami &> /dev/null; then
    echo "🔐 You need to log in to Heroku"
    echo "Choose your login method:"
    echo "  1. Browser login (recommended): heroku login"
    echo "  2. Terminal login: heroku login -i"
    echo ""
    echo "Please run one of the above commands, then run this script again."
    exit 1
fi

HEROKU_USER=$(heroku auth:whoami)
echo "✅ Logged in as: $HEROKU_USER"
echo ""

# Check if app already exists
APP_NAME=""
if heroku apps:info &> /dev/null; then
    APP_NAME=$(heroku apps:info | grep "^===" | cut -d' ' -f2)
    echo "📱 Found existing Heroku app: $APP_NAME"
else
    # Prompt for app name
    echo "📱 No Heroku app found. Let's create one!"
    read -p "Enter your app name (or press enter for random name): " APP_NAME
    
    if [ -z "$APP_NAME" ]; then
        echo "Creating app with random name..."
        heroku create
    else
        echo "Creating app: $APP_NAME..."
        heroku create "$APP_NAME"
    fi
    
    APP_NAME=$(heroku apps:info | grep "^===" | cut -d' ' -f2)
fi

echo "✅ App name: $APP_NAME"
APP_URL=$(heroku apps:info -a "$APP_NAME" | grep "Web URL" | awk '{print $3}')
echo "🌐 App URL: $APP_URL"
echo ""

# Check for PostgreSQL addon
echo "🗄️  Checking PostgreSQL addon..."
if heroku addons -a "$APP_NAME" | grep -q "heroku-postgresql"; then
    echo "✅ PostgreSQL addon already exists"
else
    echo "Adding PostgreSQL addon (Essential-0 plan: $5/month)..."
    heroku addons:create heroku-postgresql:essential-0 -a "$APP_NAME"
    echo "⏳ Waiting for database to provision..."
    sleep 10
fi
echo ""

# Set environment variables
echo "⚙️  Configuring environment variables..."

# Check and set NEXTAUTH_SECRET
if heroku config:get NEXTAUTH_SECRET -a "$APP_NAME" &> /dev/null && [ -n "$(heroku config:get NEXTAUTH_SECRET -a "$APP_NAME")" ]; then
    echo "✅ NEXTAUTH_SECRET already set"
else
    echo "Setting NEXTAUTH_SECRET..."
    NEXTAUTH_SECRET=$(openssl rand -base64 32)
    heroku config:set NEXTAUTH_SECRET="$NEXTAUTH_SECRET" -a "$APP_NAME"
fi

# Check and set NEXTAUTH_URL
if heroku config:get NEXTAUTH_URL -a "$APP_NAME" &> /dev/null && [ -n "$(heroku config:get NEXTAUTH_URL -a "$APP_NAME")" ]; then
    echo "✅ NEXTAUTH_URL already set"
else
    echo "Setting NEXTAUTH_URL..."
    heroku config:set NEXTAUTH_URL="$APP_URL" -a "$APP_NAME"
fi

echo "✅ Environment variables configured"
echo ""

# Deploy
echo "🚢 Deploying to Heroku..."
CURRENT_BRANCH=$(git branch --show-current)
echo "Pushing branch: $CURRENT_BRANCH"

if git remote | grep -q heroku; then
    echo "Heroku remote already exists"
else
    echo "Adding Heroku remote..."
    heroku git:remote -a "$APP_NAME"
fi

echo "Pushing to Heroku..."
git push heroku "$CURRENT_BRANCH:main" --force

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🎉 Your app is live at: $APP_URL"
echo ""
echo "📊 View logs: heroku logs --tail -a $APP_NAME"
echo "🌐 Open app: heroku open -a $APP_NAME"
echo "⚙️  View config: heroku config -a $APP_NAME"
echo "🗄️  Database info: heroku pg:info -a $APP_NAME"
echo ""
echo "Optional: Seed database with test data"
echo "  heroku run npm run db:seed -a $APP_NAME"
echo ""
