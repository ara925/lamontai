import jwt, { SignOptions, Secret, JwtPayload } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { ApiError } from './errorHandler';
import User from '../models/User';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// Token payload interface
interface TokenPayload extends JwtPayload {
  id: string;
  email: string;
  role: string;
}

/**
 * Generate a JWT token for a user
 */
export const generateToken = (user: TokenPayload): string => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET);
};

/**
 * Middleware to authenticate and authorize users
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get token from authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      throw new ApiError(401, 'Authentication required');
    }

    const jwtSecret = process.env.JWT_SECRET;
    
    if (!jwtSecret) {
      console.error('JWT_SECRET environment variable is not set');
      throw new ApiError(500, 'Server configuration error');
    }
    
    // Verify token
    try {
      const decoded = jwt.verify(token, jwtSecret as jwt.Secret) as TokenPayload;
      
      // Find user by id
      const user = await User.findByPk(decoded.id);

      if (!user) {
        throw new ApiError(401, 'User not found');
      }

      if (!user.isActive) {
        throw new ApiError(403, 'User account is inactive');
      }

      // Set user in request object
      req.user = user;
      next();
    } catch (jwtError: unknown) {
      console.error('JWT verification error:', jwtError instanceof Error ? jwtError.message : jwtError);
      throw new ApiError(401, 'Invalid token');
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if user has admin role
 */
export const isAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    next(new ApiError(403, 'Admin access required'));
  }
};

/**
 * Middleware to check if user owns the resource or is an admin
 */
export const isOwnerOrAdmin = (idParam: string) => (req: Request, res: Response, next: NextFunction): void => {
  const resourceId = req.params[idParam];
  
  if (
    req.user &&
    (req.user.role === 'admin' || req.user.id === resourceId)
  ) {
    next();
  } else {
    next(new ApiError(403, 'Unauthorized access to this resource'));
  }
}; 