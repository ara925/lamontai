export async function GET() {
  return new Response(
    JSON.stringify({
      status: 'success',
      message: 'Basic test endpoint'
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
} 