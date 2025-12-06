# Quick Deploy to Heroku

## One-Time Setup

```bash
# 1. Login to Heroku
heroku login

# 2. Create app
heroku create your-app-name

# 3. Add PostgreSQL
heroku addons:create heroku-postgresql:essential-0

# 4. Set environment variables
heroku config:set NEXTAUTH_SECRET=$(openssl rand -base64 32)
heroku config:set NEXTAUTH_URL=https://your-app-name.herokuapp.com
```

## Deploy

```bash
# Deploy your code
git push heroku main

# Check logs
heroku logs --tail

# Open app
heroku open
```

## Common Commands

```bash
# View app info
heroku info

# View config vars
heroku config

# View database info
heroku pg:info

# Run migrations manually
heroku run npm run db:push

# Seed database
heroku run npm run db:seed

# Restart app
heroku restart

# View logs
heroku logs --tail

# Scale dynos
heroku ps:scale web=1
```

## Troubleshooting

```bash
# Check build logs
heroku logs --source app --tail

# Check database connection
heroku pg:psql

# Run bash on Heroku
heroku run bash
```

For detailed instructions, see [HEROKU_DEPLOYMENT.md](./HEROKU_DEPLOYMENT.md)
