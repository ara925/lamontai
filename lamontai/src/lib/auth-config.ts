import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { verifyPassword } from "./auth-helpers";

/**
 * Determine if we're in an edge environment
 */
export const isEdgeRuntime = () => {
  return process.env.NEXT_PUBLIC_DEPLOY_ENV === 'cloudflare' || 
         process.env.NEXT_PUBLIC_CLOUDFLARE_ENABLED === 'true';
};

// Edge-compatible auth options - this is separate from the NextAuth handler
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Defensive check for credentials
        if (!credentials || 
            typeof credentials !== 'object' || 
            !credentials.email || 
            !credentials.password || 
            typeof credentials.email !== 'string' || 
            typeof credentials.password !== 'string') {
          console.log("Invalid credentials format");
          return null;
        }

        try {
          // Import DB client only when needed
          const { getDatabaseClient } = await import("./db");
          const db = await getDatabaseClient();
          
          const user = await db.user.findUnique({
            where: { email: credentials.email }
          });

          if (!user || !user.password) {
            console.log("User not found or password not set");
            return null;
          }

          // Handle password verification based on environment
          let isValid = false;
          if (isEdgeRuntime()) {
            // For edge runtime, use edge-compatible password verification
            const { verifyPasswordEdge } = await import("./auth-helpers-edge");
            isValid = await verifyPasswordEdge(credentials.password, user.password);
          } else {
            // For Node.js, use bcrypt-based verification
            isValid = await verifyPassword(credentials.password, user.password);
          }

          if (!isValid) {
            console.log("Invalid password");
            return null;
          }

          // Return minimal user info
          return {
            id: user.id,
            name: user.name || "",
            email: user.email,
            role: user.role || "user",
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      // Safely merge user data into token
      if (user) {
        token.id = user.id || "";
        token.role = user.role || "user";
      }
      return token;
    },
    async session({ session, token }) {
      // Ensure session and user objects exist before accessing
      if (token && session && session.user) {
        session.user.id = (token.id as string) || "";
        session.user.role = (token.role as string) || "user";
      }
      return session;
    }
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET,
  debug: process.env.NODE_ENV === "development",
}; 