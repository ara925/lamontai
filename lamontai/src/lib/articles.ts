import { saveAs } from 'file-saver';

// Types for article data
export interface Article {
  id: string;
  title: string;
  date: string;
  seoImpact: number;
  keywords: number;
  searchVolume: number;
  content: string;
  category: string;
}

// Mock article data
const mockArticles: Article[] = [
  {
    id: '1',
    title: 'Boost Your Online Presence with PPC and SEO Services',
    date: 'APR 5TH, 2025',
    seoImpact: 92,
    keywords: 2,
    searchVolume: 1410,
    content: `
      <h2>Introduction</h2>
      <p>In today's digital landscape, establishing a strong online presence is crucial for businesses of all sizes. Pay-Per-Click (PPC) advertising and Search Engine Optimization (SEO) are two powerful strategies that can significantly enhance your visibility and drive targeted traffic to your website.</p>
      
      <h2>Understanding PPC Advertising</h2>
      <p>PPC is a digital marketing model where advertisers pay a fee each time their ad is clicked. It's essentially a way of buying visits to your site rather than earning them organically. Google Ads is the most popular PPC platform, allowing businesses to display ads in Google's search results and across its advertising network.</p>
      
      <h2>The Power of SEO</h2>
      <p>SEO involves optimizing your website to rank higher in organic search results. Unlike PPC, SEO focuses on unpaid traffic and involves improving various aspects of your website, from content quality to technical performance, to make it more attractive to search engines.</p>
      
      <h2>Combining PPC and SEO for Maximum Impact</h2>
      <p>While PPC and SEO can be effective individually, they work best when implemented together as part of a comprehensive digital marketing strategy. PPC provides immediate visibility and results, while SEO builds long-term organic presence and credibility.</p>
      
      <h2>Conclusion</h2>
      <p>Investing in both PPC and SEO services can provide your business with the best of both worlds: immediate visibility and long-term sustainable growth. By leveraging these powerful marketing channels, you can boost your online presence, drive qualified traffic, and ultimately increase conversions and revenue.</p>
    `,
    category: 'Digital Marketing',
  },
  {
    id: '2',
    title: '10 Essential AI Tools for Content Creators in 2025',
    date: 'APR 4TH, 2025',
    seoImpact: 88,
    keywords: 5,
    searchVolume: 2350,
    content: `
      <h2>Introduction</h2>
      <p>As content creation continues to evolve, artificial intelligence has become an indispensable ally for creators looking to enhance productivity and creativity. In 2025, several AI tools stand out for their ability to transform the content creation process.</p>
      
      <h2>AI Writing Assistants</h2>
      <p>Advanced AI writing tools now offer more than just grammar corrections. They can suggest content improvements, help maintain consistent tone, and even generate creative ideas based on your target audience and goals.</p>
      
      <h2>Visual Content Generation</h2>
      <p>AI-powered image and video creation tools have revolutionized visual content. These tools can now create stunning, original visuals based on simple text prompts, eliminating the need for extensive design skills or expensive stock photo subscriptions.</p>
      
      <h2>Audio and Voice Enhancement</h2>
      <p>For podcasters and video creators, AI audio tools offer incredible voice enhancement, background noise removal, and even voice cloning capabilities that were previously only available in professional studios.</p>
      
      <h2>SEO and Distribution Intelligence</h2>
      <p>AI-powered content distribution tools now provide predictive analytics on how content will perform across different platforms, helping creators optimize their distribution strategy for maximum impact.</p>
      
      <h2>Conclusion</h2>
      <p>The right AI tools can significantly enhance your content creation workflow, helping you produce higher quality content more efficiently. As these technologies continue to advance, staying current with the latest AI innovations will be essential for content creators who want to maintain a competitive edge.</p>
    `,
    category: 'Content Creation',
  }
];

// Get today's article
export const getTodayArticle = (): Article => {
  // In a real app, this would fetch from an API or generate a new article
  return mockArticles[0];
};

// Get all articles
export const getAllArticles = (): Article[] => {
  // In a real app, this would fetch from an API
  return mockArticles;
};

// Get article by ID
export const getArticleById = (id: string): Article | undefined => {
  return mockArticles.find(article => article.id === id);
};

// Download article as PDF (simulated)
export const downloadArticle = (article: Article) => {
  // In a real app, this would generate a PDF
  // For now, we'll create a text file with the content
  const blob = new Blob(
    [
      `${article.title}\n\n`,
      `Date: ${article.date}\n`,
      `SEO Impact: ${article.seoImpact}\n`,
      `Keywords: ${article.keywords}\n`,
      `Search Volume: ${article.searchVolume}\n\n`,
      // Remove HTML tags for plain text
      article.content.replace(/<[^>]*>?/gm, '')
    ],
    { type: 'text/plain;charset=utf-8' }
  );
  
  saveAs(blob, `article-${article.id}-${new Date().getTime()}.txt`);
};

// Connect to Google Search Console (simulated)
export const connectGoogleSearchConsole = async (): Promise<{ success: boolean }> => {
  // In a real app, this would initiate OAuth flow
  // For demo purposes, we'll simulate a successful connection
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({ success: true });
    }, 1500);
  });
}; 