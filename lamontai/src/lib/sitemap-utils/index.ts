import { parseStringPromise } from 'xml2js';
import axios from 'axios';
import redisClient from '../redis-client';
import { ApiError } from '../error-handler';

/**
 * URL data extracted from a sitemap
 */
export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

/**
 * Sitemap data with URLs and metadata
 */
export interface SitemapData {
  urls: SitemapUrl[];
  isIndex: boolean;
  childSitemaps?: string[];
}

/**
 * Content analysis results for a URL
 */
export interface ContentAnalysis {
  url: string;
  title?: string;
  keywords: string[];
  headings: string[];
  wordCount?: number;
  readabilityScore?: number;
}

/**
 * Fetch and parse a sitemap XML file
 * @param sitemapUrl - URL of the sitemap
 * @param recursive - Whether to fetch child sitemaps (true by default)
 * @returns Parsed sitemap data
 */
export async function fetchAndParseSitemap(sitemapUrl: string, recursive = true): Promise<SitemapData> {
  try {
    console.log(`Fetching sitemap from: ${sitemapUrl}`);
    const response = await axios.get(sitemapUrl, {
      headers: {
        'Accept': 'application/xml, text/xml, */*',
        'User-Agent': 'LamontAI-Sitemap-Parser/1.0 (+https://lamontai.ai)'
      },
      timeout: 10000 // 10 second timeout
    });

    return parseSitemapXml(response.data, sitemapUrl, recursive);
  } catch (error) {
    console.error(`Error fetching sitemap ${sitemapUrl}:`, error);
    throw new ApiError(
      `Failed to fetch sitemap: ${error instanceof Error ? error.message : 'Unknown error'}`,
      502,
      { url: sitemapUrl }
    );
  }
}

/**
 * Parse sitemap XML content
 * @param xmlContent - XML content to parse
 * @param baseUrl - Base URL of the sitemap (for resolving relative URLs)
 * @param recursive - Whether to fetch child sitemaps
 * @returns Parsed sitemap data
 */
export async function parseSitemapXml(xmlContent: string, baseUrl: string, recursive = true): Promise<SitemapData> {
  try {
    const result = await parseStringPromise(xmlContent, { 
      explicitArray: false,
      normalizeTags: true,
      mergeAttrs: true
    });
    
    // Check if this is a sitemap index
    if (result.sitemapindex) {
      const sitemapIndex = result.sitemapindex;
      const childSitemaps: string[] = [];
      
      // Extract child sitemap URLs
      if (Array.isArray(sitemapIndex.sitemap)) {
        sitemapIndex.sitemap.forEach((sitemap: any) => {
          if (sitemap.loc) {
            childSitemaps.push(sitemap.loc);
          }
        });
      } else if (sitemapIndex.sitemap && sitemapIndex.sitemap.loc) {
        childSitemaps.push(sitemapIndex.sitemap.loc);
      }
      
      // If recursive, fetch all child sitemaps
      if (recursive && childSitemaps.length > 0) {
        const allUrls: SitemapUrl[] = [];
        
        // Fetch child sitemaps (limit to 5 concurrent requests)
        const chunkSize = 5;
        for (let i = 0; i < childSitemaps.length; i += chunkSize) {
          const chunk = childSitemaps.slice(i, i + chunkSize);
          const childResults = await Promise.all(
            chunk.map(childUrl => fetchAndParseSitemap(childUrl, false))
          );
          
          childResults.forEach(child => {
            allUrls.push(...child.urls);
          });
        }
        
        return {
          urls: allUrls,
          isIndex: true,
          childSitemaps
        };
      }
      
      return {
        urls: [],
        isIndex: true,
        childSitemaps
      };
    }
    
    // Regular sitemap
    const urls: SitemapUrl[] = [];
    
    if (result.urlset && result.urlset.url) {
      if (Array.isArray(result.urlset.url)) {
        result.urlset.url.forEach((url: any) => {
          if (url.loc) {
            urls.push({
              loc: url.loc,
              lastmod: url.lastmod,
              changefreq: url.changefreq,
              priority: url.priority
            });
          }
        });
      } else if (result.urlset.url.loc) {
        urls.push({
          loc: result.urlset.url.loc,
          lastmod: result.urlset.url.lastmod,
          changefreq: result.urlset.url.changefreq,
          priority: result.urlset.url.priority
        });
      }
    }
    
    return {
      urls,
      isIndex: false
    };
  } catch (error) {
    console.error('Error parsing sitemap XML:', error);
    throw new ApiError(
      `Failed to parse sitemap XML: ${error instanceof Error ? error.message : 'Unknown error'}`,
      500
    );
  }
}

/**
 * Extract content from a URL for analysis
 * @param url - URL to analyze
 * @returns Content analysis results
 */
export async function analyzeUrlContent(url: string): Promise<ContentAnalysis> {
  // Use Redis cache key for URL content analysis
  const cacheKey = `url_analysis:${url}`;
  
  try {
    // Check cache first to avoid repeated analysis of the same URL
    const cachedAnalysis = await redisClient.get<ContentAnalysis>(cacheKey);
    if (cachedAnalysis) {
      return cachedAnalysis;
    }
    
    console.log(`Analyzing content from URL: ${url}`);
    const response = await axios.get(url, {
      headers: {
        'Accept': 'text/html,application/xhtml+xml',
        'User-Agent': 'LamontAI-Content-Analyzer/1.0 (+https://lamontai.ai)'
      },
      timeout: 15000 // 15 second timeout
    });
    
    // This is a simplified analysis - in a real implementation, you would:
    // 1. Parse the HTML properly (using cheerio or similar)
    // 2. Extract title, headings, meta tags, etc.
    // 3. Do proper keyword extraction and readability analysis
    
    const content = response.data;
    
    // Extract title (simple regex approach)
    const titleMatch = /<title>(.*?)<\/title>/i.exec(content);
    const title = titleMatch ? titleMatch[1] : undefined;
    
    // Extract headings (simple regex approach)
    const headingMatches = content.match(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi) || [];
    const headings = headingMatches.map((h: string) => {
      return h.replace(/<\/?[^>]+(>|$)/g, '').trim();
    });
    
    // Simple keyword extraction (just common words, not a real implementation)
    const bodyText = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const words = bodyText.toLowerCase().split(/\W+/).filter((w: string) => w.length > 3);
    const wordCounts: Record<string, number> = {};
    
    words.forEach((word: string) => {
      if (wordCounts[word]) {
        wordCounts[word]++;
      } else {
        wordCounts[word] = 1;
      }
    });
    
    const keywords = Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
    
    const analysis = {
      url,
      title,
      keywords,
      headings,
      wordCount: words.length,
      // Placeholder for readability score
      readabilityScore: 0
    };
    
    // Cache the analysis result (24 hour TTL)
    await redisClient.set(cacheKey, analysis, 24 * 60 * 60);
    
    return analysis;
  } catch (error) {
    console.error(`Error analyzing URL ${url}:`, error);
    return {
      url,
      keywords: [],
      headings: []
    };
  }
}

/**
 * Find relevant internal links for a given topic
 * @param sitemapData - Parsed sitemap data
 * @param topic - Topic to find relevant links for
 * @param maxResults - Maximum number of results to return
 * @returns Array of relevant URLs
 */
export async function findRelevantInternalLinks(
  sitemapData: SitemapData, 
  topic: string, 
  maxResults = 5
): Promise<string[]> {
  // Cache key for this specific query
  const cacheKey = `relevant_links:${topic}:${maxResults}:${sitemapData.urls.length}`;
  
  // Check cache first
  const cachedLinks = await redisClient.get<string[]>(cacheKey);
  if (cachedLinks) {
    return cachedLinks;
  }
  
  // Convert topic to lowercase for case-insensitive matching
  const lowerTopic = topic.toLowerCase();
  
  // Filter URLs by relevance to topic (very simple approach)
  const relevantUrls = sitemapData.urls.filter(url => {
    const urlPath = new URL(url.loc).pathname.toLowerCase();
    
    // Check if URL path contains the topic
    return urlPath.includes(lowerTopic) || 
           // Or a hyphenated version of the topic
           urlPath.includes(lowerTopic.replace(/\s+/g, '-')) ||
           // Or an underscore version of the topic
           urlPath.includes(lowerTopic.replace(/\s+/g, '_'));
  });
  
  // Sort by priority (if available) and return top results
  const sortedUrls = relevantUrls.sort((a, b) => {
    // Sort by priority if available
    if (a.priority && b.priority) {
      return parseFloat(b.priority) - parseFloat(a.priority);
    }
    
    // Default to URL path length (shorter = more relevant)
    const aPath = new URL(a.loc).pathname;
    const bPath = new URL(b.loc).pathname;
    return aPath.length - bPath.length;
  });
  
  const result = sortedUrls.slice(0, maxResults).map(url => url.loc);
  
  // Cache the results (1 hour TTL)
  await redisClient.set(cacheKey, result, 60 * 60);
  
  return result;
}

/**
 * Get sitemap data from cache or fetch if not cached
 * @param sitemapUrl - URL of the sitemap
 * @returns Cached or freshly fetched sitemap data
 */
export async function getCachedSitemapData(sitemapUrl: string): Promise<SitemapData> {
  // Redis cache key
  const cacheKey = `sitemap:${sitemapUrl}`;
  
  // Use the getOrSet pattern - gets from cache or fetches and caches
  return redisClient.getOrSet<SitemapData>(
    cacheKey,
    async () => fetchAndParseSitemap(sitemapUrl),
    12 * 60 * 60 // 12-hour TTL
  );
}

/**
 * Initialize sitemap data for a user
 * @param userId - User ID
 * @param sitemapUrl - URL of the sitemap
 * @returns If initialization was successful
 */
export async function initializeUserSitemap(userId: string, sitemapUrl: string): Promise<boolean> {
  try {
    // Fetch and parse the sitemap
    const sitemapData = await fetchAndParseSitemap(sitemapUrl);
    
    // Log basic info about the sitemap
    console.log(`Initialized sitemap for user ${userId} with ${sitemapData.urls.length} URLs`);
    
    // Cache the user's sitemap association
    await redisClient.set(`user_sitemap:${userId}`, { url: sitemapUrl, urlCount: sitemapData.urls.length });
    
    // In a real implementation, you might store parsed data in a database
    // e.g., db.sitemapData.create({ userId, urlCount: sitemapData.urls.length, ... })
    
    return true;
  } catch (error) {
    console.error(`Error initializing sitemap for user ${userId}:`, error);
    return false;
  }
} 