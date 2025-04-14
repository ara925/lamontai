// Ensure this route is always rendered dynamically
export const dynamic = 'force-dynamic';

// Simple string response function
export function GET() {
  return new Response('Simple test API response', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain'
    }
  });
} 