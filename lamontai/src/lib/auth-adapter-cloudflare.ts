/**
 * Custom NextAuth Adapter for Cloudflare PostgreSQL compatibility
 * This adapter connects NextAuth.js to our Cloudflare PostgreSQL database
 */

import type { Adapter } from "next-auth/adapters";
import { PrismaClient, User, Account, Session, VerificationToken } from "@prisma/client";
import { getCloudflareClient } from "./cloudflare-db";

export function CloudflareAdapter(): Adapter {
  return {
    async createUser(user) {
      const prisma = await getCloudflareClient();
      const newUser = await prisma.user.create({
        data: {
          name: user.name || "Anonymous User",
          email: user.email,
          password: "", // Will be updated during credential auth
          role: "user",
        },
      });
      return newUser;
    },

    async getUser(id) {
      const prisma = await getCloudflareClient();
      return prisma.user.findUnique({ where: { id } });
    },

    async getUserByEmail(email) {
      const prisma = await getCloudflareClient();
      return prisma.user.findUnique({ where: { email } });
    },

    async getUserByAccount({ providerAccountId, provider }) {
      try {
        const prisma = await getCloudflareClient();
        const account = await prisma.account.findUnique({
          where: {
            provider_providerAccountId: {
              provider,
              providerAccountId,
            },
          },
          include: { user: true },
        });
        return account?.user ?? null;
      } catch (error) {
        console.error("Error in getUserByAccount:", error);
        return null;
      }
    },

    async updateUser(user) {
      const prisma = await getCloudflareClient();
      return prisma.user.update({
        where: { id: user.id },
        data: {
          name: user.name,
          email: user.email,
          // Don't update password here
        },
      });
    },

    async linkAccount(account) {
      try {
        const prisma = await getCloudflareClient();
        await prisma.account.create({
          data: {
            userId: account.userId,
            type: account.type,
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            refresh_token: account.refresh_token,
            access_token: account.access_token,
            expires_at: account.expires_at,
            token_type: account.token_type,
            scope: account.scope,
            id_token: account.id_token,
            session_state: account.session_state,
          },
        });
        return account;
      } catch (error) {
        console.error("Error in linkAccount:", error);
        throw error;
      }
    },

    async createSession(session) {
      const prisma = await getCloudflareClient();
      return prisma.session.create({
        data: {
          userId: session.userId,
          expires: session.expires,
          sessionToken: session.sessionToken,
        },
      });
    },

    async getSessionAndUser(sessionToken) {
      try {
        const prisma = await getCloudflareClient();
        const userAndSession = await prisma.session.findUnique({
          where: { sessionToken },
          include: { user: true },
        });

        if (!userAndSession) return null;

        const { user, ...session } = userAndSession;
        return { user, session };
      } catch (error) {
        console.error("Error in getSessionAndUser:", error);
        return null;
      }
    },

    async updateSession(session) {
      const prisma = await getCloudflareClient();
      return prisma.session.update({
        where: { sessionToken: session.sessionToken },
        data: {
          expires: session.expires,
        },
      });
    },

    async deleteSession(sessionToken) {
      const prisma = await getCloudflareClient();
      await prisma.session.delete({ where: { sessionToken } });
    },

    async createVerificationToken(verificationToken) {
      try {
        const prisma = await getCloudflareClient();
        const newToken = await prisma.verificationToken.create({
          data: {
            identifier: verificationToken.identifier,
            token: verificationToken.token,
            expires: verificationToken.expires,
          },
        });
        return newToken;
      } catch (error) {
        console.error("Error in createVerificationToken:", error);
        throw error;
      }
    },

    async useVerificationToken({ identifier, token }) {
      try {
        const prisma = await getCloudflareClient();
        const verificationToken = await prisma.verificationToken.delete({
          where: { token_identifier: { token, identifier } },
        });
        return verificationToken;
      } catch (error) {
        console.error("Error in useVerificationToken:", error);
        return null;
      }
    },
  };
} 