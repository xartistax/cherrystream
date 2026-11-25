import { differenceInYears, format } from "date-fns";
import { de } from "date-fns/locale";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { VerificationReviewForms } from "@/components/admin/verification-review-forms";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type AdminVerificationPageProps = {
  params: Promise<{
    verificationId: string;
  }>;
};

export default async function AdminVerificationPage({ params }: AdminVerificationPageProps) {
  const { verificationId } = await params;

  const verification = await prisma.modelVerification.findUnique({
    where: {
      id: verificationId,
    },
    select: {
      id: true,
      status: true,
      challengeCode: true,
      submittedAt: true,
      idDocumentPathname: true,
      selfiePathname: true,
      user: {
        select: {
          username: true,
          email: true,
          createdAt: true,
          profile: {
            select: {
              displayName: true,
              birthDate: true,
              city: {
                select: {
                  name: true,
                },
              },
              canton: {
                select: {
                  name: true,
                },
              },
            },
          },
          _count: {
            select: {
              modelVerifications: true,
            },
          },
        },
      },
    },
  });

  if (!verification) {
    notFound();
  }

  const { user } = verification;
  const statedAge = user.profile?.birthDate ? differenceInYears(new Date(), user.profile.birthDate) : null;

  const facts = [
    { label: "Name im Profil", value: user.profile?.displayName ?? "–" },
    { label: "Benutzername", value: `@${user.username}` },
    { label: "E-Mail", value: user.email },
    {
      label: "Geburtsdatum im Profil",
      value: user.profile?.birthDate ? `${format(user.profile.birthDate, "d. MMMM yyyy", { locale: de })} (${statedAge} Jahre)` : "nicht angegeben",
    },
    { label: "Ort", value: [user.profile?.city?.name, user.profile?.canton?.name].filter(Boolean).join(", ") || "–" },
    { label: "Konto erstellt", value: format(user.createdAt, "d. MMMM yyyy", { locale: de }) },
    { label: "Versuch", value: `${user._count.modelVerifications}` },
    { label: "Eingereicht", value: format(verification.submittedAt, "d. MMMM yyyy, HH:mm", { locale: de }) },
  ];

  return (
    <div className="space-y-6">
      <Link href="/admin/verifications" className={cn(buttonVariants({ variant: "ghost" }), "-ml-4")}>
        <ArrowLeft className="mr-2 size-4" />
        Alle Verifizierungen
      </Link>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          {verification.idDocumentPathname && verification.selfiePathname ? (
            <div className="grid gap-4 md:grid-cols-2">
              {(["id-document", "selfie"] as const).map((kind) => (
                <figure key={kind} className="space-y-2">
                  <figcaption className="text-sm text-zinc-400">{kind === "id-document" ? "Ausweis" : "Selfie mit Code"}</figcaption>

                  <a href={`/api/admin/verifications/${verification.id}/${kind}`} target="_blank" rel="noreferrer" className="block">
                    {/* Private, admin-only route; next/image would cache it in the optimizer. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/admin/verifications/${verification.id}/${kind}`}
                      alt={kind === "id-document" ? "Ausweis" : "Selfie"}
                      className="w-full rounded-2xl border border-white/10 bg-black object-contain"
                    />
                  </a>
                </figure>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-white/10 p-6 text-sm text-zinc-500">Die Dokumente wurden nach der Prüfung gelöscht.</p>
          )}

          {verification.status === "PENDING" ? (
            <VerificationReviewForms verificationId={verification.id} />
          ) : (
            <p className="text-sm text-zinc-400">Diese Verifizierung wurde bereits {verification.status === "APPROVED" ? "freigegeben" : "abgelehnt"}.</p>
          )}
        </div>

        <aside className="space-y-4">
          <Card className="border-amber-500/20 bg-amber-500/10 text-white">
            <CardContent className="p-5">
              <p className="text-sm text-amber-100/80">Erwarteter Code auf dem Selfie</p>

              <p className="mt-2 font-mono text-3xl font-black tracking-[0.3em]">{verification.challengeCode}</p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-zinc-900/70 text-white">
            <CardContent className="p-5">
              <dl className="space-y-3">
                {facts.map((fact) => (
                  <div key={fact.label}>
                    <dt className="text-xs text-zinc-500">{fact.label}</dt>

                    <dd className="mt-0.5 text-sm break-words">{fact.value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>

          {statedAge !== null && statedAge < 18 ? (
            <p className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">
              Achtung: Das Geburtsdatum im Profil ergibt unter 18 Jahre.
            </p>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
