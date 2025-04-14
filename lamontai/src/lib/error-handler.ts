import { NextRequest, NextResponse } from 'next/server';

/**
 * Custom API error class with status code and additional data
 */
export class ApiError extends Error {
  statusCode: number;
  data?: any;
  
  constructor(message: string, statusCode = 500, data?: any) {
    super(message);
    this.statusCode = statusCode;
    this.data = data;
    this.name = this.constructor.name;
  }
}

/**
 * Standard error response format
 */
export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    status: number;
    code?: string;
    details?: any;
  };
  timestamp: string;
}

/**
 * Format an error into a standardized response object
 */
export function formatError(
  error: Error | ApiError | unknown,
  defaultMessage = 'An unexpected error occurred',
  defaultStatus = 500
): ErrorResponse {
  const timestamp = new Date().toISOString();
  
  // Handle ApiError instances
  if (error instanceof ApiError) {
    return {
      success: false,
      error: {
        message: error.message,
        status: error.statusCode,
        details: error.data
      },
      timestamp
    };
  }
  
  // Handle standard Error instances
  if (error instanceof Error) {
    return {
      success: false,
      error: {
        message: error.message || defaultMessage,
        status: defaultStatus,
        code: error.name
      },
      timestamp
    };
  }
  
  // Handle unknown error types (string, null, etc.)
  return {
    success: false,
    error: {
      message: defaultMessage,
      status: defaultStatus,
      details: error ? String(error) : undefined
    },
    timestamp
  };
}

/**
 * Handle errors in API routes with standardized response
 * @param error The error to handle
 * @param req The Next.js request object (optional)
 */
export function handleApiError(
  error: Error | ApiError | unknown, 
  req?: NextRequest
): NextResponse {
  // Log the error
  console.error(`API Error:`, error);
  
  if (req) {
    console.error(`Request path: ${req.nextUrl.pathname}`);
    console.error(`Request method: ${req.method}`);
  }
  
  // Format the error response
  const errorResponse = formatError(error);
  
  // Determine status code
  const status = error instanceof ApiError 
    ? error.statusCode 
    : errorResponse.error.status;
  
  // Return the formatted error response
  return NextResponse.json(errorResponse, { status });
}

/**
 * Error codes for common error types
 */
export const ErrorCodes = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR'
};

/**
 * Create common error responses
 */
export const Errors = {
  unauthorized: (message = 'Authentication required') => 
    new ApiError(message, 401, { code: ErrorCodes.UNAUTHORIZED }),
    
  forbidden: (message = 'You do not have permission to access this resource') => 
    new ApiError(message, 403, { code: ErrorCodes.FORBIDDEN }),
    
  notFound: (resource = 'Resource') => 
    new ApiError(`${resource} not found`, 404, { code: ErrorCodes.NOT_FOUND }),
    
  validation: (message = 'Validation failed', details?: any) => 
    new ApiError(message, 400, { code: ErrorCodes.VALIDATION_ERROR, details }),
    
  rateLimit: (message = 'Rate limit exceeded') => 
    new ApiError(message, 429, { code: ErrorCodes.RATE_LIMIT_EXCEEDED }),
    
  database: (message = 'Database operation failed', details?: any) => 
    new ApiError(message, 500, { code: ErrorCodes.DATABASE_ERROR, details }),
    
  externalApi: (message = 'External API request failed', details?: any) => 
    new ApiError(message, 502, { code: ErrorCodes.EXTERNAL_API_ERROR, details }),
    
  internal: (message = 'Internal server error') => 
    new ApiError(message, 500, { code: ErrorCodes.INTERNAL_SERVER_ERROR })
}; 