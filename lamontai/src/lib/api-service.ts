import { 
  API_ENDPOINTS, 
  handleApiResponse, 
  fetchWithTimeout,
  formatErrorMessage
} from './api-config';
import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import logger from './logger';
import redisClient from './redis-client';
import { createCircuitBreaker } from './redis/circuit-breaker';
const cache = require('./redis/redis-cache');

// Common types
export type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
};

// Article interfaces
export interface Article {
  id: string;
  title: string;
  snippet: string;
  content: string;
  keywords: string[];
  status: 'draft' | 'published' | 'archived';
  wordCount: number;
  createdAt: string;
  updatedAt: string;
  seoScore: number;
  readabilityScore: number;
}

export interface GeneratedContent {
  title: string;
  content: string;
  keywords: string[];
  readabilityScore: number;
  wordCount: number;
  estimatedRank: string;
}

export interface KeywordResults {
  mainKeyword: string;
  relatedKeywords: Array<{
    keyword: string;
    volume: number;
    difficulty: number;
    cpc: number;
  }>;
  searchIntent: {
    informational: number;
    transactional: number;
    navigational: number;
    commercial: number;
  };
  competitorKeywords: Array<{
    competitor: string;
    keywords: string[];
  }>;
}

export interface ContentAnalysis {
  seoScore: number;
  readabilityScore: number;
  keywordDensity: {
    primary: number;
    secondary: number;
  };
  contentLength: {
    words: number;
    characters: number;
    paragraphs: number;
  };
  suggestions: string[];
  headingStructure: {
    h1: number;
    h2: number;
    h3: number;
    h4: number;
  };
  keywordUsage: {
    title: boolean;
    metaDescription: boolean;
    firstParagraph: boolean;
    headings: boolean;
    imageAlt: boolean;
  };
  competitors: Array<{
    url: string;
    title: string;
    strengths: string[];
    weaknesses: string[];
  }>;
  technicalIssues: string[];
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  image: string;
  role: string;
  plan: string;
  credits: number;
  articlesGenerated: number;
  keywordsResearched: number;
  dateJoined: string;
  lastLogin: string;
  preferences: {
    theme: string;
    emailNotifications: boolean;
    contentType: string;
  };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// OpenAI API circuit breaker
const openaiCircuitBreaker = createCircuitBreaker({
  name: 'openai',
  failureThreshold: 3,
  resetTimeout: 60000, // 1 minute
  fallbackFn: (endpoint: string, data: any) => {
    console.log('Using fallback for OpenAI API call');
    // Return a friendly error response
    return { 
      error: 'The AI service is currently unavailable. Please try again in a few minutes.' 
    };
  }
}) as { fire: <T>(fn: () => Promise<T>) => Promise<T> };

// Create an axios instance for API calls
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    // Add JWT token to request headers if available
    const token = typeof window !== 'undefined' 
      ? localStorage.getItem('jwt') 
      : null;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Helper function to make API requests with circuit breaker and caching
async function apiRequest(
  method: string,
  endpoint: string,
  data?: any,
  useCircuitBreaker = false,
  useCache = false,
  cacheTtl = 3600
) {
  const config: AxiosRequestConfig = {
    method,
    url: endpoint,
    ...(method === 'get' ? { params: data } : { data }),
  };

  // Check cache for GET requests
  if (method.toLowerCase() === 'get' && useCache) {
    const cacheKey = `api:${endpoint}:${JSON.stringify(data || {})}`;
    const cachedData = await cache.get(cacheKey);
    
    if (cachedData) {
      console.log(`Cache hit for ${cacheKey}`);
      return cachedData;
    }
  }

  try {
    // Use circuit breaker for external API calls that may fail
    const response = useCircuitBreaker
      ? await openaiCircuitBreaker.fire(async () => await api(config))
      : await api(config);

    // Cache successful GET responses
    if (method.toLowerCase() === 'get' && useCache && response.data) {
      const cacheKey = `api:${endpoint}:${JSON.stringify(data || {})}`;
      await cache.set(cacheKey, response.data, cacheTtl);
    }

    return response.data;
  } catch (error: any) {
    console.error(`API request error for ${endpoint}:`, error.message);
    
    // Format error response
    if (error.response) {
      // Server responded with a status code outside of 2xx
      throw { 
        status: error.response.status,
        message: error.response.data.message || 'An error occurred with the API request',
        data: error.response.data 
      };
    } else if (error.request) {
      // Request was made but no response received
      throw { 
        status: 503,
        message: 'No response from server. Please try again later.' 
      };
    } else {
      // Error setting up the request
      throw { 
        status: 500,
        message: error.message || 'An unexpected error occurred' 
      };
    }
  }
}

// API service methods
export const ApiService = {
  // Article generation
  generateArticle: (data: any) => 
    apiRequest('post', '/generate', data, true),
  
  // Keyword research  
  researchKeywords: (query: string) => 
    apiRequest('get', '/keywords', { query }, true, true, 24 * 3600), // Cache for 24 hours
  
  // Content analysis
  analyzeContent: (url: string) =>
    apiRequest('get', '/analyze', { url }, true, true, 12 * 3600), // Cache for 12 hours
  
  // Get user data
  getCurrentUser: () => 
    apiRequest('get', '/auth/me'),
  
  // Authentication
  login: (credentials: { email: string; password: string }) =>
    apiRequest('post', '/auth/login', credentials),
  
  register: (userData: any) =>
    apiRequest('post', '/auth/register', userData),
  
  // Content management
  getArticles: (params?: any) =>
    apiRequest('get', '/articles', params, false, true),
  
  getArticleById: (id: string) =>
    apiRequest('get', `/articles/${id}`, null, false, true),
  
  createArticle: (article: any) =>
    apiRequest('post', '/articles', article),
  
  updateArticle: (id: string, article: any) =>
    apiRequest('put', `/articles/${id}`, article),
  
  deleteArticle: (id: string) =>
    apiRequest('delete', `/articles/${id}`),
  
  // Clear cache for specific endpoints
  clearCache: async (prefix: string) => {
    return await cache.clearByPrefix(`api:${prefix}`);
  }
};

export default ApiService; 