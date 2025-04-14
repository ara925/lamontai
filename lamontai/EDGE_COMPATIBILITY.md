# Edge Runtime Compatibility Guide

This guide provides information on how to build and deploy your Lamontai application to Cloudflare's Edge Runtime environment.

## Understanding Edge Runtime

Edge Runtime is a serverless execution environment that runs on Cloudflare's global network, close to your users. It's designed for high performance and low latency, but has some limitations compared to Node.js:

- No access to Node.js-specific APIs like `fs`, `path`, etc.
- Limited support for NPM packages that use Node.js internals
- Differences in authentication and database access patterns

## Edge-Compatible Components

The following components have been specifically designed to work in Edge Runtime:

### 1. Authentication

- **Edge JWT Authentication**: JWT-based authentication that works in Edge using Web Crypto API
- **Custom NextAuth Adapter**: Tailored for Edge compatibility (`src/lib/auth-adapter-edge.ts`)
- **Edge-specific Auth Config**: Configured for JWT-based auth (`src/lib/auth-config-edge.ts`)

### 2. Database Access

- **Neon PostgreSQL Client**: Edge-compatible database client (`src/lib/prisma-cloudflare.ts`)
- **Edge-Optimized Queries**: Simplified queries to work within Edge limits

### 3. API Routes

- **Edge API Routes**: Located in `/src/app/api/*/edge/route.ts`
- **Simple Test Route**: Available at `/api/stest` for quickly testing Edge functionality
- **Edge Test Endpoint**: Available at `/api/edge-test` for comprehensive Edge testing

## Making Components Edge Compatible

Here are patterns to follow when creating Edge-compatible components:

### API Routes

```typescript
// Specify Edge runtime 
export const runtime = 'edge';

// Dynamic rendering (important for authenticated routes)
export const dynamic = 'force-dynamic';

// Use NextRequest and Response from next/server
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  // Use Edge-compatible libraries and patterns
  return new Response(JSON.stringify({ message: 'Hello Edge!' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
```

### Authentication

For Edge-compatible authentication:

1. Use `auth-utils-edge.ts` for JWT operations
2. Use `getTokenFromRequestEdge` and `verifyJWTEdge` for auth
3. Handle authorization in each route (middleware is less reliable in Edge)

### Database Access

For Edge-compatible database access:

1. Import `getNeonPrismaClient` from `prisma-cloudflare.ts`
2. Use it to get a database client: `const prisma = await getNeonPrismaClient()`
3. Keep queries simple and efficient
4. Properly handle connection cleanup

## Environment Variables

To indicate Edge compatibility, set:

```
NEXT_PUBLIC_DEPLOY_ENV=cloudflare
NEXT_PUBLIC_CLOUDFLARE_ENABLED=true
```

These variables are used to trigger Edge-specific behaviors in the application.

## Testing Edge Compatibility

Use the following methods to test Edge compatibility:

### Local Development

```bash
# Run with Cloudflare compatibility mode
npm run cloudflare:dev

# Test specific endpoints
curl http://localhost:3001/api/stest
curl http://localhost:3001/api/edge-test?skipAuth=true
```

### Edge-Specific Testing

```bash
# Build and run with Edge optimizations
npm run cloudflare:test-edge
```

## Common Issues and Solutions

### Authentication Issues

**Problem**: JWT validation fails in Edge runtime

**Solution**: Ensure NEXTAUTH_SECRET and JWT_SECRET are properly set and match

### Database Connection Issues

**Problem**: Can't connect to database from Edge runtime

**Solution**: 
- Ensure DATABASE_URL is properly formatted
- Verify CLOUDFLARE_DB_ID is set
- Check database allows connections from Cloudflare IPs

### Module Import Issues

**Problem**: "Can't find module X" errors in Edge runtime

**Solution**: 
- Check if the module has Edge compatibility
- Use dynamic imports for potentially problematic modules
- Find Edge-compatible alternatives

## Deployment Checklist

Before deploying to Cloudflare, ensure:

1. All critical routes have Edge-compatible versions or fallbacks
2. Database connection works with Neon PostgreSQL
3. Authentication flows work properly in Edge
4. All environment variables are set in Cloudflare dashboard:
   - DATABASE_URL
   - CLOUDFLARE_DB_ID
   - NEXTAUTH_SECRET
   - JWT_SECRET
   - NEXT_PUBLIC_DEPLOY_ENV=cloudflare
   - NEXT_PUBLIC_CLOUDFLARE_ENABLED=true

## Cloudflare Pages Configuration

Configure your Cloudflare Pages project with:

- **Build command**: `npm run cloudflare:build`
- **Build output directory**: `.next`
- **Environment variables**: As listed in the checklist above

## Additional Resources

- [Next.js on Edge Runtime Documentation](https://nextjs.org/docs/pages/building-your-application/rendering/edge-and-nodejs-runtimes)
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Neon PostgreSQL Documentation](https://neon.tech/docs/) 