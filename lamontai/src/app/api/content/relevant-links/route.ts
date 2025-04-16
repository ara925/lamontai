import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseClient } from '@/lib/db'; // Import getter
import { getUserIdFromRequest } from '@/lib/server-auth-utils';
import { OpenAI } from 'openai';

// Configure runtime and dynamic behavior
export const runtime = 'edge'; // Assuming edge compatibility based on OpenAI usage
export const dynamic = 'force-dynamic';

// Instantiate OpenAI client
const openai = new OpenAI();

export async function POST(request: NextRequest) {
  try {
    // Authentication (optional but recommended)
    const userId = await getUserIdFromRequest(request);
    // if (!userId) {
    //   return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    // }

    const body = await request.json();
    const { content, topic } = body;

    if (!content || typeof content !== 'string' || !topic || typeof topic !== 'string') {
      return NextResponse.json({ message: "Content and topic are required" }, { status: 400 });
    }

    // Limit content size
    const truncatedContent = content.slice(0, 8000);

    // Call OpenAI API to find relevant internal links
    // This requires access to user's other articles/pages, which is complex here.
    // Simplification: Ask AI for *potential* internal link opportunities based on content and topic.
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Analyze the provided text content which is about \"${topic}\". Identify 3-5 key phrases or concepts within the text that would be good candidates for internal linking to other relevant pages on the same website. For each candidate, explain briefly why it's a good link opportunity. Format the output as a JSON array of objects, each with 'phrase' and 'reason' keys.`,
        },
        { role: "user", content: truncatedContent },
      ],
      temperature: 0.6,
      max_tokens: 300,
      response_format: { type: "json_object" }, // Request JSON output
    });

    let relevantLinksData: any = [];
    const responseContent = completion.choices[0]?.message?.content;

    if (responseContent) {
        try {
            // Attempt to parse the JSON response
            const parsedJson = JSON.parse(responseContent);
            // Expecting an array directly, or potentially nested like { links: [...] }
            relevantLinksData = Array.isArray(parsedJson) ? parsedJson : (parsedJson.links || []);
        } catch (parseError) {
            console.error("Failed to parse OpenAI JSON response for relevant links:", parseError);
            // Fallback or handle error - maybe return the raw text if needed?
        }
    }

    if (!relevantLinksData || relevantLinksData.length === 0) {
      console.log("No relevant link opportunities identified by AI.");
      // Return empty array instead of erroring if AI finds nothing
    }

    // Note: This doesn't provide actual URLs, only candidates.
    // A more advanced implementation would search the user's actual content.
    return NextResponse.json({ success: true, linkOpportunities: relevantLinksData });

  } catch (error) {
    console.error("Failed to find relevant links:", error);
    return NextResponse.json({ message: "Failed to find relevant links" }, { status: 500 });
  }
} 