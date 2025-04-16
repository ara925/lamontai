import { parse, simplifyLostLess, XmlElement } from 'txml';
import { getRedisClient } from '../redis-client';
import { ApiError } from '../error-handler';

// Cache handler implementation that works in both regular and edge environments
async function getCacheValue<T>(key: string): Promise<T | null> {
  try {
    const redisClient = await getRedisClient();
    return await redisClient.get<T>(key);
  } catch (error) {
    console.error('Failed to get cache value:', error);
    return null;
  }
}

async function setCacheValue<T>(key: string, value: T, ttl = 24 * 60 * 60): Promise<void> {
  try {
    const redisClient = await getRedisClient();
    await redisClient.set(key, value, ttl);
  } catch (error) {
    console.error('Failed to set cache value:', error);
  }
}

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
  const userAgent = 'LamontAI-Sitemap-Parser/1.0 (+https://lamontai.ai)';
  try {
    console.log(`Fetching sitemap from: ${sitemapUrl}`);
    const response = await fetch(sitemapUrl, {
      headers: {
        'Accept': 'application/xml, text/xml;q=0.9, */*;q=0.8',
        'User-Agent': userAgent
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status} fetching sitemap`);
    }

    const xmlContent = await response.text();

    return parseSitemapXml(xmlContent, sitemapUrl, recursive);
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
  // Helper function to find the first element with a specific tag name
  const findElement = (nodes: any[], tagName: string): any | null => {
    return nodes.find(node => typeof node === 'object' && node !== null && node.tagName === tagName);
  };

  // Helper function to get text content from a node (handling potential array structure)
  const getTextContent = (node: any): string | undefined => {
    if (!node || !node.children || node.children.length === 0) return undefined;
    // txml children are either strings or other nodes
    const textNode = node.children.find((child: any) => typeof child === 'string');
    return textNode ? String(textNode).trim() : undefined;
  };

  try {
    // Use txml.parse (synchronous and edge-compatible)
    const parsedXml = parse(xmlContent, { 
        keepWhitespace: false, // Reduce noise
        noChildNodes: [], // Ensure nodes like <loc> have children arrays
    });

    const rootElement = parsedXml.find((node: string | XmlElement): node is XmlElement => typeof node === 'object' && node !== null);
    if (!rootElement) {
        throw new Error('Could not find root element in XML');
    }

    // Check if this is a sitemap index
    if (rootElement.tagName === 'sitemapindex') {
      const childSitemaps: string[] = [];
      const sitemapNodes = rootElement.children
        .filter((node: string | XmlElement): node is XmlElement => typeof node === 'object' && node !== null && node.tagName === 'sitemap');
      
      sitemapNodes.forEach((sitemapNode: XmlElement) => {
          const locNode = findElement(sitemapNode.children, 'loc');
          const loc = getTextContent(locNode);
          if (loc) {
            childSitemaps.push(loc);
          }
      });
      
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
    if (rootElement.tagName === 'urlset') {
      const urls: SitemapUrl[] = [];
      const urlNodes = rootElement.children
        .filter((node: string | XmlElement): node is XmlElement => typeof node === 'object' && node !== null && node.tagName === 'url');

      urlNodes.forEach((urlNode: XmlElement) => {
        const locNode = findElement(urlNode.children, 'loc');
        const loc = getTextContent(locNode);

        if (loc) {
          const lastmodNode = findElement(urlNode.children, 'lastmod');
          const changefreqNode = findElement(urlNode.children, 'changefreq');
          const priorityNode = findElement(urlNode.children, 'priority');
          
          urls.push({
            loc: loc,
            lastmod: getTextContent(lastmodNode),
            changefreq: getTextContent(changefreqNode),
            priority: getTextContent(priorityNode)
          });
        }
      });

      return {
        urls,
        isIndex: false
      };
    } else {
        // Handle cases where the root isn't <sitemapindex> or <urlset>
        // Could be a single URL entry or an unexpected format.
        // For now, return empty if not recognized.
        console.warn(`Unexpected root element found: ${rootElement.tagName}`);
        return { urls: [], isIndex: false };
    }
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
  const userAgent = 'LamontAI-Content-Analyzer/1.0 (+https://lamontai.ai)';
  const cacheKey = `url_analysis:${url}`;
  
  try {
    // Check cache first to avoid repeated analysis of the same URL
    // const cachedAnalysis = await getCacheValue<ContentAnalysis>(cacheKey);
    // if (cachedAnalysis) {
    //   console.log(`Using cached analysis for: ${url}`);
    //   return cachedAnalysis;
    // } // Temporarily disable caching for testing fetch
    
    console.log(`Analyzing content from URL: ${url}`);
    const response = await fetch(url, {
      headers: {
        'Accept': 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
        'User-Agent': userAgent
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status} fetching content`);
    }
    
    const content = await response.text();
    
    // Extract title (simple regex approach with type safety)
    let title: string | undefined = undefined;
    try {
      const titleMatch = content && /<title>(.*?)<\/title>/i.exec(content);
      title = titleMatch && titleMatch[1] ? titleMatch[1] : undefined;
    } catch (err) {
      console.error('Error extracting title:', err);
    }
    
    // Extract headings (simple regex approach with error handling)
    let headings: string[] = [];
    try {
      if (content) {
        const headingMatches = content.match(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi) || [];
        headings = headingMatches.map((h: string) => {
          return h.replace(/<\/?[^>]+(>|$)/g, '').trim();
        });
      }
    } catch (err) {
      console.error('Error extracting headings:', err);
      headings = [];
    }
    
    // Simple keyword extraction with error handling
    let keywords: string[] = [];
    let wordCount = 0;
    
    try {
      if (content) {
        const bodyText = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        // Safe splitting to prevent TypeError
        const words = bodyText && typeof bodyText === 'string' 
          ? bodyText.toLowerCase().match(/\b\w+\b/g)
          : [];
        
        if (words) { // Check if words is not null
          wordCount = words.length;
          
          // Basic keyword frequency analysis (top 5 simple words)
          const wordCounts: Record<string, number> = {};
          
          words.forEach((word: string) => {
            if (word && typeof word === 'string') {
              if (wordCounts[word]) {
                wordCounts[word]++;
              } else {
                wordCounts[word] = 1;
              }
            }
          });
          
          keywords = Object.entries(wordCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5) // Get top 5
            .map(([word]) => word);
        }
      }
    } catch (err) {
      console.error('Error analyzing text content:', err);
      keywords = [];
      wordCount = 0;
    }
    
    const analysisResult: ContentAnalysis = {
      url,
      title,
      keywords,
      headings,
      wordCount,
      // readabilityScore: 0, // Placeholder for future implementation
    };
    
    // Cache the result
    // await setCacheValue(cacheKey, analysisResult, 24 * 60 * 60); // Temporarily disable caching for testing fetch
    
    return analysisResult;
  } catch (error) {
    console.error(`Error analyzing content for ${url}:`, error);
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
  const cachedLinks = await getCacheValue<string[]>(cacheKey);
  if (cachedLinks) {
    return cachedLinks;
  }
  
  // Ensure topic is a string to prevent TypeError
  const safeTopicStr = typeof topic === 'string' ? topic : String(topic || '');
  
  // Convert topic to lowercase for case-insensitive matching
  const lowerTopic = safeTopicStr.toLowerCase();
  
  // Filter URLs by relevance to topic (very simple approach)
  const relevantUrls = sitemapData.urls.filter(url => {
    try {
      // Make sure url.loc is a valid string
      if (!url.loc || typeof url.loc !== 'string') {
        return false;
      }
      
      // Safely parse URL - if it fails, just use the raw string
      let urlPath: string;
      try {
        const parsedUrl = new URL(url.loc);
        urlPath = parsedUrl.pathname.toLowerCase();
      } catch (e) {
        // If URL parsing fails, just use the raw URL as a string
        urlPath = url.loc.toLowerCase();
      }
      
      // Check if URL path contains the topic
      if (!urlPath || typeof urlPath !== 'string') {
        return false;
      }
      
      if (lowerTopic && urlPath.includes(lowerTopic)) {
        return true;
      }
      
      // Check for hyphenated version of the topic
      const hyphenatedTopic = lowerTopic.replace(/\s+/g, '-');
      if (hyphenatedTopic && urlPath.includes(hyphenatedTopic)) {
        return true;
      }
      
      // Check for underscore version of the topic
      const underscoreTopic = lowerTopic.replace(/\s+/g, '_');
      if (underscoreTopic && urlPath.includes(underscoreTopic)) {
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error processing URL for relevance:', error);
      return false;
    }
  });
  
  // Sort by priority (if available) and return top results
  const sortedUrls = relevantUrls.sort((a, b) => {
    try {
      // Sort by priority if available
      if (a.priority && b.priority && 
          typeof a.priority === 'string' && 
          typeof b.priority === 'string') {
        return parseFloat(b.priority) - parseFloat(a.priority);
      }
      
      // Safe URL parsing
      let aPath: string = '', bPath: string = '';
      
      if (a.loc && typeof a.loc === 'string') {
        try {
          aPath = new URL(a.loc).pathname;
        } catch (e) {
          aPath = a.loc;
        }
      }
      
      if (b.loc && typeof b.loc === 'string') {
        try {
          bPath = new URL(b.loc).pathname;
        } catch (e) {
          bPath = b.loc;
        }
      }
      
      // Default to URL path length (shorter = more relevant)
      return (aPath?.length || 0) - (bPath?.length || 0);
    } catch (error) {
      console.error('Error sorting URLs:', error);
      return 0;
    }
  });
  
  // Safely map URLs to results
  const result = sortedUrls
    .slice(0, maxResults)
    .map(url => url.loc)
    .filter((loc): loc is string => typeof loc === 'string');
  
  // Cache the results (1 hour TTL)
  await setCacheValue(cacheKey, result, 60 * 60);
  
  return result;
}

/**
 * Get cached sitemap data for a URL or fetch if not in cache
 * @param sitemapUrl - URL of the sitemap
 * @returns The sitemap data
 */
export async function getCachedSitemapData(sitemapUrl: string): Promise<SitemapData> {
  // Cache key for the sitemap
  const cacheKey = `sitemap:${sitemapUrl}`;
  
  try {
    // Try to get from cache first
    const cachedData = await getCacheValue<SitemapData>(cacheKey);
    if (cachedData) {
      console.log(`Using cached sitemap data for ${sitemapUrl}`);
      return cachedData;
    }
    
    // Not in cache, fetch and parse
    console.log(`Fetching fresh sitemap data for ${sitemapUrl}`);
    const sitemapData = await fetchAndParseSitemap(sitemapUrl);
    
    // Cache for 12 hours
    await setCacheValue(cacheKey, sitemapData, 12 * 60 * 60);
    
    return sitemapData;
  } catch (error) {
    console.error(`Error getting cached sitemap data for ${sitemapUrl}:`, error);
    throw error;
  }
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
    await setCacheValue(`user_sitemap:${userId}`, { url: sitemapUrl, urlCount: sitemapData.urls.length });
    
    // In a real implementation, you might store parsed data in a database
    // e.g., db.sitemapData.create({ userId, urlCount: sitemapData.urls.length, ... })
    
    return true;
  } catch (error) {
    console.error(`Error initializing sitemap for user ${userId}:`, error);
    return false;
  }
} 