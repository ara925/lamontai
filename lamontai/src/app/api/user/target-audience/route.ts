import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseClient } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/server-auth-utils';
import { z } from 'zod';

// Define runtime and dynamic behavior
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

// Validation schema for the target audience
const targetAudienceSchema = z.object({
  languages: z.array(z.string().min(2)).min(1, "At least one language is required").max(10, "Maximum of 10 languages allowed"),
  // Add other relevant fields if needed, e.g., regions, interests
});

export async function POST(request: NextRequest) {
  try {
    const db = await getDatabaseClient();
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ success: false, message: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const validation = targetAudienceSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ success: false, message: "Validation failed", errors: validation.error.issues }, { status: 400 });
    }

    const { languages } = validation.data;

    // Update or create settings
    await db.settings.upsert({
      where: { userId },
      update: { targetLanguages: languages },
      create: { userId, targetLanguages: languages },
    });

    return NextResponse.json({ success: true, message: "Target audience updated successfully" });

  } catch (error) {
    console.error("Error updating target audience:", error);
    return NextResponse.json({ success: false, message: "Failed to update target audience" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const db = await getDatabaseClient();
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ success: false, message: "Authentication required" }, { status: 401 });
    }

    const settings = await db.settings.findUnique({
      where: { userId },
      select: { targetLanguages: true },
    });

    // Ensure targetLanguages is returned as an array, even if null/undefined in DB
    const languagesList = settings?.targetLanguages ? settings.targetLanguages : [];

    return NextResponse.json({ success: true, languages: languagesList });

  } catch (error) {
    console.error("Error fetching target audience:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch target audience" }, { status: 500 });
  }
} 