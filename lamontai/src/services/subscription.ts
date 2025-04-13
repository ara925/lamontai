import api from './api';

export interface Subscription {
  id: number;
  name: string;
  description: string;
  price: number;
  billingCycle: 'monthly' | 'yearly';
  features: string[];
  isActive: boolean;
  articleLimit: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserSubscription {
  id: number;
  userId: number;
  subscriptionId: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'canceled' | 'expired' | 'pending';
  paymentStatus: 'paid' | 'pending' | 'failed';
  paymentMethod: string;
  paymentId: string;
  autoRenew: boolean;
  articlesGenerated: number;
  nextBillingDate: string | null;
  createdAt: string;
  updatedAt: string;
  subscription?: Subscription;
}

export interface SubscriptionResponse {
  success: boolean;
  data: Subscription;
}

export interface SubscriptionsResponse {
  success: boolean;
  data: Subscription[];
}

export interface UserSubscriptionResponse {
  success: boolean;
  data: UserSubscription | null;
  message?: string;
}

/**
 * Get all available subscription plans
 */
export const getSubscriptions = async (): Promise<Subscription[]> => {
  try {
    const response = await api.get<SubscriptionsResponse>('/subscriptions');
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    return [];
  } catch (error: any) {
    throw new Error(error.response?.data?.error?.message || 'Failed to fetch subscriptions');
  }
};

/**
 * Get a single subscription plan by ID
 */
export const getSubscription = async (id: number): Promise<Subscription> => {
  try {
    const response = await api.get<SubscriptionResponse>(`/subscriptions/${id}`);
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error('Subscription not found');
  } catch (error: any) {
    throw new Error(error.response?.data?.error?.message || 'Failed to fetch subscription');
  }
};

/**
 * Get current user's active subscription
 */
export const getUserSubscription = async (): Promise<UserSubscription | null> => {
  try {
    const response = await api.get<UserSubscriptionResponse>('/subscriptions/me');
    
    if (response.data.success) {
      return response.data.data;
    }
    
    return null;
  } catch (error: any) {
    throw new Error(error.response?.data?.error?.message || 'Failed to fetch user subscription');
  }
};

/**
 * Subscribe to a plan
 */
export const subscribe = async (
  subscriptionId: number,
  paymentData: { paymentMethod: string; billingCycle: 'monthly' | 'yearly' }
): Promise<UserSubscription> => {
  try {
    const response = await api.post<UserSubscriptionResponse>(
      `/subscriptions/${subscriptionId}/subscribe`,
      paymentData
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error('Failed to subscribe to plan');
  } catch (error: any) {
    throw new Error(error.response?.data?.error?.message || 'Failed to subscribe to plan');
  }
};

/**
 * Cancel subscription
 */
export const cancelSubscription = async (): Promise<UserSubscription> => {
  try {
    const response = await api.put<UserSubscriptionResponse>('/subscriptions/cancel');
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error('Failed to cancel subscription');
  } catch (error: any) {
    throw new Error(error.response?.data?.error?.message || 'Failed to cancel subscription');
  }
}; 