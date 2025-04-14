import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    message: 'Hello, this is a test API endpoint',
    timestamp: new Date().toISOString()
  });
} 