/**
 * API Configuration and Utilities
 * 
 * This file contains configuration, constants, and utility functions 
 * for interacting with the Lamont.ai API.
 */

export const API_VERSION = 'v1';
export const API_RATE_LIMIT = 100; // requests per minute
export const DEFAULT_TIMEOUT = 30000; // 30 seconds

// API Endpoints
export const API_ENDPOINTS = {
  GENERATE: '/api/generate',
  KEYWORDS: '/api/keywords',
  ANALYZE: '/api/analyze',
  USER_PROFILE: '/api/user/profile',
  ARTICLES: '/api/articles',
  TEMPLATES: '/api/templates',
  METRICS: '/api/metrics',
  BILLING: '/api/billing',
};

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
};

// Content Types
export const CONTENT_TYPES = {
  BLOG_POST: 'blog_post',
  LANDING_PAGE: 'landing_page',
  PRODUCT_DESCRIPTION: 'product_description',
  EMAIL: 'email',
  SOCIAL_MEDIA: 'social_media',
  META_DESCRIPTION: 'meta_description',
};

// User Plans
export const USER_PLANS = {
  FREE: 'free',
  STARTER: 'starter',
  PROFESSIONAL: 'professional',
  ENTERPRISE: 'enterprise',
};

// Plan Limits
export const PLAN_LIMITS = {
  [USER_PLANS.FREE]: {
    articlesPerMonth: 5,
    keywordResearches: 10,
    wordLimit: 1000,
    supportLevel: 'email',
  },
  [USER_PLANS.STARTER]: {
    articlesPerMonth: 25,
    keywordResearches: 50,
    wordLimit: 2000,
    supportLevel: 'email',
  },
  [USER_PLANS.PROFESSIONAL]: {
    articlesPerMonth: 100,
    keywordResearches: 200,
    wordLimit: 5000,
    supportLevel: 'priority',
  },
  [USER_PLANS.ENTERPRISE]: {
    articlesPerMonth: Infinity,
    keywordResearches: Infinity,
    wordLimit: 10000,
    supportLevel: 'dedicated',
  },
};

// Utility function to fetch with timeout
export const fetchWithTimeout = async (
  url: string, 
  options: RequestInit = {}, 
  timeout: number = DEFAULT_TIMEOUT
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
};

// Standard API response handler
export const handleApiResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: 'Unknown error occurred',
    }));
    
    throw new Error(errorData.message || `API Error: ${response.status}`);
  }
  
  return response.json();
};

// Formats an error message for display
export const formatErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

// Helper to check if user can perform an action based on their plan
export const canUserPerformAction = (
  userPlan: string,
  action: 'generateArticle' | 'keywordResearch' | 'analyzeContent',
  usageStats: { articlesGenerated: number, keywordsResearched: number }
): boolean => {
  const plan = PLAN_LIMITS[userPlan as keyof typeof PLAN_LIMITS];
  if (!plan) return false;
  
  switch (action) {
    case 'generateArticle':
      return usageStats.articlesGenerated < plan.articlesPerMonth;
    case 'keywordResearch':
      return usageStats.keywordsResearched < plan.keywordResearches;
    case 'analyzeContent':
      return true; // Available on all plans
    default:
      return false;
  }
}; 