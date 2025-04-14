/**
 * Edge-compatible Auth Configuration
 * 
 * This file contains the configuration for NextAuth.js with Edge compatibility.
 * It uses a custom adapter and JWT-based authentication for Cloudflare compatibility.
 */

import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { EdgeAuthAdapter, verifyCredentialsEdge } from './auth-adapter-edge';

/**
 * Configuration options for NextAuth.js with Edge compatibility
 */
export const edgeAuthOptions: NextAuthOptions = {
  // Use the custom Edge adapter
  adapter: EdgeAuthAdapter(),
  
  // Configure providers
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
        
        try {
          // Use our Edge-compatible verification
          return await verifyCredentialsEdge(
            credentials.email,
            credentials.password
          );
        } catch (error) {
          console.error("Error authorizing credentials:", error);
          return null;
        }
      }
    }),
  ],
  
  // Configure session
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  
  // Configure JWT
  jwt: {
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  
  // Configure pages
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  
  // Add user role to the JWT token and session
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.role = token.role as string;
      }
      return session;
    }
  },
  
  // Enable debug in development
  debug: process.env.NODE_ENV === "development",
};

/**
 * Default export for convenience
 */
export default edgeAuthOptions; 