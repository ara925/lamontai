# GitHub & Cloudflare Deployment Guide

This guide explains how to use the GitHub Actions workflow for deploying to Cloudflare Pages with separate staging and production environments.

## Setup Instructions

### 1. GitHub Repository Setup

1. **Create the required branches**:
   ```bash
   # Create and push the staging branch
   git checkout -b staging
   git push -u origin staging
   
   # Make sure your main branch is up to date
   git checkout main
   git push origin main
   ```

2. **Configure branch protection rules** (in GitHub repository settings):
   - Protect the `main` branch to require pull request reviews
   - Optionally protect the `staging` branch as well

### 2. GitHub Secrets Configuration

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

1. **Cloudflare credentials**:
   - `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token with Pages access
   - `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID

2. **Authentication secrets**:
   - `NEXTAUTH_SECRET`: Secret key for NextAuth session encryption
   - `JWT_SECRET`: Secret key for JWT token generation (should match NEXTAUTH_SECRET)

3. **Database connection strings**:
   - `DATABASE_URL_CLOUDFLARE`: Connection string to your Cloudflare D1 or SQL database for production
   - `DATABASE_URL_CLOUDFLARE_STAGING`: Connection string to your Cloudflare database for staging
   
   For Cloudflare D1 databases, the connection string follows this format:
   ```
   prisma://DATABASE_URL_REPLACEMENT/DATABASE_HOST/DATABASE_NAME?api_key=CLOUDFLARE_API_TOKEN
   ```
   
   For Cloudflare SQL databases (PostgreSQL), use:
   ```
   postgresql://username:password@CLOUDFLARE_DB_ID.SQL_HOSTNAME:5432/DATABASE_NAME?sslmode=require
   ```

4. **Other credentials**:
   - `REDIS_URL`: (Optional) Connection string to Redis
   - `OPENAI_API_KEY`: API key for OpenAI integration

### 3. Cloudflare Pages and Database Setup

1. **Create two Cloudflare Pages projects**:
   - `lamontai` for production
   - `lamontai-staging` for staging

2. **Configure domains in Cloudflare**:
   - Production: `app.lamontai.com` (or your chosen domain)
   - Staging: `staging.lamontai.com` (or your chosen staging domain)

3. **Set up Cloudflare database access**:
   - Create a Cloudflare Database (your ID: `715abbe3-5697-497b-8a6a-f4722632b741`)
   - Configure network access to allow connections from Cloudflare Pages
   - Create a database user with appropriate permissions
   - Get the connection string from Cloudflare Dashboard

4. **Note**: Environment variables will be set by the GitHub workflow, not in the Cloudflare dashboard.

## Development and Deployment Workflow

### Local Development

1. **Clone the repository and install dependencies**:
   ```bash
   git clone https://github.com/yourusername/lamontai.git
   cd lamontai
   npm install
   ```

2. **Create a local environment file**:
   - Copy `.env.example` to `.env.local` and fill in your development environment variables
   - For local Cloudflare database testing, add your Cloudflare database connection string:
     ```
     DATABASE_URL=postgresql://username:password@715abbe3-5697-497b-8a6a-f4722632b741.YOUR_HOSTNAME:5432/database_name?sslmode=require
     CLOUDFLARE_DB_ID=715abbe3-5697-497b-8a6a-f4722632b741
     ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Test Cloudflare compatibility locally**:
   ```bash
   NEXT_PUBLIC_DEPLOY_ENV=cloudflare npm run dev
   ```

### Feature Development

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/new-feature
   ```

2. **Develop and test locally**:
   - Make your changes
   - Test thoroughly with `npm test` and manual testing

3. **Push your feature branch**:
   ```bash
   git push -u origin feature/new-feature
   ```

4. **Create a Pull Request to the staging branch**:
   - Base: `staging`
   - Compare: `feature/new-feature`
   - The GitHub workflow will run tests on your PR

### Staging Deployment

1. **Merge your PR to the staging branch**:
   - This automatically triggers a deployment to the staging environment
   - GitHub Actions will:
     - Run tests
     - Build the application with Cloudflare configuration
     - Deploy to your staging Cloudflare Pages project

2. **Verify on staging**:
   - Test on your staging domain (e.g., `staging.lamontai.com`)
   - Run QA and verify everything works correctly

### Production Deployment

1. **Create a PR from staging to main**:
   - Base: `main`
   - Compare: `staging`
   - Add detailed release notes

2. **Merge to main**:
   - This automatically triggers deployment to production
   - GitHub Actions will:
     - Run tests
     - Build the application with production configuration
     - Deploy to your production Cloudflare Pages project

3. **Verify on production**:
   - Test on your production domain
   - Monitor for any issues

## Troubleshooting

### Checking Workflow Status

1. Navigate to the "Actions" tab in your GitHub repository
2. Check the logs for the most recent workflow run
3. Look for any failed steps or error messages

### Common Issues

1. **Build failures**:
   - Check Node.js version compatibility
   - Verify all dependencies are correctly installed
   - Look for linting errors or failed tests

2. **Deployment failures**:
   - Verify Cloudflare API tokens have correct permissions
   - Check if the Cloudflare Pages projects exist
   - Ensure the `directory` parameter matches your build output directory

3. **Database connection issues**:
   - Verify your Cloudflare database connection strings are correct
   - Check that your database ID (`715abbe3-5697-497b-8a6a-f4722632b741`) is correctly set
   - Ensure network access is configured to allow connections from Cloudflare Pages
   - Check for any IP restrictions on your database

4. **Runtime issues**:
   - Verify environment variables are correctly set
   - Check that database connections are properly configured
   - Look for CORS issues with API endpoints

## Advanced Configuration

### Customizing the Workflow

The workflow file is located at `.github/workflows/cloudflare-deploy.yml`. You can customize:

1. **Node.js version**:
   ```yaml
   uses: actions/setup-node@v3
   with:
     node-version: '18'  # Change to your preferred version
   ```

2. **Test and build commands**:
   ```yaml
   run: npm test  # Change to your test command
   ```

3. **Environment variables and domains**:
   ```yaml
   if [[ ${{ github.ref }} == 'refs/heads/main' ]]; then
     echo "APP_DOMAIN=app.lamontai.com"  # Change to your domain
   ```

### Adding Preview Deployments

To enable preview deployments for pull requests:

1. Modify the workflow to support PR deployments
2. Create a third Cloudflare Pages project for previews
3. Configure unique subdomain patterns for preview deployments

## Best Practices

1. **Keep secrets secure**:
   - Never commit sensitive data to the repository
   - Regularly rotate API keys and secrets
   - Use separate database credentials for staging and production

2. **Test thoroughly before deploying**:
   - Always verify changes on staging before merging to main
   - Include automated tests for critical functionality
   - Test database migrations on staging first

3. **Document your changes**:
   - Write clear commit messages
   - Include detailed descriptions in pull requests
   - Update documentation as needed

4. **Monitor deployments**:
   - Set up alerts for failed deployments
   - Monitor application performance after deployments
   - Check database performance and connection pooling 