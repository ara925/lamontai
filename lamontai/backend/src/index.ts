import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { errorHandler, notFound } from './utils/errorHandler';
import { testConnection } from './config/database';
import { syncDatabase } from './models';
import rateLimit from 'express-rate-limit';
import winston from 'winston';
import { createLogger } from './utils/logger';

// Import routes
import authRoutes from './routes/authRoutes';
import articleRoutes from './routes/articleRoutes';
import subscriptionRoutes from './routes/subscriptionRoutes';

// Load environment variables
dotenv.config();

// Initialize logger
const logger = createLogger();

// Create Express app
const app = express();

// Set port
const PORT = process.env.PORT || 5000;

// Configure CORS options
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:3000'];

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes by default
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000', 10), // Increase from 100 to 1000 for testing
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: 'Too many requests from this IP, please try again later'
});

// Apply security middleware
app.use(cors(corsOptions));
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', {
  stream: {
    write: (message: string) => {
      logger.info(message.trim());
    }
  }
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Apply rate limiting to all requests
app.use(limiter);

// Apply CSRF protection for production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    // Skip CSRF check for GET, HEAD, OPTIONS requests
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }

    // Check origin header against allowed origins
    const origin = req.headers.origin;
    if (!origin || (typeof origin === 'string' && allowedOrigins.includes(origin))) {
      next();
    } else {
      res.status(403).json({ message: 'CSRF protection: invalid origin' });
    }
  });
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/subscriptions', subscriptionRoutes);

// Add the health endpoint under /api/health as well for frontend compatibility
app.get('/api/health', async (req: Request, res: Response) => {
  try {
    // Test database connection
    await testConnection();
    
    res.json({
      status: 'UP',
      database: 'CONNECTED',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      version: '1.0.0'
    });
  } catch (error) {
    res.status(503).json({
      status: 'UP',
      database: 'DISCONNECTED',
      error: error instanceof Error ? error.message : 'Unknown database error',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      version: '1.0.0'
    });
  }
});

// Root route
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Welcome to Lamont.ai API',
    version: '1.0.0',
    environment: process.env.NODE_ENV
  });
});

// Health check endpoint at root level (keep for backward compatibility)
app.get('/health', async (req: Request, res: Response) => {
  try {
    // Test database connection
    await testConnection();
    
    res.json({
      status: 'UP',
      database: 'CONNECTED',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      version: '1.0.0'
    });
  } catch (error) {
    res.status(503).json({
      status: 'UP',
      database: 'DISCONNECTED',
      error: error instanceof Error ? error.message : 'Unknown database error',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      version: '1.0.0'
    });
  }
});

// Error handling
app.use(notFound);
app.use(errorHandler);

// Initialize database and start server
const initializeApp = async () => {
  try {
    // Test database connection
    await testConnection();
    logger.info('Database connection established successfully');
    
    // Sync database models in development only
    if (process.env.NODE_ENV === 'development') {
      await syncDatabase(false);
      logger.info('Database synced successfully');
    }
    
    // Start server after database is connected and synced
    app.listen(PORT, () => {
      logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to initialize application:', error);
    process.exit(1);
  }
};

// Start the application
initializeApp();

// Handle uncaught exceptions and rejections
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

export default app; 