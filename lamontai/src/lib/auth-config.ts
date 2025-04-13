import type { NextAuthOptions, User as NextAuthUser } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { generateToken } from "@/lib/server-auth-utils";
import { db } from "@/lib/db";

// Custom User interface with token property
interface CustomUser extends NextAuthUser {
  id: string;
  role?: string;
  token?: string;
}

// This is a mock user database - in production you'd use a real database
const users = [
  {
    id: "1",
    name: "Demo User",
    email: "user@example.com",
    password: "password123", // In production, never store plain text passwords
    image: "https://ui-avatars.com/api/?name=Demo+User&background=0D8ABC&color=fff",
    role: "user",
  },
  {
    id: "2",
    name: "Admin User",
    email: "admin@example.com",
    password: "admin123", // In production, never store plain text passwords
    image: "https://ui-avatars.com/api/?name=Admin+User&background=8A2BE2&color=fff",
    role: "admin",
  },
  {
    id: "3",
    name: "Test User",
    email: "test@example.com",
    password: "password123", // In production, never store plain text passwords
    image: "https://ui-avatars.com/api/?name=Test+User&background=F59E0B&color=fff",
    role: "user",
  }
];

// Export the auth options configuration
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "mock-client-id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "mock-client-secret",
    }),
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
        
        // In production, you would query your database here
        const user = users.find(user => user.email === credentials.email);
        
        if (user && user.password === credentials.password) {
          // Remove the password before returning the user object
          const { password, ...userWithoutPassword } = user;
          return userWithoutPassword;
        }
        
        return null;
      }
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/auth/login",
    signOut: "/auth/logout",
    error: "/auth/login",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Only handle OAuth providers here (Google)
      if (account && account.provider === 'google' && profile && user.email) {
        try {
          // Check if user already exists in our database
          let dbUser = await db.user.findUnique({
            where: { email: user.email }
          });
          
          // If user doesn't exist, create a new one
          if (!dbUser) {
            console.log(`NextAuth: New Google user, creating in database: ${user.email}`);
            
            // Ensure we have a valid name
            const userName = typeof user.name === 'string' && user.name.trim() !== '' 
              ? user.name 
              : 'Google User';
            
            // Create user with Prisma transaction to ensure all related data is created
            dbUser = await db.$transaction(async (tx) => {
              // 1. Create the user - using only fields that exist in the schema
              const newUser = await tx.user.create({
                data: {
                  name: userName,
                  email: user.email as string, // Type assertion since we already checked it exists above
                  // Create an empty password for Google users
                  password: '',
                  // Store the provider info in ipAddress field (for tracking purposes)
                  ipAddress: `google:${account.providerAccountId || 'unknown'}`,
                  role: 'user'
                },
              });

              // 2. Create default settings for the user
              await tx.settings.create({
                data: {
                  userId: newUser.id,
                  theme: 'light',
                  language: 'english',
                  notifications: true,
                  apiKey: 'sk_test_' + Math.random().toString(36).substring(2, 15),
                },
              });

              // 3. Set up free subscription
              const freePlan = await tx.plan.findFirst({
                where: { name: 'Free' }
              });

              if (freePlan) {
                await tx.subscription.create({
                  data: {
                    userId: newUser.id,
                    planId: freePlan.id,
                    status: 'active',
                    startDate: new Date(),
                    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
                  },
                });
              }

              return newUser;
            });
            
            console.log(`NextAuth: Successfully created user from Google OAuth: ${dbUser.email}`);
          } else {
            console.log(`NextAuth: Existing user found for Google authentication: ${dbUser.email}`);
            
            // No need to update any fields for existing users
          }
          
          // Override the user object with our database user info 
          user.id = dbUser.id;
          user.role = dbUser.role || 'user';
          
          // Generate a custom JWT token using our server utilities
          try {
            const customToken = await generateToken({
              id: dbUser.id,
              email: dbUser.email,
              role: dbUser.role || 'user'
            });
            
            // Add token to the user object (with type assertion)
            (user as CustomUser).token = customToken;
            console.log('Generated custom token for OAuth user:', user.email);
          } catch (tokenError) {
            console.error('Error generating token for OAuth user:', tokenError);
          }
        } catch (error) {
          console.error('Error handling Google OAuth user:', error);
          return false;
        }
      }
      
      return true;
    },
    async jwt({ token, user, account }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.role = user.role;
        
        // Store the custom token in the JWT (with type assertion)
        if ((user as CustomUser).token) {
          token.token = (user as CustomUser).token;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        
        // Add the custom token to the session
        if (token.token) {
          session.token = token.token;
        }
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      console.log('NextAuth: User signed in:', user.email || 'unknown email');
    },
    async signOut({ token }) {
      console.log('NextAuth: User signed out');
    }
  },
  secret: process.env.NEXTAUTH_SECRET || "mockSecretForDevelopmentOnly",
  debug: process.env.NODE_ENV === "development",
}; 