import express, { Express } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { errorHandler } from './middleware/errorMiddleware';
import { logger } from './utils/logger';
import userRoutes from './routes/userRoutes';
import authRoutes from './routes/authRoutes';
import articleRoutes from './routes/articleRoutes';
import keywordRoutes from './routes/keywordRoutes';
import generationRoutes from './routes/generationRoutes';
import analyzeRoutes from './routes/analyzeRoutes';

// Load environment variables
dotenv.config();

// Initialize Express app
const app: Express = express();
const port = process.env.PORT || 4000;

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI as string);
    logger.info(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`Error connecting to MongoDB: ${error}`);
    process.exit(1);
  }
};

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(helmet());
app.use(morgan('dev'));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/keywords', keywordRoutes);
app.use('/api/generate', generationRoutes);
app.use('/api/analyze', analyzeRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Error handling middleware
app.use(errorHandler);

// Start the server
connectDB().then(() => {
  app.listen(port, () => {
    logger.info(`Server started on port ${port} in ${process.env.NODE_ENV} mode`);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  logger.error(`Unhandled Promise Rejection: ${err.message}`);
  process.exit(1);
}); 