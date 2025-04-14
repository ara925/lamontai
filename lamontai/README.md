# LamontAI

LamontAI is a modern AI-powered content generation and SEO optimization platform built with Next.js, PostgreSQL, and Redis.

## Features

- AI-powered content generation
- SEO analysis and optimization
- User authentication and account management
- Subscription-based plans
- Website sitemap processing
- Content analysis and writing style detection
- Redis caching for improved performance

## Tech Stack

- **Frontend**: Next.js, TailwindCSS, React
- **Backend**: Next.js API Routes, Node.js, Express
- **Database**: PostgreSQL with Prisma ORM
- **Caching**: Redis for fast data retrieval
- **Authentication**: JWT-based auth with cookies
- **AI**: OpenAI GPT models for content generation
- **Logging**: Winston with daily-rotate-file
- **Rate Limiting**: Built-in rate limiting for API protection

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Redis (optional, falls back to in-memory cache)

### Environment Setup

1. Clone the repository
   ```
   git clone https://github.com/yourusername/lamontai.git
   cd lamontai
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Create a `.env` file based on the example
   ```
   cp .env.example .env
   ```

4. Update the `.env` file with your specific configuration:
   - Database credentials
   - JWT secret
   - OpenAI API key
   - Redis connection details

### Database Setup

1. Start the PostgreSQL database:
   ```
   docker-compose up -d postgres
   ```

2. Run database migrations:
   ```
   npx prisma migrate dev
   ```

3. Seed the database with initial data:
   ```
   npx prisma db seed
   ```

### Redis Setup

1. Start Redis using Docker:
   ```
   docker-compose up -d redis
   ```

2. Access Redis Commander web UI (optional):
   ```
   http://localhost:8081
   ```

### Running the Application

1. Start the development server:
   ```
   npm run dev
   ```

2. Access the application:
   ```
   http://localhost:3001
   ```

## Production Deployment

For production deployment, consider the following best practices:

1. Set `NODE_ENV=production` in your environment
2. Configure logging:
   - Set `LOG_LEVEL` appropriately (info, warn, error)
   - Set `LOG_TO_CONSOLE=false` to disable console logging in production
3. Enable Redis caching:
   - Ensure `REDIS_ENABLED=true`
   - Configure `REDIS_HOST`, `REDIS_PORT`, and `REDIS_PASSWORD`
4. Add production SSL certificates
5. Consider deploying with Docker:
   ```
   docker-compose -f docker-compose.prod.yml up -d
   ```

## API Documentation

The application provides several API endpoints:

### Authentication

- `POST /api/auth/register` - Create a new user account
- `POST /api/auth/login` - Authenticate and get a token
- `GET /api/auth/me` - Get current user information
- `POST /api/auth/logout` - Invalidate the current token

### Content Generation

- `POST /api/generate` - Generate content based on keywords and parameters

### Sitemap Processing

- `POST /api/user/sitemap` - Save and process a website sitemap
- `GET /api/content/relevant-links` - Find relevant links based on a topic
- `GET /api/content/analyze-writing-style` - Analyze writing style from sitemap content

### System

- `GET /api/health` - Check system health and service status

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5434/lamontai` |
| `JWT_SECRET` | Secret for signing JWTs | (random string) |
| `REDIS_HOST` | Redis server hostname | `localhost` |
| `REDIS_PORT` | Redis server port | `6379` |
| `REDIS_PASSWORD` | Redis password | `""` |
| `REDIS_ENABLED` | Enable Redis caching | `true` |
| `OPENAI_API_KEY` | OpenAI API key | (required for content generation) |
| `PORT` | Application port | `3001` |
| `NODE_ENV` | Environment | `development` |
| `LOG_LEVEL` | Logging level | `info` |

## Rate Limiting

The API implements rate limiting to prevent abuse:

- Default: 100 requests per minute
- Auth endpoints: 10 requests per minute
- Content generation: 5 requests per minute

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

Your Name - [@yourusername](https://twitter.com/yourusername)

Project Link: [https://github.com/yourusername/lamontai](https://github.com/yourusername/lamontai)

## Running Database Migrations

To run the latest database migrations, use the following command:

```bash
npx prisma migrate dev
```

This will apply all pending migrations, including the websiteUrl field to the Settings table.

If you're working with an existing database in production, you can use:

```bash
npx prisma migrate deploy
```

After running migrations, make sure to update the Prisma client:

```bash
npx prisma generate
```

## Production Setup

The application includes several production-ready components for reliability, monitoring, and performance:

### Backup Strategy

Automated database backups are included in the application:

```bash
# Run a database backup
npm run db:backup

# Restore a database backup
npm run db:restore

# Perform database maintenance (vacuum)
npm run db:vacuum
```

The backup scripts create timestamped backups in the `backups` directory and automatically manage retention.

### Monitoring & Observability

The application includes system monitoring capabilities:

```bash
# Run system health check
npm run monitor

# Rotate log files
npm run logs:rotate

# Setup automated monitoring (cron jobs)
npm run setup:cron
```

The monitoring scripts check CPU, memory, disk usage, and database connectivity.

### Graceful Failure Handling

The application includes circuit breaker patterns and graceful failure handling:

1. **Circuit Breakers**: Prevent cascading failures when external services are down
2. **Fallback Mechanisms**: Provide fallback responses when services are unavailable
3. **Timeout Handling**: Prevent requests from hanging indefinitely

### Performance Optimizations

1. **Redis Caching**: API responses are cached to improve performance
2. **Response Compression**: API responses are automatically compressed
3. **Security Headers**: Secure headers are added to all API responses
4. **Database Indexing**: Key database fields are indexed for faster queries

## Cloudflare Deployment with Neon PostgreSQL

This application is configured to work with Cloudflare Pages/Workers using Neon PostgreSQL for database storage, which is optimized for serverless environments.

### Neon PostgreSQL Setup

1. Create an account at [Neon](https://neon.tech/) and create a new PostgreSQL database
2. Copy your connection string from the Neon dashboard
3. Add the following environment variables to your Cloudflare deployment:
   ```
   DATABASE_URL=postgresql://user:password@your-neon-db.neon.tech/neondb?sslmode=require
   DIRECT_URL=postgresql://user:password@your-neon-db.neon.tech/neondb?sslmode=require
   NEXT_PUBLIC_DEPLOY_ENV=cloudflare
   NEXT_PUBLIC_CLOUDFLARE_ENABLED=true
   ```

### Preparing for Cloudflare Deployment

Run the following command to prepare your application for Cloudflare:

```bash
npm run cloudflare:prepare
```

This script:
1. Validates your environment variables
2. Uses the Neon-specific Prisma schema
3. Installs necessary dependencies for Neon PostgreSQL
4. Generates the Prisma client for Cloudflare

### Deploying to Cloudflare Pages

1. Set up a Cloudflare Pages project
2. Configure the build command:
   ```
   npm run cloudflare:build
   ```
3. Add all environment variables from your `.env` file
4. Deploy your application

Your application is now using Neon PostgreSQL which is designed for serverless environments like Cloudflare Pages or Workers.

## Edge-Compatible APIs

LamontAI includes Edge-compatible API routes designed to run on Cloudflare and other edge runtime environments. These APIs offer lower latency and better performance for users worldwide.

See [README-EDGE-API.md](./README-EDGE-API.md) for detailed documentation on:
- Edge API implementation details
- Authentication in edge environments
- Database connectivity with Neon PostgreSQL
- Differences between Node.js and Edge APIs
- When to use Edge vs. Node.js APIs
