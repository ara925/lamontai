import { 
  API_ENDPOINTS, 
  handleApiResponse, 
  fetchWithTimeout,
  formatErrorMessage
} from './api-config';

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

/**
 * Content Generation API
 */
export const ContentAPI = {
  // Generate an article based on keywords and parameters
  generateArticle: async (
    topic: string,
    keywords: string[],
    options?: {
      tone?: string;
      length?: 'short' | 'medium' | 'long';
      style?: string;
    }
  ): Promise<GeneratedContent> => {
    try {
      const response = await fetchWithTimeout(API_ENDPOINTS.GENERATE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          keywords,
          options: options || {}
        }),
      });

      const result = await handleApiResponse<ApiResponse<GeneratedContent>>(response);
      return result.data!;
    } catch (error) {
      console.error('Error generating article:', error);
      throw new Error(formatErrorMessage(error));
    }
  },

  // Analyze content for SEO optimization
  analyzeContent: async (
    content: string,
    keywords: string[]
  ): Promise<ContentAnalysis> => {
    try {
      const response = await fetchWithTimeout(API_ENDPOINTS.ANALYZE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          keywords
        }),
      });

      const result = await handleApiResponse<ApiResponse<ContentAnalysis>>(response);
      return result.data!;
    } catch (error) {
      console.error('Error analyzing content:', error);
      throw new Error(formatErrorMessage(error));
    }
  },

  // Analyze a URL for SEO optimization
  analyzeUrl: async (
    url: string,
    keywords: string[]
  ): Promise<ContentAnalysis> => {
    try {
      const response = await fetchWithTimeout(API_ENDPOINTS.ANALYZE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          keywords
        }),
      });

      const result = await handleApiResponse<ApiResponse<ContentAnalysis>>(response);
      return result.data!;
    } catch (error) {
      console.error('Error analyzing URL:', error);
      throw new Error(formatErrorMessage(error));
    }
  },
};

/**
 * Keyword Research API
 */
export const KeywordAPI = {
  // Research keywords related to a main keyword
  researchKeywords: async (
    query: string,
    options?: {
      limit?: number;
      country?: string;
      language?: string;
    }
  ): Promise<KeywordResults> => {
    try {
      const response = await fetchWithTimeout(API_ENDPOINTS.KEYWORDS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          options: options || {}
        }),
      });

      const result = await handleApiResponse<ApiResponse<KeywordResults>>(response);
      return result.data!;
    } catch (error) {
      console.error('Error researching keywords:', error);
      throw new Error(formatErrorMessage(error));
    }
  },
};

/**
 * Articles API
 */
export const ArticleAPI = {
  // Get all articles for the current user
  getArticles: async (
    filters?: { status?: 'draft' | 'published' | 'archived' }
  ): Promise<Article[]> => {
    try {
      let url = API_ENDPOINTS.ARTICLES;
      
      if (filters?.status) {
        url += `?status=${filters.status}`;
      }
      
      const response = await fetchWithTimeout(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await handleApiResponse<ApiResponse<Article[]>>(response);
      return result.data || [];
    } catch (error) {
      console.error('Error fetching articles:', error);
      throw new Error(formatErrorMessage(error));
    }
  },

  // Get a specific article by ID
  getArticle: async (id: string): Promise<Article> => {
    try {
      const response = await fetchWithTimeout(`${API_ENDPOINTS.ARTICLES}/${id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await handleApiResponse<ApiResponse<Article>>(response);
      return result.data!;
    } catch (error) {
      console.error(`Error fetching article ${id}:`, error);
      throw new Error(formatErrorMessage(error));
    }
  },

  // Create a new article
  createArticle: async (articleData: Partial<Article>): Promise<Article> => {
    try {
      const response = await fetchWithTimeout(API_ENDPOINTS.ARTICLES, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(articleData),
      });

      const result = await handleApiResponse<ApiResponse<Article>>(response);
      return result.data!;
    } catch (error) {
      console.error('Error creating article:', error);
      throw new Error(formatErrorMessage(error));
    }
  },

  // Update an existing article
  updateArticle: async (id: string, updates: Partial<Article>): Promise<Article> => {
    try {
      const response = await fetchWithTimeout(`${API_ENDPOINTS.ARTICLES}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const result = await handleApiResponse<ApiResponse<Article>>(response);
      return result.data!;
    } catch (error) {
      console.error(`Error updating article ${id}:`, error);
      throw new Error(formatErrorMessage(error));
    }
  },

  // Delete an article
  deleteArticle: async (id: string): Promise<void> => {
    try {
      const response = await fetchWithTimeout(`${API_ENDPOINTS.ARTICLES}/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      await handleApiResponse(response);
    } catch (error) {
      console.error(`Error deleting article ${id}:`, error);
      throw new Error(formatErrorMessage(error));
    }
  },
};

/**
 * User API
 */
export const UserAPI = {
  // Get user profile
  getProfile: async (): Promise<UserProfile> => {
    try {
      const response = await fetchWithTimeout(API_ENDPOINTS.USER_PROFILE, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await handleApiResponse<ApiResponse<UserProfile>>(response);
      return result.data!;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw new Error(formatErrorMessage(error));
    }
  },

  // Update user profile
  updateProfile: async (updates: Partial<UserProfile>): Promise<UserProfile> => {
    try {
      const response = await fetchWithTimeout(API_ENDPOINTS.USER_PROFILE, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const result = await handleApiResponse<ApiResponse<UserProfile>>(response);
      return result.data!;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw new Error(formatErrorMessage(error));
    }
  },
}; 