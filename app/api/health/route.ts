import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Public endpoint for external uptime monitors. Deliberately reveals no details;
 * the full system status is at /admin.
 */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return Response.json(
      {
        status: "ok",
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch {
    return Response.json(
      {
        status: "error",
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
