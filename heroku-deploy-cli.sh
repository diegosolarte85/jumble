#!/bin/bash
# Heroku CLI Deployment Script for Jumble
# This script uses Heroku API key for authentication

set -e

echo "🚀 Jumble - Heroku CLI Deployment"
echo "=================================="
echo ""

# Check if HEROKU_API_KEY is set
if [ -z "$HEROKU_API_KEY" ]; then
    echo "❌ HEROKU_API_KEY environment variable is not set"
    echo ""
    echo "To deploy, you need to set your Heroku API key:"
    echo ""
    echo "1. Get your API key:"
    echo "   Visit: https://dashboard.heroku.com/account"
    echo "   Or run: heroku auth:token (if already logged in)"
    echo ""
    echo "2. Set the environment variable:"
    echo "   export HEROKU_API_KEY=your-api-key-here"
    echo ""
    echo "3. Run this script again:"
    echo "   ./heroku-deploy-cli.sh"
    echo ""
    exit 1
fi

echo "✅ HEROKU_API_KEY is set"
echo ""

# Set up Heroku credentials
cat > ~/.netrc << EOF
machine api.heroku.com
  login $HEROKU_EMAIL
  password $HEROKU_API_KEY
machine git.heroku.com
  login $HEROKU_EMAIL
  password $HEROKU_API_KEY
EOF
chmod 600 ~/.netrc

# Check current git branch
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 Current branch: $CURRENT_BRANCH"
echo ""

# Prompt for app name
if [ -z "$HEROKU_APP_NAME" ]; then
    echo "Enter your Heroku app name (or leave empty for random name):"
    read -p "App name: " HEROKU_APP_NAME
fi

# Create or use existing app
if [ -z "$HEROKU_APP_NAME" ]; then
    echo "🆕 Creating new Heroku app with random name..."
    APP_INFO=$(heroku create --json)
    HEROKU_APP_NAME=$(echo $APP_INFO | grep -o '"name":"[^"]*' | cut -d'"' -f4)
else
    echo "🆕 Creating Heroku app: $HEROKU_APP_NAME"
    heroku create "$HEROKU_APP_NAME" --json || {
        echo "⚠️  App might already exist, continuing..."
        HEROKU_APP_NAME="$HEROKU_APP_NAME"
    }
fi

echo "✅ App name: $HEROKU_APP_NAME"
APP_URL="https://${HEROKU_APP_NAME}.herokuapp.com"
echo "🌐 App URL: $APP_URL"
echo ""

# Add PostgreSQL
echo "🗄️  Adding PostgreSQL addon..."
heroku addons:create heroku-postgresql:essential-0 -a "$HEROKU_APP_NAME" --wait || {
    echo "⚠️  PostgreSQL addon might already exist"
}
echo ""

# Set environment variables
echo "⚙️  Setting environment variables..."
NEXTAUTH_SECRET=$(openssl rand -base64 32)
heroku config:set \
    NEXTAUTH_SECRET="$NEXTAUTH_SECRET" \
    NEXTAUTH_URL="$APP_URL" \
    NODE_ENV="production" \
    -a "$HEROKU_APP_NAME"
echo ""

# Add Heroku remote if not exists
if ! git remote | grep -q "^heroku$"; then
    echo "Adding Heroku git remote..."
    heroku git:remote -a "$HEROKU_APP_NAME"
fi

# Deploy
echo "🚢 Deploying to Heroku..."
echo "Pushing branch '$CURRENT_BRANCH' to Heroku main..."
git push heroku "$CURRENT_BRANCH:main" --force

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🎉 Your app is live at: $APP_URL"
echo ""
echo "Useful commands:"
echo "  heroku logs --tail -a $HEROKU_APP_NAME    # View logs"
echo "  heroku open -a $HEROKU_APP_NAME           # Open in browser"
echo "  heroku ps -a $HEROKU_APP_NAME             # Check dyno status"
echo "  heroku config -a $HEROKU_APP_NAME         # View config vars"
echo "  heroku pg:info -a $HEROKU_APP_NAME        # Database info"
echo ""
