import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseClient } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/server-auth-utils';
import { z } from 'zod';

// Define runtime and dynamic behavior
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

// Validation schema for the request body
const businessDescriptionSchema = z.object({
  description: z.string().min(10, "Description must be at least 10 characters long").max(1000, "Description must be 1000 characters or less"),
});

export async function POST(request: NextRequest) {
  try {
    const db = await getDatabaseClient();
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ success: false, message: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const validation = businessDescriptionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ success: false, message: "Validation failed", errors: validation.error.issues }, { status: 400 });
    }

    const { description } = validation.data;

    // Update or create settings for the user
    await db.settings.upsert({
      where: { userId },
      update: { businessDescription: description },
      create: { userId, businessDescription: description },
    });

    return NextResponse.json({ success: true, message: "Business description updated successfully" });

  } catch (error) {
    console.error("Error updating business description:", error);
    return NextResponse.json({ success: false, message: "Failed to update business description" }, { status: 500 });
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
      select: { businessDescription: true },
    });

    return NextResponse.json({ success: true, description: settings?.businessDescription || null });

  } catch (error) {
    console.error("Error fetching business description:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch business description" }, { status: 500 });
  }
} 