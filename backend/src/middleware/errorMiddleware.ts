import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Custom error class for API errors
export class ApiError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Middleware to handle 404 - Not Found errors
export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new ApiError(`Not Found - ${req.originalUrl}`, 404);
  next(error);
};

// Middleware to handle all other errors
export const errorHandler = (err: ApiError, req: Request, res: Response, next: NextFunction) => {
  // Log the error
  logger.error(`${err.name}: ${err.message}`);
  logger.debug(err.stack);

  // Set the status code
  const statusCode = err.statusCode || 500;

  // Send the error response
  res.status(statusCode).json({
    success: false,
    error: {
      message: err.message,
      stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    },
  });
}; 