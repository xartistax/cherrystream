import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

import type { UserRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(72),
});

function isUserRole(value: unknown): value is UserRole {
  return value === "USER" || value === "MODEL" || value === "ADMIN";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
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

      async authorize(credentials) {
        const parsedCredentials = credentialsSchema.safeParse(credentials);

        if (!parsedCredentials.success) {
          return null;
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
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.username = user.username;
        token.role = user.role;

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
        },
      });

      if (!dbUser || dbUser.status !== "ACTIVE") {
        return {};
      }

      token.username = dbUser.username;
      token.role = dbUser.role;

      return token;
    },

    session({ session, token }) {
      if (session.user && typeof token.sub === "string" && typeof token.username === "string" && isUserRole(token.role)) {
        session.user.id = token.sub;
        session.user.username = token.username;
        session.user.role = token.role;
      }

      return session;
    },
  },
});
