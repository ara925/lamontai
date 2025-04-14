import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    status: 'success',
    message: 'pong',
    timestamp: new Date().toISOString()
  });
} 