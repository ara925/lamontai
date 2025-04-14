# Cloudflare Deployment Guide

This guide explains how to deploy the application to Cloudflare Pages and Workers environments.

## Prerequisites

- Cloudflare account with Pages enabled
- Wrangler CLI installed (automatically installed by the deployment script)
- Environment variables configured in Cloudflare Dashboard

## Environment Setup

The application is designed to work in both development and Cloudflare environments. Here's how the environment detection works:

1. The application checks for `NEXT_PUBLIC_DEPLOY_ENV` environment variable
2. If set to `cloudflare`, it uses Cloudflare-specific configurations:
   - Edge-compatible database client
   - Cloudflare image loader
   - Standalone output format

## Configuration Files

- `.env.local` - Local development configuration
- `.env.production` - Production template for Cloudflare deployment

## Required Environment Variables in Cloudflare

Configure these in the Cloudflare Pages dashboard:

- `NEXTAUTH_SECRET` - Secret key for NextAuth session encryption
- `JWT_SECRET` - Secret key for JWT token generation (should match NEXTAUTH_SECRET)
- `DATABASE_URL` - Connection string to your database
- `REDIS_URL` - (Optional) Connection string to Redis
- `OPENAI_API_KEY` - API key for OpenAI integration
- `NEXT_PUBLIC_DEPLOY_ENV` - Set to `cloudflare`

## Local Development with Cloudflare Compatibility

To test Cloudflare compatibility locally:

```bash
# Run with Cloudflare environment
NEXT_PUBLIC_DEPLOY_ENV=cloudflare npm run dev
```

## Deploying to Cloudflare Pages

### Option 1: Using the Deployment Script

1. Set these environment variables locally:
   ```bash
   export CLOUDFLARE_API_TOKEN=your_api_token
   export CLOUDFLARE_ACCOUNT_ID=your_account_id
   ```

2. Run the deployment script:
   ```bash
   chmod +x cloudflare-deploy.sh
   ./cloudflare-deploy.sh
   ```

### Option 2: Manual Deployment

1. Build the application with Cloudflare environment:
   ```bash
   NEXT_PUBLIC_DEPLOY_ENV=cloudflare npm run build
   ```

2. Deploy using Wrangler:
   ```bash
   wrangler pages publish .next --project-name=lamontai
   ```

## Troubleshooting

### Database Connection Issues

If you encounter database connection issues in Cloudflare:

1. Ensure your database is accessible from Cloudflare's IP ranges
2. Check that your database provider supports serverless connections
3. For PostgreSQL, consider using [Neon](https://neon.tech) or [Supabase](https://supabase.com) which have good Cloudflare compatibility

### Authentication Issues

If authentication isn't working:

1. Verify `NEXTAUTH_SECRET` and `JWT_SECRET` are properly set in Cloudflare
2. Ensure `NEXTAUTH_URL` matches your deployed domain
3. Check browser console for CORS errors

### Image Loading Issues

If images aren't loading properly:

1. Verify `NEXT_PUBLIC_IMAGE_BASE_URL` is set correctly
2. Check that your image sources are accessible from Cloudflare

## Architecture Notes

The application uses a hybrid approach for database access:

- In Node.js environments, it uses the standard Prisma client
- In Cloudflare environments, it uses a specialized client via dynamic imports
- For token verification, it uses jose which is Edge-compatible

This design ensures compatibility across both standard Node.js deployments and Cloudflare's edge runtime. 