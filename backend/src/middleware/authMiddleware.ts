import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiError } from './errorMiddleware';
import User from '../models/userModel';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// Middleware to protect routes
export const protect = async (req: Request, res: Response, next: NextFunction) => {
  let token;

  // Check if token exists in headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string);

      // Get user from the token
      req.user = await User.findById((decoded as any).id).select('-password');

      next();
    } catch (error) {
      next(new ApiError('Not authorized, token failed', 401));
    }
  }

  if (!token) {
    next(new ApiError('Not authorized, no token', 401));
  }
};

// Middleware to authorize admin roles
export const admin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    next(new ApiError('Not authorized as an admin', 403));
  }
};

// Middleware to authorize editors
export const editor = (req: Request, res: Response, next: NextFunction) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'editor')) {
    next();
  } else {
    next(new ApiError('Not authorized as an editor', 403));
  }
}; 