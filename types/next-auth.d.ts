import type { DefaultSession } from "next-auth";

import type { UserRole } from "@/generated/prisma/enums";

declare module "next-auth" {
  interface User {
    username: string;
    role: UserRole;
  }

  interface Session {
    user: {
      id: string;
      username: string;
      role: UserRole;
      /** Set while an admin views the app as this user; id/username/role above are the impersonated user. */
      impersonatedBy?: {
        id: string;
        username: string;
      };
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    username?: string;
    role?: UserRole;
  }
}
