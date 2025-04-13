import { NextResponse } from 'next/server';
import axios from 'axios';

// Backend URL with port 5000
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

/**
 * Health check endpoint that proxies to the backend
 */
export async function GET() {
  try {
    // Forward the request to the backend health endpoint
    const response = await axios.get(`${BACKEND_URL}/health`, {
      timeout: 5000
    });
    
    // Return the backend response
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error connecting to backend:', error);
    
    // Return error response
    return NextResponse.json({
      status: 'error',
      message: 'Failed to connect to backend',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 