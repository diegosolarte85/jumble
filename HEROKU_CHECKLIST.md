# ✅ Heroku Deployment Checklist

Use this checklist to ensure a smooth deployment to Heroku.

## Before You Deploy

- [ ] You have a Heroku account (sign up at https://heroku.com)
- [ ] Heroku CLI is installed (`heroku --version` to check)
- [ ] You're logged into Heroku (`heroku login`)
- [ ] All changes are committed to git
- [ ] You've tested the app locally with `npm run dev`

## Deployment Steps

### 1. Create Heroku App
- [ ] Run: `heroku create your-app-name`
- [ ] Note your app URL (will be shown in output)

### 2. Add PostgreSQL Database
- [ ] Run: `heroku addons:create heroku-postgresql:essential-0`
- [ ] Wait for database provisioning (~1 minute)
- [ ] Verify: `heroku pg:info`

### 3. Configure Environment Variables
- [ ] Set NextAuth secret: `heroku config:set NEXTAUTH_SECRET=$(openssl rand -base64 32)`
- [ ] Set app URL: `heroku config:set NEXTAUTH_URL=https://your-app-name.herokuapp.com`
- [ ] Verify: `heroku config`

### 4. Optional: OAuth Providers
If you want Google/GitHub login:
- [ ] Get Google OAuth credentials from Google Cloud Console
- [ ] Set: `heroku config:set GOOGLE_CLIENT_ID=your-id GOOGLE_CLIENT_SECRET=your-secret`
- [ ] Get GitHub OAuth credentials from GitHub Developer Settings
- [ ] Set: `heroku config:set GITHUB_CLIENT_ID=your-id GITHUB_CLIENT_SECRET=your-secret`

### 5. Deploy Code
- [ ] Add all files: `git add .`
- [ ] Commit: `git commit -m "Configure Heroku deployment"`
- [ ] Push to Heroku: `git push heroku main`
- [ ] Watch build logs (automatic)

### 6. Verify Deployment
- [ ] Check logs: `heroku logs --tail`
- [ ] Look for "Listening on port" message
- [ ] Open app: `heroku open`
- [ ] Test registration/login
- [ ] Test main features

### 7. Database Setup (If Needed)
- [ ] Seed database: `heroku run npm run db:seed` (optional)
- [ ] Verify tables: `heroku pg:psql` then `\dt` (optional)

## Post-Deployment

### Monitoring
- [ ] Set up log monitoring: `heroku logs --tail`
- [ ] Check app metrics in Heroku Dashboard
- [ ] Set up error tracking (e.g., Sentry) - optional

### Custom Domain (Optional)
- [ ] Add custom domain in Heroku Dashboard
- [ ] Update DNS settings with your provider
- [ ] Update NEXTAUTH_URL: `heroku config:set NEXTAUTH_URL=https://your-domain.com`

### CI/CD (Optional)
- [ ] Connect GitHub repo in Heroku Dashboard
- [ ] Enable automatic deploys from main branch
- [ ] Enable "Wait for CI to pass before deploy"

## Troubleshooting Checklist

If something goes wrong:

- [ ] Check build logs: `heroku logs --tail --source app`
- [ ] Verify all environment variables: `heroku config`
- [ ] Check database connection: `heroku pg:info`
- [ ] Verify database URL: `heroku config:get DATABASE_URL`
- [ ] Check dyno status: `heroku ps`
- [ ] Try restarting: `heroku restart`
- [ ] Review Heroku status: https://status.heroku.com

## Common Issues

### "Application Error" Page
- Check logs: `heroku logs --tail`
- Verify NEXTAUTH_SECRET is set
- Ensure DATABASE_URL is set (automatic with addon)
- Try: `heroku restart`

### Build Failed
- Check package.json dependencies
- Ensure Node version is compatible (18.x)
- Check build logs for specific errors
- Verify all files are committed

### Database Connection Error
- Verify addon is attached: `heroku addons`
- Check DATABASE_URL: `heroku config:get DATABASE_URL`
- Try running migrations: `heroku run npm run db:push`

### App Works Locally But Not on Heroku
- Check environment variables are set on Heroku
- Verify NODE_ENV is "production"
- Check for hardcoded localhost URLs
- Review logs for specific errors

## Cost Tracking

Current setup costs:
- [ ] PostgreSQL Essential-0: **$5/month**
- [ ] Web Dyno: **Free** (with limitations) or **$7/month** (Hobby)

Monitor usage:
- [ ] Check dyno hours: `heroku ps`
- [ ] Review monthly costs in Heroku Dashboard

## Maintenance Tasks

Weekly:
- [ ] Check logs for errors
- [ ] Monitor app performance
- [ ] Review database usage: `heroku pg:info`

Monthly:
- [ ] Backup database: `heroku pg:backups:capture`
- [ ] Review and update dependencies
- [ ] Check for Heroku platform updates

As Needed:
- [ ] Scale dynos: `heroku ps:scale web=1`
- [ ] Update environment variables
- [ ] Deploy updates: `git push heroku main`

## Success Criteria

Your deployment is successful when:
- [ ] App opens without errors at your-app-name.herokuapp.com
- [ ] User registration works
- [ ] User login works
- [ ] All API endpoints respond correctly
- [ ] Database queries work
- [ ] No errors in logs (except expected warnings)

## Getting Help

- Documentation: [HEROKU_DEPLOYMENT.md](./HEROKU_DEPLOYMENT.md)
- Quick commands: [DEPLOY.md](./DEPLOY.md)
- Heroku docs: https://devcenter.heroku.com
- Your project logs: `heroku logs --tail`

---

**Need to restart?** Run through this checklist again to identify missing steps. Good luck! 🚀
