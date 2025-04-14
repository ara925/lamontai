import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth-config";

// Function to check if we're in Cloudflare environment
const isCloudflareEnvironment = () => {
  return process.env.NEXT_PUBLIC_DEPLOY_ENV === 'cloudflare';
};

// Dynamically initialize NextAuth with the appropriate configuration
async function createHandler() {
  let options = { ...authOptions };
  
  // If in Cloudflare environment, configure with Cloudflare adapter
  if (isCloudflareEnvironment()) {
    try {
      // Dynamically import adapter to avoid issues in non-Cloudflare environments
      const { CloudflareAdapter } = await import('@/lib/auth-adapter-cloudflare');
      options.adapter = CloudflareAdapter();
    } catch (error) {
      console.error('Failed to load Cloudflare adapter:', error);
      // Continue without adapter if there's an issue loading it
    }
  }
  
  return NextAuth(options);
}

// NextAuth handler for API routes
const handler = NextAuth(authOptions);

// Export the handler for GET and POST methods
export { handler as GET, handler as POST }; 