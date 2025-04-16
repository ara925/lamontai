import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseClient } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/server-auth-utils';
import { z } from 'zod';

// Define runtime and dynamic behavior
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

// Validation schema for the website URL
const websiteUrlSchema = z.object({
  websiteUrl: z.string().url("Invalid URL format").max(1024, "URL is too long"),
});

export async function POST(request: NextRequest) {
  try {
    const db = await getDatabaseClient();
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ success: false, message: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const validation = websiteUrlSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ success: false, message: "Validation failed", errors: validation.error.issues }, { status: 400 });
    }

    const { websiteUrl } = validation.data;

    // Update or create settings for the user
    await db.settings.upsert({
      where: { userId },
      update: { websiteUrl },
      create: { userId, websiteUrl },
    });

    return NextResponse.json({ success: true, message: "Website URL updated successfully" });

  } catch (error) {
    console.error("Error updating website URL:", error);
    return NextResponse.json({ success: false, message: "Failed to update website URL" }, { status: 500 });
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
      select: { websiteUrl: true },
    });

    return NextResponse.json({ success: true, websiteUrl: settings?.websiteUrl || null });

  } catch (error) {
    console.error("Error fetching website URL:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch website URL" }, { status: 500 });
  }
} 