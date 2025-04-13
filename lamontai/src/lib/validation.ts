import { z } from 'zod';

/**
 * Validation schemas for API request data
 */

// User profile update schema
export const userProfileUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  preferences: z.object({
    theme: z.enum(['light', 'dark', 'system']).optional(),
    emailNotifications: z.boolean().optional(),
    contentType: z.enum(['blog', 'social', 'email', 'product']).optional(),
  }).optional(),
});

// Article creation schema
export const articleCreateSchema = z.object({
  title: z.string().min(5).max(200),
  content: z.string().min(50),
  snippet: z.string().max(300).optional(),
  keywords: z.array(z.string()).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  seoScore: z.number().min(0).max(100).optional(),
  readabilityScore: z.number().min(0).max(100).optional(),
});

// Article update schema
export const articleUpdateSchema = z.object({
  title: z.string().min(5).max(200).optional(),
  content: z.string().min(50).optional(),
  snippet: z.string().max(300).optional(),
  keywords: z.array(z.string()).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  seoScore: z.number().min(0).max(100).optional(),
  readabilityScore: z.number().min(0).max(100).optional(),
});

// Generate content schema
export const generateContentSchema = z.object({
  topic: z.string().min(3).max(200),
  keywords: z.array(z.string()).min(1).max(10),
  options: z.object({
    tone: z.string().optional(),
    length: z.enum(['short', 'medium', 'long']).optional(),
    style: z.string().optional(),
  }).optional(),
});

// Keyword research schema
export const keywordResearchSchema = z.object({
  query: z.string().min(2).max(100),
  options: z.object({
    limit: z.number().min(5).max(100).optional(),
    country: z.string().length(2).optional(),
    language: z.string().length(2).optional(),
  }).optional(),
});

// Content analysis schema
export const contentAnalysisSchema = z.object({
  content: z.string().min(50).optional(),
  url: z.string().url().optional(),
  keywords: z.array(z.string()).min(1).max(10),
}).refine(data => data.content || data.url, {
  message: "Either content or URL must be provided",
  path: ["content"],
});

/**
 * Utility function to validate request data against a schema
 */
export function validateRequest<T>(
  schema: z.ZodType<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  try {
    const validData = schema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error };
    }
    throw error;
  }
}

/**
 * Format Zod validation errors into a user-friendly object
 */
export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const formattedErrors: Record<string, string> = {};
  
  error.errors.forEach((err) => {
    const path = err.path.join('.');
    formattedErrors[path] = err.message;
  });
  
  return formattedErrors;
} 