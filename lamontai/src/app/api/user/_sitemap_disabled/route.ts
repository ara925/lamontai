import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseClient } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/server-auth-utils';
import { z } from 'zod';
import { fetchAndParseSitemap } from '@/lib/sitemap-utils';

// Define runtime and dynamic behavior
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

// Validation schema for the sitemap URL
const sitemapSchema = z.object({
  sitemapUrl: z.string().url("Invalid URL format").max(1024, "URL is too long").or(z.literal('')),
});

export async function POST(request: NextRequest) {
  try {
    const db = await getDatabaseClient();
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ success: false, message: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const validation = sitemapSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ success: false, message: "Validation failed", errors: validation.error.issues }, { status: 400 });
    }

    const { sitemapUrl } = validation.data;

    // Attempt to fetch and parse the sitemap to validate it before saving
    let sitemapValid = false;
    let validationMessage = "Sitemap URL saved.";
    if (sitemapUrl && sitemapUrl.length > 0) {
        try {
            const sitemapData = await fetchAndParseSitemap(sitemapUrl);
            if (sitemapData && sitemapData.urls.length > 0) {
                sitemapValid = true;
                validationMessage = `Sitemap URL saved and validated (${sitemapData.urls.length} URLs found).`;
            } else {
                 validationMessage = "Sitemap URL saved, but no URLs were found or the sitemap was empty.";
            }
        } catch (fetchError: any) {
            console.error("Error fetching or parsing sitemap:", fetchError);
            validationMessage = `Sitemap URL saved, but validation failed: ${fetchError.message}`;
            // Decide if we should prevent saving on fetch error, currently we save anyway
        }
    }

    // Update or create settings
    await db.settings.upsert({
      where: { userId },
      update: { sitemapUrl: sitemapUrl || null }, // Store null if empty string
      create: { userId, sitemapUrl: sitemapUrl || null },
    });

    return NextResponse.json({ success: true, message: validationMessage, sitemapValid });

  } catch (error) {
    console.error("Error updating sitemap URL:", error);
    return NextResponse.json({ success: false, message: "Failed to update sitemap URL" }, { status: 500 });
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
      select: { sitemapUrl: true },
    });

    return NextResponse.json({ success: true, sitemapUrl: settings?.sitemapUrl || null });

  } catch (error) {
    console.error("Error fetching sitemap URL:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch sitemap URL" }, { status: 500 });
  }
} 