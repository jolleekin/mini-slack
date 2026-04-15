import * as schema from "@mini-slack/db/index.ts";
import { generateRandomId } from "@mini-slack/id-gen/index.ts";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAuthMiddleware } from "better-auth/api";
import { betterAuth } from "better-auth/minimal";
import { magicLink } from "better-auth/plugins";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db.ts";
import { sendMail } from "@/lib/mail.ts";

/**
 * Server-side Better Auth instance.
 */
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID ?? "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
    },
  },
  advanced: {
    database: {
      generateId: generateRandomId,
    },
  },
  verification: {
    storeIdentifier: "hashed",
  },
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        await sendMail({
          to: email,
          subject: "Sign in to MiniSlack",
          html: `
            <div>
              <h1>Welcome to MiniSlack!</h1>
              <p>Click the link below to sign in:</p>
              <a href="${url}">Sign In</a>
              <p>If you didn't request this, you can safely ignore this email.</p>
            </div>
          `,
        });
      },
    }),
  ],
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      if (
        ctx.path === "/magic-link/verify" ||
        ctx.path.startsWith("/callback")
      ) {
        const session = ctx.context.session;
        if (session) {
          const members = await db
            .select()
            .from(schema.workspaceMembers)
            .where(eq(schema.workspaceMembers.userId, session.user.id));

          if (members.length === 0) throw ctx.redirect("/welcome");
        }
      }
    }),
  },
});
