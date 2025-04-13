import api from './api';

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  token?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  data: User;
}

/**
 * Register a new user
 */
export const register = async (userData: RegisterData): Promise<User> => {
  try {
    const response = await api.post<AuthResponse>('/auth/register', userData);
    
    // Store user data in localStorage
    if (response.data.success && response.data.data) {
      const { token, ...user } = response.data.data;
      
      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
      }
      
      return response.data.data;
    }
    
    throw new Error('Registration failed');
  } catch (error: any) {
    throw new Error(error.response?.data?.error?.message || 'Registration failed');
  }
};

/**
 * Login a user
 */
export const login = async (credentials: LoginCredentials): Promise<User> => {
  try {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    
    // Store user data in localStorage
    if (response.data.success && response.data.data) {
      const { token, ...user } = response.data.data;
      
      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
      }
      
      return response.data.data;
    }
    
    throw new Error('Login failed');
  } catch (error: any) {
    throw new Error(error.response?.data?.error?.message || 'Login failed');
  }
};

/**
 * Logout a user
 */
export const logout = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

/**
 * Get current user from localStorage
 */
export const getCurrentUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return !!localStorage.getItem('token');
};

/**
 * Update current user profile
 */
export const updateProfile = async (userData: Partial<User>): Promise<User> => {
  try {
    const response = await api.put<AuthResponse>('/auth/me', userData);
    
    if (response.data.success && response.data.data) {
      // Update stored user data
      const currentUser = getCurrentUser();
      if (currentUser) {
        const updatedUser = { ...currentUser, ...response.data.data };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      
      return response.data.data;
    }
    
    throw new Error('Profile update failed');
  } catch (error: any) {
    throw new Error(error.response?.data?.error?.message || 'Profile update failed');
  }
}; 