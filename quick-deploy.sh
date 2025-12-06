#!/bin/bash
# Quick Heroku Deploy - Jumble App

echo "🚀 Quick Heroku Deploy for Jumble"
echo "================================="
echo ""
echo "This script will deploy your app to Heroku."
echo "Make sure you're logged in to Heroku first!"
echo ""

# Check if logged in
if ! heroku auth:whoami &> /dev/null; then
    echo "❌ Not logged in to Heroku"
    echo ""
    echo "Please login first:"
    echo "  heroku login"
    echo ""
    echo "Then run this script again."
    exit 1
fi

echo "✅ Logged in as: $(heroku auth:whoami)"
echo ""

# Get app name
read -p "Enter app name (or press Enter for random): " APP_NAME

# Create app
echo ""
echo "📱 Creating Heroku app..."
if [ -z "$APP_NAME" ]; then
    heroku create
else
    heroku create "$APP_NAME"
fi

# Get the actual app name
APP_NAME=$(heroku apps:info | grep "^===" | awk '{print $2}')
echo "✅ App: $APP_NAME"
echo ""

# Add PostgreSQL
echo "🗄️  Adding PostgreSQL..."
heroku addons:create heroku-postgresql:essential-0 -a "$APP_NAME" --wait
echo ""

# Set environment variables
echo "⚙️  Configuring environment..."
heroku config:set \
    NEXTAUTH_SECRET="$(openssl rand -base64 32)" \
    NEXTAUTH_URL="https://${APP_NAME}.herokuapp.com" \
    -a "$APP_NAME"
echo ""

# Deploy
echo "🚢 Deploying code..."
BRANCH=$(git branch --show-current)
git push heroku "$BRANCH:main"
echo ""

# Show results
echo "✅ DEPLOYMENT COMPLETE!"
echo ""
echo "🎉 Your app: https://${APP_NAME}.herokuapp.com"
echo ""
echo "📊 View logs: heroku logs --tail -a $APP_NAME"
echo "🌐 Open app: heroku open -a $APP_NAME"
echo ""
