# MPCI Stock Monitor - Vercel Deployment Guide

This guide provides step-by-step instructions for deploying the MPCI Stock Monitor application to Vercel.

## Prerequisites

Before deploying to Vercel, ensure you have:

1. A Vercel account (https://vercel.com)
2. GitHub repository connected to Vercel
3. A MySQL database (e.g., PlanetScale, AWS RDS, or DigitalOcean)
4. Required API credentials and secrets

## Project Structure

The project is a full-stack application with:

- **Frontend**: React + TypeScript + Vite (in `/client`)
- **Backend**: Express.js + tRPC (in `/server`)
- **Database**: MySQL with Drizzle ORM
- **Build Output**: Static assets in `/dist/public` and server bundle in `/dist`

## Environment Variables

The following environment variables must be configured in Vercel:

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `VITE_APP_ID` | Application ID for OAuth | Your app ID |
| `JWT_SECRET` | Secret for JWT token signing | Generate a strong random string |
| `DATABASE_URL` | MySQL connection string | `mysql://user:pass@host/db` |
| `OAUTH_SERVER_URL` | OAuth server endpoint | `https://oauth.example.com` |
| `OWNER_OPEN_ID` | Owner's OpenID for notifications | Your OpenID |
| `BUILT_IN_FORGE_API_URL` | Forge API endpoint for scheduled tasks | `https://forge.example.com` |
| `BUILT_IN_FORGE_API_KEY` | API key for Forge service | Your API key |

### Optional Variables

- `PORT`: Server port (default: 3000, Vercel manages this)
- `VITE_OAUTH_PORTAL_URL`: OAuth portal URL for frontend

## Deployment Steps

### 1. Connect GitHub Repository to Vercel

1. Go to https://vercel.com/dashboard
2. Click "Add New" → "Project"
3. Select your GitHub repository: `Mahmoudsami11095/stocks-monitor-manus`
4. Click "Import"

### 2. Configure Build Settings

Vercel should auto-detect the following:

- **Framework Preset**: Vite
- **Build Command**: `pnpm build`
- **Output Directory**: `dist`
- **Install Command**: `pnpm install`

If not auto-detected, configure manually:

1. In Project Settings → "Build & Development Settings"
2. Set Build Command: `pnpm build`
3. Set Output Directory: `dist`
4. Set Install Command: `pnpm install`

### 3. Add Environment Variables

1. Go to Project Settings → "Environment Variables"
2. Add each required variable from the table above
3. Set the environment scope to "Production", "Preview", and "Development" as needed

**Important**: For sensitive variables like `JWT_SECRET` and `BUILT_IN_FORGE_API_KEY`, use strong random values.

To generate a strong JWT_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Database Setup

Ensure your MySQL database is:

1. **Accessible from Vercel**: Allow connections from Vercel's IP ranges
2. **Initialized**: Run migrations before first deployment

To run migrations locally before deployment:
```bash
DATABASE_URL="your-connection-string" pnpm db:push
```

Or after deployment, using Vercel's deployment logs.

### 5. Deploy

1. Push your code to the `main` branch on GitHub
2. Vercel will automatically trigger a deployment
3. Monitor the deployment in the Vercel dashboard
4. Once complete, your app will be available at `https://your-project.vercel.app`

## Post-Deployment

### Verify Deployment

1. Visit your deployed application URL
2. Check that the frontend loads correctly
3. Test API endpoints (e.g., `/api/trpc/health`)
4. Verify database connectivity

### Monitor Logs

1. Go to Project Settings → "Deployments"
2. Click on the latest deployment
3. View build and runtime logs

### Troubleshooting

#### Build Fails

- Check that all environment variables are set
- Verify `DATABASE_URL` is correct
- Ensure `pnpm-lock.yaml` is committed to Git

#### Runtime Errors

- Check Vercel deployment logs for error messages
- Verify all required environment variables are present
- Ensure database is accessible from Vercel

#### Database Connection Issues

- Verify `DATABASE_URL` format: `mysql://user:password@host:port/database`
- Check database firewall allows Vercel IPs
- Test connection locally first

## Scheduled Tasks (Cron Jobs)

This application includes scheduled stock data fetching via the Forge API. To enable:

1. Ensure `BUILT_IN_FORGE_API_URL` and `BUILT_IN_FORGE_API_KEY` are set
2. Configure the scheduled task endpoint: `/api/scheduled/fetch-mpci`
3. Set up a cron job trigger (external service or Forge scheduler)

For Vercel Cron (if available in your plan):
- Configure in `vercel.json` under `crons` section
- Ensure the cron endpoint is publicly accessible

## Performance Optimization

1. **Enable Compression**: Vercel handles this automatically
2. **Database Connection Pooling**: Configure in your MySQL connection string
3. **Static Asset Caching**: Vercel caches static files automatically
4. **API Response Caching**: Implement caching headers in tRPC routes

## Security Considerations

1. **Environment Variables**: Never commit `.env` files to Git
2. **JWT Secret**: Use a strong, randomly generated secret
3. **Database Credentials**: Use secure connection strings
4. **CORS Configuration**: Update allowed origins in production
5. **Rate Limiting**: Consider implementing rate limiting for API endpoints

## Rollback

To rollback to a previous deployment:

1. Go to Project Settings → "Deployments"
2. Find the deployment you want to rollback to
3. Click the three dots menu
4. Select "Promote to Production"

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Documentation](https://vitejs.dev)
- [Express.js Documentation](https://expressjs.com)
- [tRPC Documentation](https://trpc.io)
- [Drizzle ORM Documentation](https://orm.drizzle.team)

## Support

For deployment issues:

1. Check Vercel deployment logs
2. Review this guide for common issues
3. Check GitHub repository for issues
4. Contact Vercel support if infrastructure issues persist
