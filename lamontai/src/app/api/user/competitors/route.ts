import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseClient } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/server-auth-utils';
import { z } from 'zod';

// Define runtime and dynamic behavior
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

// Validation schema for competitors
const competitorSchema = z.object({
  name: z.string().min(1, "Competitor name cannot be empty").max(100, "Competitor name too long"),
  website: z.string().url("Invalid website URL").max(255, "Website URL too long"),
});

const competitorsSchema = z.object({
  competitors: z.array(competitorSchema).max(10, "You can add up to 10 competitors"),
});

export async function POST(request: NextRequest) {
  try {
    const db = await getDatabaseClient();
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ success: false, message: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const validation = competitorsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ success: false, message: "Validation failed", errors: validation.error.issues }, { status: 400 });
    }

    const { competitors } = validation.data;

    // Update or create settings
    await db.settings.upsert({
      where: { userId },
      update: { competitors: competitors },
      create: { userId, competitors: competitors },
    });

    return NextResponse.json({ success: true, message: "Competitors updated successfully" });

  } catch (error) {
    console.error("Error updating competitors:", error);
    return NextResponse.json({ success: false, message: "Failed to update competitors" }, { status: 500 });
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
      select: { competitors: true },
    });

    // Ensure competitors is returned as an array, even if null/undefined in DB
    const competitorsList = settings?.competitors ? settings.competitors : [];

    return NextResponse.json({ success: true, competitors: competitorsList });

  } catch (error) {
    console.error("Error fetching competitors:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch competitors" }, { status: 500 });
  }
} 