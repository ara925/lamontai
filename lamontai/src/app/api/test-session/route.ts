import { NextRequest, NextResponse } from 'next/server';
// Revert import for getUserIdFromRequest to the original, as it seems edge-compatible
// import { getUserIdFromRequest } from '@/lib/server-auth-utils'; // Temporarily commented out
// Import edge Prisma setup
// import { getPrismaForEnvironment, disconnectPrisma } from '@/lib/prisma-cloudflare'; // Temporarily commented out
// import type { PrismaClient } from '@prisma/client'; // Temporarily commented out

// Ensure this route is always rendered dynamically
export const dynamic = 'force-dynamic';
export const runtime = 'edge';

// Helper to get edge client (REMOVED - Use getPrismaForEnvironment)
// async function getEdgePrismaClient() {
//   const adapter = createNeonAdapter();
//   return new PrismaClient({ adapter });
// }

export async function GET(request: NextRequest) {
  // Temporarily return static response to isolate build error
  try {
    console.log('Test session route hit (simplified)');
    return NextResponse.json({
      status: 'success',
      message: 'Simplified test route OK'
    }, { status: 200 });

    // --- Original Logic Commented Out ---
    /*
    const userId = await getUserIdFromRequest(request);
    
    let user = null;
    if (userId) {
      try {
        user = await getPrismaForEnvironment().user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          }
        });
      } catch (dbError) {
        console.error('Database error during user fetch:', dbError);
      }
    }

    return NextResponse.json({
      status: 'success',
      authenticated: !!userId,
      user: user,
      env: { nodeEnv: process.env.NODE_ENV }
    }, { status: 200 });
    */
   // --- End Original Logic ---

  } catch (error: any) {
    console.error('Simplified session error:', error);
    return NextResponse.json({
      status: 'error',
      message: error.message || 'Failed to get simplified session',
    }, { status: 500 });
  }
} 