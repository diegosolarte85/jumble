#!/bin/bash

# Heroku Deployment Script for Jumble
# This script automates the deployment of your fixed code to Heroku

set -e  # Exit on error

echo "🚀 Jumble Heroku Deployment Script"
echo "===================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Heroku CLI is installed
if ! command -v heroku &> /dev/null; then
    echo -e "${RED}❌ Heroku CLI is not installed${NC}"
    echo "Please install it from: https://devcenter.heroku.com/articles/heroku-cli"
    exit 1
fi

echo -e "${GREEN}✓${NC} Heroku CLI is installed"

# Check if logged in to Heroku
if ! heroku auth:whoami &> /dev/null; then
    echo -e "${YELLOW}⚠${NC} Not logged in to Heroku"
    echo "Logging you in..."
    heroku login
fi

echo -e "${GREEN}✓${NC} Logged in to Heroku"
echo ""

# Check if Heroku remote exists
if git remote get-url heroku &> /dev/null; then
    HEROKU_APP=$(heroku apps:info -r heroku --json | jq -r '.app.name')
    echo -e "${GREEN}✓${NC} Heroku remote found: $HEROKU_APP"
    
    read -p "Deploy to existing app '$HEROKU_APP'? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled"
        exit 0
    fi
else
    echo -e "${YELLOW}⚠${NC} No Heroku remote found"
    echo ""
    echo "Options:"
    echo "1) Create a new Heroku app"
    echo "2) Add existing Heroku app"
    read -p "Choose option (1 or 2): " -n 1 -r
    echo
    
    if [[ $REPLY == "1" ]]; then
        read -p "Enter app name (or press Enter for random name): " APP_NAME
        if [ -z "$APP_NAME" ]; then
            heroku create
        else
            heroku create "$APP_NAME"
        fi
        HEROKU_APP=$(heroku apps:info -r heroku --json | jq -r '.app.name')
        echo -e "${GREEN}✓${NC} Created app: $HEROKU_APP"
    elif [[ $REPLY == "2" ]]; then
        read -p "Enter your Heroku app name: " APP_NAME
        heroku git:remote -a "$APP_NAME"
        HEROKU_APP="$APP_NAME"
        echo -e "${GREEN}✓${NC} Added remote for: $HEROKU_APP"
    else
        echo -e "${RED}❌ Invalid option${NC}"
        exit 1
    fi
fi

echo ""
echo "📦 Checking app configuration..."

# Check for PostgreSQL addon
if heroku addons -r heroku | grep -q "heroku-postgresql"; then
    echo -e "${GREEN}✓${NC} PostgreSQL addon is attached"
else
    echo -e "${YELLOW}⚠${NC} PostgreSQL addon not found"
    read -p "Add PostgreSQL Essential-0 ($5/month)? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        heroku addons:create heroku-postgresql:essential-0 -r heroku
        echo -e "${GREEN}✓${NC} PostgreSQL addon added"
    else
        echo -e "${RED}❌ PostgreSQL is required for deployment${NC}"
        exit 1
    fi
fi

# Check environment variables
echo ""
echo "🔐 Checking environment variables..."

if heroku config:get NEXTAUTH_SECRET -r heroku | grep -q "."; then
    echo -e "${GREEN}✓${NC} NEXTAUTH_SECRET is set"
else
    echo -e "${YELLOW}⚠${NC} NEXTAUTH_SECRET not set"
    SECRET=$(openssl rand -base64 32)
    heroku config:set NEXTAUTH_SECRET="$SECRET" -r heroku
    echo -e "${GREEN}✓${NC} NEXTAUTH_SECRET generated and set"
fi

if heroku config:get NEXTAUTH_URL -r heroku | grep -q "."; then
    echo -e "${GREEN}✓${NC} NEXTAUTH_URL is set"
else
    echo -e "${YELLOW}⚠${NC} NEXTAUTH_URL not set"
    HEROKU_URL="https://$HEROKU_APP.herokuapp.com"
    heroku config:set NEXTAUTH_URL="$HEROKU_URL" -r heroku
    echo -e "${GREEN}✓${NC} NEXTAUTH_URL set to: $HEROKU_URL"
fi

echo ""
echo "🚀 Deploying to Heroku..."
echo ""

# Get current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "Current branch: $CURRENT_BRANCH"

# Push to Heroku
echo "Pushing $CURRENT_BRANCH to Heroku main..."
git push heroku "$CURRENT_BRANCH:main"

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "📊 Checking app status..."

# Wait a moment for the app to start
sleep 3

# Check dyno status
heroku ps -r heroku

echo ""
echo "🔗 Your app is deployed at:"
echo "   https://$HEROKU_APP.herokuapp.com"
echo ""
echo "📝 Useful commands:"
echo "   heroku logs --tail          # View live logs"
echo "   heroku open                 # Open app in browser"
echo "   heroku pg:info              # Check database info"
echo "   heroku run npm run db:seed  # Seed database (optional)"
echo ""
echo -e "${GREEN}🎉 Deployment successful!${NC}"
