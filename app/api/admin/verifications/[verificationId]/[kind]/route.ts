import { getAdminAccess } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { readVerificationImage } from "@/lib/verification/storage";

export const dynamic = "force-dynamic";

type RouteParams = {
  params: Promise<{
    verificationId: string;
    kind: string;
  }>;
};

/** Streams a private verification photo to admins only. Never cached, never exposed as a blob URL. */
export async function GET(_request: Request, { params }: RouteParams) {
  const access = await getAdminAccess();

  if (!access.allowed) {
    return new Response(null, { status: 404 });
  }

  const { verificationId, kind } = await params;

  if (kind !== "id-document" && kind !== "selfie") {
    return new Response(null, { status: 404 });
  }

  const verification = await prisma.modelVerification.findUnique({
    where: {
      id: verificationId,
    },
    select: {
      idDocumentPathname: true,
      selfiePathname: true,
    },
  });

  const pathname = kind === "id-document" ? verification?.idDocumentPathname : verification?.selfiePathname;

  if (!pathname) {
    return new Response(null, { status: 404 });
  }

  const blob = await readVerificationImage(pathname);

  if (!blob || blob.statusCode !== 200) {
    return new Response(null, { status: 404 });
  }

  return new Response(blob.stream, {
    headers: {
      "Content-Type": blob.blob.contentType,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
