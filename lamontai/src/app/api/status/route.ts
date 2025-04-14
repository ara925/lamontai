// Status API - simplest possible endpoint
export function GET() {
  return new Response(
    "OK - Server is running",
    { 
      status: 200,
      headers: { "Content-Type": "text/plain" }
    }
  );
} 