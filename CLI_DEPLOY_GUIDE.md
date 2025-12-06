# Heroku CLI Deployment Guide

## ✅ Prerequisites

Your code is ready! Heroku CLI is already installed. Now let's deploy.

---

## 🔐 Step 1: Authenticate with Heroku

Choose one of these authentication methods:

### Option A: Browser Login (Recommended - Interactive)

```bash
heroku login
```

This will open your browser for authentication. After logging in, come back to the terminal.

### Option B: API Key (Non-Interactive - For Automation)

1. Get your API key from: https://dashboard.heroku.com/account
   - Scroll to "API Key" section
   - Click "Reveal" to see your key

2. Set the environment variable:
```bash
export HEROKU_API_KEY=your-api-key-here
```

3. Verify authentication:
```bash
heroku auth:whoami
```

### Option C: Email/Password (Terminal)

```bash
heroku login -i
```

Then enter your Heroku email and password when prompted.

---

## 🚀 Step 2: Deploy Using the Script

Once authenticated, run:

```bash
./heroku-deploy-cli.sh
```

This automated script will:
- ✅ Create your Heroku app
- ✅ Add PostgreSQL database
- ✅ Set environment variables
- ✅ Deploy your code
- ✅ Show your app URL

---

## 📝 Step 3: Manual Deployment (Alternative)

If you prefer manual control:

### 1. Create Heroku App
```bash
# With custom name
heroku create jumble-yourname

# Or with random name
heroku create
```

### 2. Add PostgreSQL Database
```bash
heroku addons:create heroku-postgresql:essential-0
```

### 3. Set Environment Variables
```bash
# Generate and set authentication secret
heroku config:set NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Set your app URL (replace YOUR-APP-NAME)
heroku config:set NEXTAUTH_URL=https://YOUR-APP-NAME.herokuapp.com

# Set Node environment
heroku config:set NODE_ENV=production
```

### 4. Add Heroku Git Remote
```bash
# Get your app name
heroku apps:info

# Add remote (replace YOUR-APP-NAME)
heroku git:remote -a YOUR-APP-NAME
```

### 5. Deploy Your Code
```bash
# Push current branch to Heroku
git push heroku HEAD:main

# Or push specific branch
git push heroku cursor/deploy-to-heroku-claude-4.5-sonnet-thinking-6c37:main
```

### 6. Verify Deployment
```bash
# Check logs
heroku logs --tail

# Open app in browser
heroku open
```

---

## 🔍 Step 4: Verify Everything Works

### Check App Status
```bash
heroku ps
```

Should show: `web.1: up`

### Check Database
```bash
heroku pg:info
```

Should show your PostgreSQL database details.

### Check Environment Variables
```bash
heroku config
```

Should show:
- `DATABASE_URL` (set automatically)
- `NEXTAUTH_SECRET` (you set this)
- `NEXTAUTH_URL` (you set this)

### View Real-Time Logs
```bash
heroku logs --tail
```

Look for: "Listening on port" message

---

## 🎯 Quick Commands Reference

```bash
# View logs
heroku logs --tail

# Open app in browser
heroku open

# Restart app
heroku restart

# Scale dynos
heroku ps:scale web=1

# Run database migrations
heroku run npm run db:push

# Seed database (optional)
heroku run npm run db:seed

# Connect to database
heroku pg:psql

# View all apps
heroku apps

# View app info
heroku apps:info

# View config vars
heroku config

# Set new config var
heroku config:set KEY=value

# Delete config var
heroku config:unset KEY

# View addons
heroku addons

# View database backups
heroku pg:backups

# Create database backup
heroku pg:backups:capture

# View release history
heroku releases

# Roll back to previous release
heroku rollback
```

---

## 🐛 Troubleshooting

### "Error: not logged in"
**Solution:** Run `heroku login` first

### "Error: Invalid credentials"
**Solution:** 
1. Clear credentials: `rm ~/.netrc`
2. Login again: `heroku login`

### "App already exists"
**Solution:**
1. List your apps: `heroku apps`
2. Use existing app: `heroku git:remote -a YOUR-APP-NAME`

### "No PostgreSQL addon"
**Solution:** `heroku addons:create heroku-postgresql:essential-0`

### "Build failed"
**Solution:**
1. Check logs: `heroku logs --tail`
2. Verify package.json is correct
3. Ensure all dependencies are listed

### "Application Error" page
**Solution:**
1. Check logs: `heroku logs --tail`
2. Verify environment variables: `heroku config`
3. Ensure NEXTAUTH_SECRET is set
4. Restart app: `heroku restart`

### Database connection error
**Solution:**
1. Check DATABASE_URL: `heroku config:get DATABASE_URL`
2. Verify addon: `heroku addons`
3. Run migrations: `heroku run npm run db:push`

---

## 💰 Cost Summary

- **PostgreSQL Essential-0**: $5/month (required)
- **Web Dyno**: 
  - Free tier: Apps sleep after 30 min inactivity
  - Hobby ($7/month): Always on, custom domains

---

## 📊 Monitoring Your App

### Real-Time Monitoring
```bash
# Watch logs continuously
heroku logs --tail

# Filter logs
heroku logs --tail --source app
heroku logs --tail --ps web
```

### Performance Metrics
```bash
# View dyno info
heroku ps

# View database size
heroku pg:info

# View app info
heroku apps:info
```

---

## 🔄 Updating Your App

After making code changes:

```bash
# Commit changes
git add .
git commit -m "Your changes"

# Deploy to Heroku
git push heroku HEAD:main

# Watch the deployment
heroku logs --tail
```

---

## 🎉 Success Checklist

After deployment, verify:

- [ ] App opens without error: `heroku open`
- [ ] Logs show no errors: `heroku logs --tail`
- [ ] Database is connected: `heroku pg:info`
- [ ] Environment variables are set: `heroku config`
- [ ] User registration works
- [ ] User login works
- [ ] All pages load correctly

---

## 📚 Additional Resources

- Heroku CLI Reference: https://devcenter.heroku.com/articles/heroku-cli
- Heroku Logs: https://devcenter.heroku.com/articles/logging
- Heroku Postgres: https://devcenter.heroku.com/articles/heroku-postgresql
- Next.js on Heroku: https://github.com/heroku/heroku-buildpack-nodejs

---

## ⚡ Quick Deploy (TL;DR)

```bash
# 1. Login
heroku login

# 2. Create app
heroku create

# 3. Add database
heroku addons:create heroku-postgresql:essential-0

# 4. Set environment variables
heroku config:set NEXTAUTH_SECRET=$(openssl rand -base64 32)
heroku config:set NEXTAUTH_URL=$(heroku apps:info -s | grep web-url | cut -d= -f2)

# 5. Deploy
git push heroku HEAD:main

# 6. Open
heroku open
```

---

**Ready to deploy?** Start with Step 1 above! 🚀
