import { Request, Response, NextFunction } from 'express';

// Custom error class for API errors
export class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(statusCode: number, message: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// Error middleware for Express
export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Default error status and message
  let statusCode = 500;
  let message = 'Internal Server Error';

  // If it's our ApiError, use its status code and message
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    // Handle Sequelize validation errors
    statusCode = 400;
    message = err.message;
  } else if (err.name === 'JsonWebTokenError') {
    // Handle JWT errors
    statusCode = 401;
    message = 'Invalid token';
  }

  // Log the error
  console.error(`[ERROR] ${req.method} ${req.path}: ${err.message}`);
  console.error(err.stack);

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};

// Not found middleware
export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const error = new ApiError(404, `Not Found - ${req.originalUrl}`);
  next(error);
};

// Async handler to catch errors in async route handlers
export const asyncHandler = (fn: Function) => (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  return Promise.resolve(fn(req, res, next)).catch(next);
}; 