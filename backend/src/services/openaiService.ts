import OpenAI from 'openai';
import { logger } from '../utils/logger';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate an article based on the given topic and keywords
 */
export const generateArticle = async (
  topic: string,
  keywords: string[],
  options?: {
    tone?: string;
    length?: 'short' | 'medium' | 'long';
    style?: string;
  }
) => {
  try {
    // Default options
    const tone = options?.tone || 'professional';
    const length = options?.length || 'medium';
    const style = options?.style || 'informative';

    // Map length to approximate word count
    const wordCounts = {
      short: '800-1000',
      medium: '1500-2000',
      long: '2500-3000',
    };

    // Create prompt for article generation
    const prompt = `Write a ${tone}, ${style} article about "${topic}" that is optimized for SEO. 
    The article should be approximately ${wordCounts[length]} words. 
    Include the following keywords naturally in the article: ${keywords.join(', ')}.
    Format the article with proper headings (H2, H3) and include an introduction and conclusion.
    The structure should be web-friendly with short paragraphs and engaging content.
    
    Format the output as clean HTML.`;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert SEO content writer who creates high-quality, engaging, and SEO-optimized articles.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 3500,
    });

    // Get generated content
    const content = completion.choices[0].message.content || '';

    // Create a title based on the content
    const titleCompletion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert at creating SEO-optimized titles for articles.',
        },
        {
          role: 'user',
          content: `Create a compelling, SEO-optimized title for an article about "${topic}" that includes one of these keywords if possible: ${keywords.join(', ')}. The title should be no more than 60 characters. Return only the title, nothing else.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 60,
    });

    // Get generated title
    const title = titleCompletion.choices[0].message.content || topic;

    // Create a snippet/meta description
    const snippetCompletion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert at creating compelling meta descriptions for SEO.',
        },
        {
          role: 'user',
          content: `Create a compelling meta description for an article with the title "${title}". The description should be under 160 characters and include one of these keywords if possible: ${keywords.join(', ')}. Return only the description, nothing else.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    // Get generated snippet
    const snippet = snippetCompletion.choices[0].message.content || '';

    // Calculate approximate word count
    const wordCount = content.split(/\s+/).length;

    // Generate a readability score (mock implementation)
    const readabilityScore = Math.floor(Math.random() * 20) + 80; // 80-100

    // Return the generated article
    return {
      title: title.replace(/"/g, '').trim(),
      content,
      snippet: snippet.replace(/"/g, '').trim(),
      keywords,
      wordCount,
      readabilityScore,
      estimatedRank: 'Top 20 potential',
    };
  } catch (error) {
    logger.error(`Error generating article: ${error}`);
    throw new Error('Failed to generate article');
  }
};

/**
 * Research keywords related to a main keyword
 */
export const researchKeywords = async (
  query: string,
  options?: {
    limit?: number;
    country?: string;
    language?: string;
  }
) => {
  try {
    // Default options
    const limit = options?.limit || 10;
    const country = options?.country || 'us';
    const language = options?.language || 'en';

    // Create prompt for keyword research
    const prompt = `Generate a list of ${limit} SEO keyword ideas related to "${query}" for the country ${country} and language ${language}. 
    For each keyword, provide an estimated monthly search volume, keyword difficulty score (0-100), cost per click (CPC) in USD, and whether it's primarily informational, transactional, or navigational.
    Format your response as JSON only.`;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert SEO keyword researcher with access to the latest search volume data. Your responses are always in valid JSON format.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.5,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    // Get response and parse JSON
    const content = completion.choices[0].message.content || '{}';
    const keywordData = JSON.parse(content);

    // Normalize and format the response
    return {
      mainKeyword: query,
      relatedKeywords: keywordData.keywords || [],
      searchIntent: keywordData.searchIntent || {
        informational: 60,
        transactional: 20,
        navigational: 10,
        commercial: 10,
      },
      competitorKeywords: keywordData.competitorKeywords || [],
    };
  } catch (error) {
    logger.error(`Error researching keywords: ${error}`);
    throw new Error('Failed to research keywords');
  }
};

/**
 * Analyze content for SEO optimization
 */
export const analyzeContent = async (
  content: string,
  keywords: string[],
  url?: string
) => {
  try {
    // Create prompt for content analysis
    const prompt = `Analyze the following content for SEO optimization:
    
    CONTENT: ${content.substring(0, 7000)}... (trimmed for brevity)
    
    TARGET KEYWORDS: ${keywords.join(', ')}
    
    ${url ? `URL: ${url}` : ''}
    
    Provide a detailed analysis including:
    1. Overall SEO score (0-100)
    2. Readability score (0-100)
    3. Keyword density for primary and secondary keywords
    4. Content length statistics (words, characters, paragraphs)
    5. Specific improvement suggestions
    6. Heading structure analysis
    7. Keyword usage in important elements
    8. Competitor comparison
    9. Technical issues
    
    Format your response as JSON only.`;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert SEO content analyzer. Your responses are always in valid JSON format.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    // Get response and parse JSON
    const responseContent = completion.choices[0].message.content || '{}';
    const analysisData = JSON.parse(responseContent);

    // Return the analysis
    return {
      seoScore: analysisData.seoScore || 0,
      readabilityScore: analysisData.readabilityScore || 0,
      keywordDensity: analysisData.keywordDensity || { primary: 0, secondary: 0 },
      contentLength: analysisData.contentLength || { words: 0, characters: 0, paragraphs: 0 },
      suggestions: analysisData.suggestions || [],
      headingStructure: analysisData.headingStructure || { h1: 0, h2: 0, h3: 0, h4: 0 },
      keywordUsage: analysisData.keywordUsage || {
        title: false,
        metaDescription: false,
        firstParagraph: false,
        headings: false,
        imageAlt: false,
      },
      competitors: analysisData.competitors || [],
      technicalIssues: analysisData.technicalIssues || [],
    };
  } catch (error) {
    logger.error(`Error analyzing content: ${error}`);
    throw new Error('Failed to analyze content');
  }
}; 