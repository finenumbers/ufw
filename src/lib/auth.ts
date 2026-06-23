import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError } from "better-auth/api";
import { createAuthMiddleware } from "better-auth/api";

import { db } from "@/lib/db";
import { getAuthSecret } from "@/lib/env";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  secret: getAuthSecret(),
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 10,
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-up/email") {
        return;
      }

      const userCount = await db.user.count();
      if (userCount > 0) {
        throw new APIError("FORBIDDEN", {
          message: "Registration is disabled after initial setup",
        });
      }
    }),
  },
  databaseHooks: {
    user: {
      create: {
        before: async () => {
          const userCount = await db.user.count();
          if (userCount > 0) {
            return false;
          }
        },
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
