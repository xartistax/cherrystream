import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

import type { UserRole } from "@/generated/prisma/enums";
import { IMPERSONATION_MAX_AGE_MS, verifyImpersonationGrant } from "@/lib/impersonation";
import { prisma } from "@/lib/prisma";
import { consumeRateLimit, getClientIp, hashIdentifier } from "@/lib/rate-limit";

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(72),
});

export class LoginRateLimited extends CredentialsSignin {
  code = "rate_limited";
}

function isUserRole(value: unknown): value is UserRole {
  return value === "USER" || value === "MODEL" || value === "ADMIN";
}

type TokenImpersonation = {
  userId: string;
  startedAt: number;
  username?: string;
  role?: UserRole;
};

/** The JWT is an untyped record at runtime, so the impersonation entry is validated before use. */
function readImpersonation(value: unknown): TokenImpersonation | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;

  if (typeof candidate.userId !== "string" || typeof candidate.startedAt !== "number") {
    return null;
  }

  return {
    userId: candidate.userId,
    startedAt: candidate.startedAt,
    username: typeof candidate.username === "string" ? candidate.username : undefined,
    role: isUserRole(candidate.role) ? candidate.role : undefined,
  };
}

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  adapter: PrismaAdapter(prisma),

  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/login",
  },

  providers: [
    Credentials({
      credentials: {
        email: {
          label: "E-Mail",
          type: "email",
        },
        password: {
          label: "Passwort",
          type: "password",
        },
      },

      // Rate limited here and not only in loginAction, because /api/auth/callback/credentials can be called directly.
      async authorize(credentials, request) {
        const parsedCredentials = credentialsSchema.safeParse(credentials);

        if (!parsedCredentials.success) {
          return null;
        }

        const ipHash = hashIdentifier(getClientIp(request.headers));
        const [byIp, byEmail] = await Promise.all([
          consumeRateLimit(`login:ip:${ipHash}`, 20, 15 * 60),
          consumeRateLimit(`login:email:${hashIdentifier(parsedCredentials.data.email)}`, 5, 15 * 60),
        ]);

        if (!byIp.allowed || !byEmail.allowed) {
          throw new LoginRateLimited();
        }

        const user = await prisma.user.findUnique({
          where: {
            email: parsedCredentials.data.email,
          },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            username: true,
            role: true,
            status: true,
            passwordHash: true,
            sessionVersion: true,
          },
        });

        if (!user?.passwordHash || user.status !== "ACTIVE") {
          return null;
        }

        const passwordMatches = await bcrypt.compare(parsedCredentials.data.password, user.passwordHash);

        if (!passwordMatches) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          username: user.username,
          role: user.role,
          sessionVersion: user.sessionVersion,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.username = user.username;
        token.role = user.role;
        token.sessionVersion = user.sessionVersion;
        delete token.impersonation;

        return token;
      }

      if (!token.sub) {
        return token;
      }

      const dbUser = await prisma.user.findUnique({
        where: {
          id: token.sub,
        },
        select: {
          username: true,
          role: true,
          status: true,
          sessionVersion: true,
        },
      });

      // Tokens from before a password reset carry an older sessionVersion and are signed out.
      if (!dbUser || dbUser.status !== "ACTIVE" || dbUser.sessionVersion !== (typeof token.sessionVersion === "number" ? token.sessionVersion : 0)) {
        return {};
      }

      token.username = dbUser.username;
      token.role = dbUser.role;

      if (trigger === "update" && session && typeof session === "object" && "impersonation" in session) {
        const request = (session as { impersonation: unknown }).impersonation;

        if (request === null) {
          delete token.impersonation;
        } else if (dbUser.role === "ADMIN") {
          const grant = request && typeof request === "object" ? (request as { grant?: unknown }).grant : null;
          const targetUserId = verifyImpersonationGrant(grant, token.sub);

          if (targetUserId) {
            token.impersonation = {
              userId: targetUserId,
              startedAt: Date.now(),
            };
          }
        }
      }

      // Re-validated on every request: the admin must still be an admin, the time limit applies,
      // and the target must still be an active non-admin account.
      const impersonation = readImpersonation(token.impersonation);

      if (!impersonation) {
        delete token.impersonation;
      } else {
        const target =
          dbUser.role === "ADMIN" && Date.now() - impersonation.startedAt < IMPERSONATION_MAX_AGE_MS
            ? await prisma.user.findUnique({
                where: {
                  id: impersonation.userId,
                },
                select: {
                  username: true,
                  role: true,
                  status: true,
                },
              })
            : null;

        if (!target || target.status !== "ACTIVE" || target.role === "ADMIN") {
          delete token.impersonation;
        } else {
          token.impersonation = {
            ...impersonation,
            username: target.username,
            role: target.role,
          };
        }
      }

      return token;
    },

    session({ session, token }) {
      if (!session.user || typeof token.sub !== "string" || typeof token.username !== "string" || !isUserRole(token.role)) {
        return session;
      }

      const impersonation = readImpersonation(token.impersonation);

      if (impersonation?.username && impersonation.role) {
        // Everything that reads the session acts as the impersonated user; the real admin stays in impersonatedBy.
        session.user.id = impersonation.userId;
        session.user.username = impersonation.username;
        session.user.role = impersonation.role;
        session.user.impersonatedBy = {
          id: token.sub,
          username: token.username,
        };

        return session;
      }

      session.user.id = token.sub;
      session.user.username = token.username;
      session.user.role = token.role;

      return session;
    },
  },
});
