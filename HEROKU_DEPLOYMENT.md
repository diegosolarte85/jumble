# Heroku Deployment Guide for Jumble

This guide will help you deploy the Jumble co-founder matching platform to Heroku.

## Prerequisites

1. A Heroku account (sign up at https://heroku.com)
2. Heroku CLI installed (`brew install heroku` on macOS, or download from https://devcenter.heroku.com/articles/heroku-cli)
3. Git installed and your code committed

## Step-by-Step Deployment

### 1. Login to Heroku

```bash
heroku login
```

### 2. Create a New Heroku App

```bash
heroku create your-app-name
# Or let Heroku generate a random name:
# heroku create
```

### 3. Add PostgreSQL Database

Heroku requires PostgreSQL instead of SQLite (which doesn't work on ephemeral filesystems).

```bash
heroku addons:create heroku-postgresql:essential-0
```

This will automatically set the `DATABASE_URL` environment variable.

### 4. Set Required Environment Variables

```bash
# Generate a secure secret for NextAuth
heroku config:set NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Set your app URL (replace with your actual Heroku app URL)
heroku config:set NEXTAUTH_URL=https://your-app-name.herokuapp.com

# Optional: Add OAuth provider credentials if you're using them
# heroku config:set GOOGLE_CLIENT_ID=your-google-client-id
# heroku config:set GOOGLE_CLIENT_SECRET=your-google-client-secret
# heroku config:set GITHUB_CLIENT_ID=your-github-client-id
# heroku config:set GITHUB_CLIENT_SECRET=your-github-client-secret

# Optional: Set ML Service URL if you're deploying it separately
# heroku config:set ML_SERVICE_URL=https://your-ml-service-url.com
```

### 5. Deploy to Heroku

```bash
git push heroku main
```

Or if you're on a different branch:

```bash
git push heroku your-branch-name:main
```

### 6. Verify Deployment

Check the logs to ensure everything is working:

```bash
heroku logs --tail
```

Open your app in the browser:

```bash
heroku open
```

### 7. Check Database Connection

You can view your PostgreSQL database info:

```bash
heroku pg:info
```

Connect to the database directly (optional):

```bash
heroku pg:psql
```

## Database Migrations

The app is configured to automatically run database migrations after each build via the `postbuild` script. This happens automatically when you deploy.

To manually run migrations:

```bash
heroku run npm run db:push
```

## Seed Data (Optional)

To seed the database with test data:

```bash
heroku run npm run db:seed
```

## Monitoring and Maintenance

### View Logs

```bash
heroku logs --tail
```

### Scale Dynos

```bash
# View current dyno status
heroku ps

# Scale web dynos (free tier only allows 1)
heroku ps:scale web=1
```

### Restart the App

```bash
heroku restart
```

### Update Environment Variables

```bash
heroku config:set VARIABLE_NAME=value
```

### View All Environment Variables

```bash
heroku config
```

## Database Management

### Backup Database

```bash
heroku pg:backups:capture
heroku pg:backups:download
```

### Reset Database (WARNING: This deletes all data)

```bash
heroku pg:reset DATABASE_URL
heroku run npm run db:push
```

## Troubleshooting

### Build Failures

1. Check the build logs:
   ```bash
   heroku logs --tail
   ```

2. Ensure all dependencies are in `dependencies` not `devDependencies` if they're needed at runtime

3. Verify Node.js version compatibility in `package.json`:
   ```json
   "engines": {
     "node": "18.x"
   }
   ```

### Database Connection Issues

1. Verify DATABASE_URL is set:
   ```bash
   heroku config:get DATABASE_URL
   ```

2. Check if PostgreSQL addon is attached:
   ```bash
   heroku addons
   ```

### Application Errors

1. Check application logs:
   ```bash
   heroku logs --tail
   ```

2. Run a one-off dyno for debugging:
   ```bash
   heroku run bash
   ```

## Cost Optimization

### Free Tier Limitations

- Apps sleep after 30 minutes of inactivity
- 550-1000 free dyno hours per month
- PostgreSQL Essential-0 plan: $5/month (required for production)

### Recommendations

1. Use the Heroku Scheduler addon for periodic tasks instead of worker dynos
2. Monitor your dyno usage with `heroku ps`
3. Consider upgrading to Hobby tier ($7/month) for always-on apps

## CI/CD Integration

### Automatic Deploys from GitHub

1. Connect your GitHub repository in the Heroku Dashboard
2. Enable automatic deploys from your main branch
3. Optionally enable "Wait for CI to pass" if you have CI/CD setup

### Using GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Heroku

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: akhileshns/heroku-deploy@v3.12.12
        with:
          heroku_api_key: ${{secrets.HEROKU_API_KEY}}
          heroku_app_name: "your-app-name"
          heroku_email: "your-email@example.com"
```

## Python ML Service (Optional)

If you want to deploy the Python ML service alongside the Node.js app, you have a few options:

### Option 1: Separate Heroku App

Deploy the ML service as a separate Heroku app and point to it via the `ML_SERVICE_URL` environment variable.

### Option 2: Multi-Buildpack

Use Heroku's multi-buildpack feature to run both Node.js and Python:

```bash
heroku buildpacks:add --index 1 heroku/python
heroku buildpacks:add --index 2 heroku/nodejs
```

Update your `Procfile` to start both services:

```
web: npm run start
worker: cd python-ml-service && python main.py
```

### Option 3: External ML Service

Consider using a managed ML service or deploying the Python service to Railway, Render, or AWS Lambda.

## Additional Resources

- [Heroku Node.js Documentation](https://devcenter.heroku.com/articles/getting-started-with-nodejs)
- [Heroku PostgreSQL Documentation](https://devcenter.heroku.com/articles/heroku-postgresql)
- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- [Drizzle ORM Documentation](https://orm.drizzle.team/docs/overview)

## Support

If you encounter issues:

1. Check Heroku status: https://status.heroku.com
2. Review application logs: `heroku logs --tail`
3. Consult Heroku documentation: https://devcenter.heroku.com
4. Open an issue in the project repository

## Local Testing of Production Build

Before deploying, test the production build locally:

```bash
# Build the app
npm run build

# Set PostgreSQL URL for local testing (optional)
export DATABASE_URL="postgresql://localhost/jumble_test"

# Start the production server
npm run start
```

This ensures your build works correctly before deploying to Heroku.
