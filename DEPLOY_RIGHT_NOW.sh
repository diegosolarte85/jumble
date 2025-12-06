#!/bin/bash
# INSTANT DEPLOY - Run this script to deploy to Heroku now

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 DEPLOYING JUMBLE TO HEROKU NOW"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Function to check if logged in
check_login() {
    if heroku auth:whoami &> /dev/null; then
        return 0
    else
        return 1
    fi
}

# Try to login
if ! check_login; then
    echo "🔐 Logging in to Heroku..."
    echo ""
    echo "Choose your login method:"
    echo "  1) Browser login (recommended) - Press ENTER"
    echo "  2) Terminal login - Type 'terminal' and press ENTER"
    echo "  3) I have an API key - Type 'key' and press ENTER"
    echo ""
    read -p "Choice: " LOGIN_CHOICE
    
    case "$LOGIN_CHOICE" in
        "terminal")
            heroku login -i
            ;;
        "key")
            read -p "Enter your Heroku API key: " API_KEY
            export HEROKU_API_KEY="$API_KEY"
            echo "machine api.heroku.com
  login 
  password $HEROKU_API_KEY
machine git.heroku.com
  login 
  password $HEROKU_API_KEY" > ~/.netrc
            chmod 600 ~/.netrc
            ;;
        *)
            heroku login
            ;;
    esac
fi

if ! check_login; then
    echo "❌ Login failed. Please try again."
    exit 1
fi

echo "✅ Logged in as: $(heroku auth:whoami)"
echo ""

# Generate random app name or ask for one
DEFAULT_NAME="jumble-$(date +%s)"
read -p "Enter app name (or press ENTER for '$DEFAULT_NAME'): " APP_NAME
APP_NAME=${APP_NAME:-$DEFAULT_NAME}

echo ""
echo "📱 Creating app: $APP_NAME"
echo ""

# Create app
if heroku create "$APP_NAME" 2>&1 | tee /tmp/heroku-create.log; then
    echo "✅ App created successfully"
else
    if grep -q "Name is already taken" /tmp/heroku-create.log; then
        echo "⚠️  App name already taken. Using existing app."
    else
        echo "❌ Failed to create app. Exiting."
        exit 1
    fi
fi

echo ""
echo "🗄️  Adding PostgreSQL database..."
heroku addons:create heroku-postgresql:essential-0 -a "$APP_NAME" --wait 2>&1 || echo "Database addon may already exist"

echo ""
echo "⚙️  Setting environment variables..."
SECRET=$(openssl rand -base64 32)
heroku config:set \
    NEXTAUTH_SECRET="$SECRET" \
    NEXTAUTH_URL="https://${APP_NAME}.herokuapp.com" \
    NODE_ENV="production" \
    -a "$APP_NAME"

echo ""
echo "🚢 Deploying your code to Heroku..."
echo "This may take 2-3 minutes..."
echo ""

# Get current branch
BRANCH=$(git branch --show-current)
echo "Deploying branch: $BRANCH"

# Add heroku remote if needed
git remote remove heroku 2>/dev/null || true
heroku git:remote -a "$APP_NAME"

# Push to Heroku
if git push heroku "$BRANCH:main" -f; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ DEPLOYMENT SUCCESSFUL!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "🎉 Your app is live at:"
    echo "   https://${APP_NAME}.herokuapp.com"
    echo ""
    echo "📊 Useful commands:"
    echo "   heroku logs --tail -a $APP_NAME       # View logs"
    echo "   heroku open -a $APP_NAME              # Open in browser"
    echo "   heroku ps -a $APP_NAME                # Check status"
    echo "   heroku pg:info -a $APP_NAME           # Database info"
    echo ""
    echo "Opening your app in browser..."
    sleep 2
    heroku open -a "$APP_NAME" || echo "Visit: https://${APP_NAME}.herokuapp.com"
else
    echo ""
    echo "❌ Deployment failed. Check the errors above."
    echo ""
    echo "Try these debugging steps:"
    echo "  1. Check logs: heroku logs --tail -a $APP_NAME"
    echo "  2. Verify git status: git status"
    echo "  3. Check Heroku status: https://status.heroku.com"
    exit 1
fi
