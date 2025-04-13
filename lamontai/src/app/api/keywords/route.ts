import { NextRequest, NextResponse } from 'next/server';

// Mock data for demo purposes
const mockKeywordData = {
  mainKeyword: "content marketing",
  relatedKeywords: [
    { keyword: "content marketing strategy", volume: 6600, difficulty: 78, cpc: 12.50 },
    { keyword: "content marketing examples", volume: 3600, difficulty: 65, cpc: 8.75 },
    { keyword: "content marketing benefits", volume: 2400, difficulty: 52, cpc: 7.20 },
    { keyword: "b2b content marketing", volume: 1900, difficulty: 69, cpc: 15.30 },
    { keyword: "content marketing statistics", volume: 1700, difficulty: 58, cpc: 9.40 },
    { keyword: "content marketing tools", volume: 1500, difficulty: 72, cpc: 11.80 },
    { keyword: "what is content marketing", volume: 1400, difficulty: 45, cpc: 6.90 },
    { keyword: "content marketing agency", volume: 1300, difficulty: 80, cpc: 18.60 },
    { keyword: "content marketing tips", volume: 1100, difficulty: 61, cpc: 8.10 },
    { keyword: "content marketing plan", volume: 950, difficulty: 59, cpc: 10.20 },
  ],
  searchIntent: {
    informational: 65,
    transactional: 15,
    navigational: 10,
    commercial: 10
  },
  competitorKeywords: [
    { competitor: "hubspot.com", keywords: ["content marketing guide", "content marketing hub", "content marketing template"] },
    { competitor: "neilpatel.com", keywords: ["content marketing strategy", "content marketing tools", "content marketing success"] },
    { competitor: "contentmarketinginstitute.com", keywords: ["content marketing trends", "content marketing research", "content marketing examples"] },
  ]
};

export async function POST(request: NextRequest) {
  try {
    const { query, options } = await request.json();
    
    if (!query) {
      return NextResponse.json({
        success: false,
        message: "Keyword query is required"
      }, { status: 400 });
    }
    
    // Simulate API processing time
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    // In a real implementation, we would call a keyword research API
    // For demo, we're returning mock data with the query included
    const responseData = {
      ...mockKeywordData,
      mainKeyword: query,
      query,
      options: options || {}
    };
    
    return NextResponse.json({
      success: true,
      message: "Keyword research completed",
      data: responseData
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error researching keywords:', error);
    return NextResponse.json({
      success: false,
      message: "Failed to complete keyword research",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // Get the search parameters from the request URL
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('query');
  
  if (!query) {
    return NextResponse.json({
      success: false,
      message: "Keyword query is required"
    }, { status: 400 });
  }
  
  try {
    // Simulate API processing time
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Return mock data with the provided query
    const responseData = {
      ...mockKeywordData,
      mainKeyword: query
    };
    
    return NextResponse.json({
      success: true,
      message: "Keyword research completed",
      data: responseData
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error researching keywords:', error);
    return NextResponse.json({
      success: false,
      message: "Failed to complete keyword research",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
} 