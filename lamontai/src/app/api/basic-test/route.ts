export function GET() {
  return new Response("API is working", {
    status: 200,
    headers: {
      "Content-Type": "text/plain"
    }
  });
} 