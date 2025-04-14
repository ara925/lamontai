import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { users } from "@/lib/mock-data";

// Function to determine if we're in a Cloudflare environment
const isCloudflareEnvironment = () => {
  return process.env.NEXT_PUBLIC_DEPLOY_ENV === 'cloudflare';
};

// Function to dynamically get the auth adapter
const getAuthAdapter = async () => {
  if (isCloudflareEnvironment()) {
    // Dynamically import the Cloudflare adapter to avoid issues in non-Cloudflare environments
    const { CloudflareAdapter } = await import('./auth-adapter-cloudflare');
    return CloudflareAdapter();
  }
  return undefined; // Use default adapter in non-Cloudflare environments
};

// Export the auth options configuration
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        
        // Simple development check - use hardcoded credentials for testing
        if (
          (credentials.email === 'user@example.com' && credentials.password === 'password123') ||
          (credentials.email === 'admin@example.com' && credentials.password === 'admin123')
        ) {
          const user = users.find(u => u.email === credentials.email);
          
          if (!user) return null;
          
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            image: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`
          };
        }
        
        return null;
      }
    }),
  ],
  // Conditionally include adapter based on environment
  // We'll set this dynamically when initializing NextAuth
  // adapter: undefined,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    // Customize the JWT encoding/decoding
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/auth/login",
    signOut: "/auth/logout",
    error: "/auth/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET || "default-secret-key-for-development-only",
}; 