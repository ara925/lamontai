import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import '@/lib/auth-types'; // Import the type declarations

// This is a reference to the mock database in the parent route file
// In a real application, you would use a proper database
// For this mock implementation, we're using the same data structure
const mockArticles = {
  "1": [
    {
      id: "art_001",
      userId: "1",
      title: "10 Essential SEO Strategies for 2023",
      snippet: "Discover the most effective SEO strategies that will help your content rank higher in 2023...",
      content: "# 10 Essential SEO Strategies for 2023\n\nIn the ever-evolving world of search engine optimization...",
      keywords: ["seo strategies", "seo 2023", "content ranking"],
      status: "published",
      wordCount: 1250,
      createdAt: "2023-09-18T14:35:12Z",
      updatedAt: "2023-09-20T10:15:22Z",
      seoScore: 87,
      readabilityScore: 92
    },
    {
      id: "art_002",
      userId: "1",
      title: "How to Conduct Effective Keyword Research",
      snippet: "Learn how to find the perfect keywords that will drive targeted traffic to your website...",
      content: "# How to Conduct Effective Keyword Research\n\nKeyword research is the foundation of any successful SEO strategy...",
      keywords: ["keyword research", "seo keywords", "keyword analysis"],
      status: "draft",
      wordCount: 875,
      createdAt: "2023-10-05T09:22:47Z",
      updatedAt: "2023-10-05T09:22:47Z",
      seoScore: 79,
      readabilityScore: 88
    }
  ],
  "2": [
    {
      id: "art_003",
      userId: "2",
      title: "The Ultimate Guide to Content Marketing",
      snippet: "Master the art of content marketing with this comprehensive guide covering strategy, creation, and distribution...",
      content: "# The Ultimate Guide to Content Marketing\n\nContent marketing is a strategic approach focused on creating valuable, relevant content...",
      keywords: ["content marketing", "content strategy", "digital marketing"],
      status: "published",
      wordCount: 2150,
      createdAt: "2023-08-12T11:20:33Z",
      updatedAt: "2023-08-15T16:45:09Z",
      seoScore: 94,
      readabilityScore: 89
    }
  ]
};

// Helper function to find an article by ID
const findArticleById = (articleId: string) => {
  for (const userId in mockArticles) {
    const userArticles = mockArticles[userId as keyof typeof mockArticles];
    const article = userArticles.find(art => art.id === articleId);
    if (article) {
      return { article, userId, index: userArticles.indexOf(article) };
    }
  }
  return null;
};

// GET a specific article by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return NextResponse.json({
      success: false,
      message: "Authentication required"
    }, { status: 401 });
  }
  
  const articleId = params.id;
  
  try {
    // Find the article in our mock database
    const result = findArticleById(articleId);
    
    if (!result) {
      return NextResponse.json({
        success: false,
        message: "Article not found"
      }, { status: 404 });
    }
    
    const { article, userId } = result;
    
    // Check if the user is authorized to access this article
    if (userId !== (session?.user as any).id) {
      return NextResponse.json({
        success: false,
        message: "You are not authorized to access this article"
      }, { status: 403 });
    }
    
    return NextResponse.json({
      success: true,
      data: article
    }, { status: 200 });
    
  } catch (error) {
    console.error(`Error fetching article ${articleId}:`, error);
    return NextResponse.json({
      success: false,
      message: "Failed to fetch article",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

// PATCH (update) a specific article by ID
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return NextResponse.json({
      success: false,
      message: "Authentication required"
    }, { status: 401 });
  }
  
  const articleId = params.id;
  
  try {
    // Find the article in our mock database
    const result = findArticleById(articleId);
    
    if (!result) {
      return NextResponse.json({
        success: false,
        message: "Article not found"
      }, { status: 404 });
    }
    
    const { article, userId, index } = result;
    
    // Check if the user is authorized to update this article
    if (userId !== (session?.user as any).id) {
      return NextResponse.json({
        success: false,
        message: "You are not authorized to update this article"
      }, { status: 403 });
    }
    
    // Get the update data
    const updates = await request.json();
    
    // Update the article
    const updatedArticle = {
      ...article,
      ...updates,
      // Always update the updatedAt timestamp
      updatedAt: new Date().toISOString(),
      // Recalculate word count if content was updated
      wordCount: updates.content ? updates.content.split(/\s+/).length : article.wordCount
    };
    
    // Update the article in our mock database
    // @ts-ignore - This is fine for the mock implementation
    mockArticles[userId][index] = updatedArticle;
    
    return NextResponse.json({
      success: true,
      message: "Article updated successfully",
      data: updatedArticle
    }, { status: 200 });
    
  } catch (error) {
    console.error(`Error updating article ${articleId}:`, error);
    return NextResponse.json({
      success: false,
      message: "Failed to update article",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

// DELETE a specific article by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return NextResponse.json({
      success: false,
      message: "Authentication required"
    }, { status: 401 });
  }
  
  const articleId = params.id;
  
  try {
    // Find the article in our mock database
    const result = findArticleById(articleId);
    
    if (!result) {
      return NextResponse.json({
        success: false,
        message: "Article not found"
      }, { status: 404 });
    }
    
    const { userId, index } = result;
    
    // Check if the user is authorized to delete this article
    if (userId !== (session?.user as any).id) {
      return NextResponse.json({
        success: false,
        message: "You are not authorized to delete this article"
      }, { status: 403 });
    }
    
    // Remove the article from our mock database
    // @ts-ignore - This is fine for the mock implementation
    mockArticles[userId].splice(index, 1);
    
    return NextResponse.json({
      success: true,
      message: "Article deleted successfully"
    }, { status: 200 });
    
  } catch (error) {
    console.error(`Error deleting article ${articleId}:`, error);
    return NextResponse.json({
      success: false,
      message: "Failed to delete article",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
} 