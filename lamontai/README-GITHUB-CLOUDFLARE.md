# Lamontai + GitHub + Cloudflare Integration

This README explains how to use the Lamontai application with GitHub for CI/CD and Cloudflare for hosting.

## Quick Start

1. **Set up the repository**:
   ```bash
   # Clone the repository
   git clone https://github.com/yourusername/lamontai.git
   cd lamontai
   
   # Run the setup script
   chmod +x setup-github-deployment.sh
   ./setup-github-deployment.sh
   
   # Push the staging branch
   git push -u origin staging
   ```

2. **Configure Cloudflare Database**:
   ```bash
   # Set up the database connection
   chmod +x setup-cloudflare-db.sh
   ./setup-cloudflare-db.sh
   ```
   
   The script will guide you through setting up the connection to your Cloudflare database (ID: `715abbe3-5697-497b-8a6a-f4722632b741`).

3. **Configure GitHub secrets**:
   Go to your GitHub repository settings → Secrets and variables → Actions and add:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
   - `NEXTAUTH_SECRET`
   - `JWT_SECRET`
   - `DATABASE_URL_CLOUDFLARE` (use the connection string from step 2)
   - `DATABASE_URL_CLOUDFLARE_STAGING` (use a similar connection string for staging)
   - `OPENAI_API_KEY`

4. **Create Cloudflare Pages projects**:
   - Create `lamontai` for production
   - Create `lamontai-staging` for staging

5. **Start developing**:
   ```bash
   # Create a feature branch
   git checkout -b feature/my-feature
   
   # Make changes and test locally
   npm run dev
   
   # Test Cloudflare compatibility
   NEXT_PUBLIC_DEPLOY_ENV=cloudflare npm run dev
   
   # Push your changes
   git push -u origin feature/my-feature
   ```

6. **Deploy to staging**:
   - Create a PR from your feature branch to `staging`
   - Merge the PR to deploy to staging automatically
   - Test on your staging environment

7. **Deploy to production**:
   - Create a PR from `staging` to `main`
   - Merge the PR to deploy to production automatically

## Testing Approaches

### 1. Fully Local Development
```bash
# Start the development server with local configuration
npm run dev
```
All APIs and database interactions stay within your local environment.

### 2. Local Development with Cloudflare Database
```bash
# First configure your database connection
./setup-cloudflare-db.sh

# Then run the development server
npm run dev
```
Your local app will connect to the Cloudflare database.

### 3. Local Frontend with Production Backend
Update your `.env.local`:
```
NEXT_PUBLIC_API_URL=https://app.lamontai.com/api
```
Run:
```bash
npm run dev
```
Your local frontend will make requests to the production API.

### 4. Cloudflare Compatibility Testing
```bash
NEXT_PUBLIC_DEPLOY_ENV=cloudflare npm run dev
```
This tests the Cloudflare-specific code paths locally.

## Cloudflare Database Details

The application is configured to use a Cloudflare Database with the ID: `715abbe3-5697-497b-8a6a-f4722632b741`.

To access this database:
1. Make sure your IP address is allowed in the Cloudflare Database network settings
2. Get the connection string from the Cloudflare dashboard
3. Run the `setup-cloudflare-db.sh` script to configure your local environment
4. Add the connection string to GitHub Secrets for deployment

## Detailed Documentation

For complete setup and usage instructions, see:

- [GITHUB_DEPLOYMENT.md](GITHUB_DEPLOYMENT.md) - Detailed GitHub workflow guide
- [CLOUDFLARE_DEPLOYMENT.md](CLOUDFLARE_DEPLOYMENT.md) - Cloudflare-specific configuration

## Directory Structure

```
lamontai/
├── .github/
│   └── workflows/
│       └── cloudflare-deploy.yml   # GitHub Actions workflow
├── .env.example                    # Example environment variables
├── .env.production                 # Production template
├── GITHUB_DEPLOYMENT.md            # GitHub deployment guide
├── CLOUDFLARE_DEPLOYMENT.md        # Cloudflare deployment guide
├── setup-github-deployment.sh      # Setup script
├── setup-cloudflare-db.sh          # Cloudflare Database setup script
└── src/
    └── lib/
        ├── auth-utils-edge.ts      # Edge-compatible auth utilities
        ├── cloudflare-image-loader.js # Cloudflare image loader
        └── prisma-cloudflare.ts    # Cloudflare database client
```

## Troubleshooting

If you encounter issues, check:

1. **GitHub Actions logs** in the Actions tab of your repository
2. **Cloudflare Pages logs** in the Cloudflare dashboard
3. **Cloudflare Database logs** in the Cloudflare dashboard
4. **Environment variables** are correctly set

For detailed troubleshooting, see [GITHUB_DEPLOYMENT.md](GITHUB_DEPLOYMENT.md). 