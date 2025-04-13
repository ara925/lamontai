// Type declarations for NextAuth
import { User as NextAuthUser } from "next-auth";

// Custom User interface with token property
export interface CustomUser extends NextAuthUser {
  id: string;
  role?: string;
  token?: string;
}

// Extend the built-in User type
declare module "next-auth" {
  interface User {
    id: string;
    role?: string;
    token?: string;
  }
  
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
    }
    token?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role?: string;
    token?: string;
  }
} 