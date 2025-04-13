/**
 * API client for communicating with the backend
 */

import axios, { AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';

// Get the API URL from environment variables or use a default
// const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'; // Remove this

// Create an axios instance with default configs
export const authFetch = axios.create({
  // baseURL: API_URL, // Remove explicit baseURL
  baseURL: '/api', // Use relative path for internal API routes
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies
  timeout: 10000, // 10 second timeout for requests
});

// Request interceptor to add auth token to requests
authFetch.interceptors.request.use(
  (config) => {
    // Cookies are now automatically sent with credentials: 'include'
    // No need to manually add the token
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// API service object with endpoints organized by feature
const api = {
  auth: {
    login: (email: string, password: string) => 
      authFetch.post('/auth/login', { email, password }),
    register: (userData: any) => 
      authFetch.post('/auth/register', userData),
    me: () => 
      authFetch.get('/auth/me'),
    forgotPassword: (email: string) => 
      authFetch.post('/auth/forgot-password', { email }),
    resetPassword: (token: string, password: string) => 
      authFetch.post('/auth/reset-password', { token, password }),
  },
  articles: {
    getAll: () => 
      authFetch.get('/articles'),
    getById: (id: string) => 
      authFetch.get(`/articles/${id}`),
    create: (articleData: any) => 
      authFetch.post('/articles', articleData),
    update: (id: string, articleData: any) => 
      authFetch.put(`/articles/${id}`, articleData),
    delete: (id: string) => 
      authFetch.delete(`/articles/${id}`),
  },
  user: {
    getProfile: () => 
      authFetch.get('/user/profile'),
    updateProfile: (profileData: any) => 
      authFetch.patch('/user/profile', profileData),
    updatePassword: (passwordData: any) => 
      authFetch.patch('/user/password', passwordData),
  },
};

export default api; 