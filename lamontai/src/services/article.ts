import api from './api';

export interface Article {
  id: number;
  title: string;
  content: string;
  slug: string;
  summary: string;
  keywords: string[];
  metaTitle: string;
  metaDescription: string;
  status: 'draft' | 'published' | 'archived';
  publishedAt: string | null;
  authorId: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'draft' | 'published' | 'archived';
}

export interface ArticleResponse {
  success: boolean;
  data: Article;
}

export interface ArticlesResponse {
  success: boolean;
  data: Article[];
  count: number;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
}

/**
 * Get all articles with pagination
 */
export const getArticles = async (params: PaginationParams = {}): Promise<ArticlesResponse> => {
  try {
    const { page = 1, limit = 10, search, status } = params;
    
    // Build query params
    const query: Record<string, string | number> = { page, limit };
    if (search) query.search = search;
    if (status) query.status = status;
    
    const response = await api.get<ArticlesResponse>('/articles', { params: query });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error?.message || 'Failed to fetch articles');
  }
};

/**
 * Get a single article by ID
 */
export const getArticle = async (id: number): Promise<Article> => {
  try {
    const response = await api.get<ArticleResponse>(`/articles/${id}`);
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error('Article not found');
  } catch (error: any) {
    throw new Error(error.response?.data?.error?.message || 'Failed to fetch article');
  }
};

/**
 * Create a new article
 */
export const createArticle = async (articleData: Partial<Article>): Promise<Article> => {
  try {
    const response = await api.post<ArticleResponse>('/articles', articleData);
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error('Failed to create article');
  } catch (error: any) {
    throw new Error(error.response?.data?.error?.message || 'Failed to create article');
  }
};

/**
 * Update an existing article
 */
export const updateArticle = async (id: number, articleData: Partial<Article>): Promise<Article> => {
  try {
    const response = await api.put<ArticleResponse>(`/articles/${id}`, articleData);
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error('Failed to update article');
  } catch (error: any) {
    throw new Error(error.response?.data?.error?.message || 'Failed to update article');
  }
};

/**
 * Delete an article
 */
export const deleteArticle = async (id: number): Promise<void> => {
  try {
    const response = await api.delete<{ success: boolean }>(`/articles/${id}`);
    
    if (!response.data.success) {
      throw new Error('Failed to delete article');
    }
  } catch (error: any) {
    throw new Error(error.response?.data?.error?.message || 'Failed to delete article');
  }
}; 