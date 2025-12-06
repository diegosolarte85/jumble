# 🚀 Deploy to Heroku - Quick Guide

## Your Code is Ready!

All changes have been committed and your app is ready to deploy. Choose one of the methods below:

---

## Method 1: One-Command Deploy (Recommended)

Run this single command to deploy:

```bash
./deploy-to-heroku.sh
```

Then follow the prompts to:
1. Log in to Heroku (browser will open)
2. Automatically create app and database
3. Deploy your code

---

## Method 2: Manual Step-by-Step

If you prefer manual control:

### 1. Login to Heroku
```bash
heroku login
```
(Opens browser for authentication)

### 2. Create App
```bash
# Create with custom name
heroku create your-app-name

# OR create with random name
heroku create
```

### 3. Add PostgreSQL
```bash
heroku addons:create heroku-postgresql:essential-0
```

### 4. Set Environment Variables
```bash
# Generate and set NextAuth secret
heroku config:set NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Set your app URL (replace YOUR-APP-NAME)
heroku config:set NEXTAUTH_URL=https://YOUR-APP-NAME.herokuapp.com
```

### 5. Deploy
```bash
git push heroku cursor/deploy-to-heroku-claude-4.5-sonnet-thinking-6c37:main
```

### 6. Open Your App
```bash
heroku open
```

---

## Method 3: Using Heroku API Key (For CI/CD)

If you have a Heroku API key:

```bash
# Set the API key
export HEROKU_API_KEY=your-api-key-here

# Then run the deployment script
./deploy-to-heroku.sh
```

To get your API key:
```bash
heroku auth:token
```

---

## Method 4: Heroku Dashboard (No CLI Needed)

1. Go to https://dashboard.heroku.com
2. Click "New" → "Create new app"
3. Choose app name and region
4. In "Deploy" tab:
   - Connect to GitHub repository
   - Enable automatic deploys from your branch
5. In "Resources" tab:
   - Add "Heroku Postgres" addon (Essential-0)
6. In "Settings" tab → "Config Vars":
   - Add `NEXTAUTH_SECRET`: (generate with `openssl rand -base64 32`)
   - Add `NEXTAUTH_URL`: https://your-app-name.herokuapp.com

---

## Verify Deployment

After deploying:

```bash
# View logs
heroku logs --tail

# Check app status
heroku ps

# Open in browser
heroku open

# View database info
heroku pg:info
```

---

## Troubleshooting

### "Not logged in" error
Run: `heroku login`

### Build fails
Check logs: `heroku logs --tail`

### Database not connected
Check: `heroku config:get DATABASE_URL`
If empty, add addon: `heroku addons:create heroku-postgresql:essential-0`

### App doesn't start
1. Check environment variables: `heroku config`
2. Ensure NEXTAUTH_SECRET is set
3. Restart: `heroku restart`

---

## Cost Reminder

- **PostgreSQL Essential-0**: $5/month
- **Web Dyno**: Free (with sleep) or $7/month (Hobby - always on)

---

## Need Help?

- **Full guide**: See `HEROKU_DEPLOYMENT.md`
- **Checklist**: See `HEROKU_CHECKLIST.md`
- **Quick commands**: See `DEPLOY.md`

---

## Your App is Ready! 🎉

Choose any method above to deploy. Method 1 (one-command deploy) is the easiest!
