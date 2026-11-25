import "server-only";

import { readdir } from "node:fs/promises";
import path from "node:path";

import { del, list, put } from "@vercel/blob";
import { execa } from "execa";
import sharp from "sharp";

import { Prisma } from "@/generated/prisma/client";
import { paymentsEnabled } from "@/lib/features";
import { getFfmpegBinaries } from "@/lib/media/video/ffmpeg";
import { prisma } from "@/lib/prisma";
import { urgentReportReasons } from "@/lib/reports/reasons";
import { getStripe } from "@/lib/stripe";
import { getVerificationBlobToken } from "@/lib/verification/storage";
import packageJson from "@/package.json";

export type CheckStatus = "ok" | "warn" | "error" | "disabled";

export type SystemCheck = {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string;
  latencyMs?: number;
};

export type SystemCheckGroup = {
  title: string;
  checks: SystemCheck[];
};

export type DeploymentInfo = Array<{
  label: string;
  value: string;
}>;

const CHECK_TIMEOUT_MS = 5_000;
const HOUR_MS = 60 * 60 * 1000;

type CheckResult = Omit<SystemCheck, "id" | "label" | "latencyMs">;

/** The Neon driver rejects with a WebSocket ErrorEvent instead of an Error when the database is unreachable. */
function describeError(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (error && typeof error === "object") {
    const candidate = error as { message?: unknown; error?: unknown; type?: unknown };

    if (typeof candidate.message === "string" && candidate.message) {
      return candidate.message;
    }

    if (candidate.error instanceof Error && candidate.error.message) {
      return candidate.error.message;
    }

    if (candidate.type === "error") {
      return "Keine Verbindung (WebSocket-Fehler)";
    }
  }

  return "Unbekannter Fehler";
}

/** Runs a check with a timeout and turns thrown errors into an error result, so one failing system never breaks the page. */
async function runCheck(id: string, label: string, check: () => Promise<CheckResult>): Promise<SystemCheck> {
  const startedAt = performance.now();
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    const result = await Promise.race([
      check(),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new Error(`Keine Antwort nach ${CHECK_TIMEOUT_MS / 1000} s`)), CHECK_TIMEOUT_MS);
      }),
    ]);

    return {
      id,
      label,
      latencyMs: Math.round(performance.now() - startedAt),
      ...result,
    };
  } catch (error) {
    return {
      id,
      label,
      status: "error",
      detail: describeError(error),
      latencyMs: Math.round(performance.now() - startedAt),
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function checkDatabase(): Promise<CheckResult> {
  await prisma.$queryRaw`SELECT 1`;

  return {
    status: "ok",
    detail: "Verbindung zu Neon steht",
  };
}

/** Compares the tables in the database with the models of the generated client to catch missing migrations. */
/** Migration folders shipped with this deployment (traced into the /admin function via next.config.ts). */
async function readLocalMigrations(): Promise<string[] | null> {
  try {
    const entries = await readdir(path.join(process.cwd(), "prisma", "migrations"), {
      withFileTypes: true,
    });

    return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  } catch {
    return null;
  }
}

async function checkSchema(): Promise<CheckResult> {
  const [tables, migrations, localMigrations] = await Promise.all([
    prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name::text AS table_name FROM information_schema.tables WHERE table_schema = current_schema()
    `,
    prisma.$queryRaw<Array<{ migration_name: string; finished_at: Date | null; rolled_back_at: Date | null }>>`
      SELECT migration_name, finished_at, rolled_back_at FROM _prisma_migrations
    `,
    readLocalMigrations(),
  ]);

  const failedMigrations = migrations.filter((migration) => !migration.finished_at && !migration.rolled_back_at);

  if (failedMigrations.length > 0) {
    return {
      status: "error",
      detail: `Fehlgeschlagene Migration: ${failedMigrations.map((migration) => migration.migration_name).join(", ")}`,
    };
  }

  // Catches pending migrations that only add columns, which the table comparison below cannot see.
  if (localMigrations) {
    const applied = new Set(migrations.filter((migration) => migration.finished_at).map((migration) => migration.migration_name));
    const pending = localMigrations.filter((name) => !applied.has(name));

    if (pending.length > 0) {
      return {
        status: "error",
        detail: `Migration ausstehend: ${pending.join(", ")}. Ausführen: pnpm prisma migrate deploy`,
      };
    }
  }

  const existingTables = new Set(tables.map((table) => table.table_name));
  const missingTables = Object.values(Prisma.ModelName).filter((model) => !existingTables.has(model));

  if (missingTables.length > 0) {
    return {
      status: "error",
      detail: `Tabellen fehlen (Migration ausstehend): ${missingTables.join(", ")}`,
    };
  }

  return {
    status: "ok",
    detail: localMigrations
      ? `${localMigrations.length} Migrationen angewendet, ${Object.values(Prisma.ModelName).length} Tabellen vorhanden`
      : `${Object.values(Prisma.ModelName).length} Tabellen vorhanden (Migrationsordner nicht verfügbar)`,
  };
}

async function checkPublicBlobStore(): Promise<CheckResult> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (!token) {
    return {
      status: "error",
      detail: "BLOB_READ_WRITE_TOKEN fehlt",
    };
  }

  await list({
    token,
    limit: 1,
  });

  return {
    status: "ok",
    detail: "Medien-Store erreichbar",
  };
}

/** Writes and deletes a tiny private blob, because listing alone does not prove that private uploads are accepted. */
async function checkPrivateBlobStore(): Promise<CheckResult> {
  const token = getVerificationBlobToken();

  const probe = await put(`health/probe-${crypto.randomUUID()}.txt`, "ok", {
    access: "private",
    token,
    contentType: "text/plain",
  });

  await del(probe.pathname, {
    token,
  });

  if (!process.env.VERIFICATION_BLOB_READ_WRITE_TOKEN) {
    return {
      status: "warn",
      detail: "Private Uploads funktionieren, aber es ist kein separater Store für Ausweise konfiguriert (VERIFICATION_BLOB_READ_WRITE_TOKEN)",
    };
  }

  return {
    status: "ok",
    detail: "Privater Store für Ausweise akzeptiert private Uploads",
  };
}

async function checkEnvironment(): Promise<CheckResult> {
  const missing = ["DATABASE_URL", "AUTH_SECRET", "BLOB_READ_WRITE_TOKEN"].filter((name) => !process.env[name]);

  if (missing.length > 0) {
    return {
      status: "error",
      detail: `Fehlt: ${missing.join(", ")}`,
    };
  }

  if ((process.env.AUTH_SECRET?.length ?? 0) < 32) {
    return {
      status: "error",
      detail: "AUTH_SECRET ist kürzer als 32 Zeichen",
    };
  }

  if (!process.env.NEXT_PUBLIC_APP_URL) {
    return {
      status: "warn",
      detail: "NEXT_PUBLIC_APP_URL fehlt (wird für Links und Stripe benötigt)",
    };
  }

  return {
    status: "ok",
    detail: "Alle Pflichtvariablen gesetzt",
  };
}

async function readBinaryVersion(binaryPath: string): Promise<string> {
  const { stdout } = await execa(binaryPath, ["-version"]);
  const firstLine = stdout.split("\n")[0] ?? "";

  return firstLine.match(/version\s+(\S+)/)?.[1] ?? "unbekannt";
}

/** Checks the Resend configuration and, with a full-access key, whether the sender domain is verified. */
async function checkEmail(): Promise<CheckResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    return {
      status: process.env.VERCEL_ENV === "production" ? "error" : "warn",
      detail: "RESEND_API_KEY oder EMAIL_FROM fehlt. Mails werden nur in der Server-Konsole ausgegeben",
    };
  }

  const senderDomain = from.match(/@([^>\s]+)/)?.[1]?.toLowerCase();

  // Resend's shared test sender works without own domain, but only delivers to the account owner's address.
  if (senderDomain === "resend.dev") {
    return {
      status: process.env.VERCEL_ENV === "production" ? "error" : "warn",
      detail: "Testmodus (onboarding@resend.dev): Mails gehen nur an die Adresse deines Resend-Kontos. Für den Livegang eigene Domain verifizieren",
    };
  }

  const response = await fetch("https://api.resend.com/domains", {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    cache: "no-store",
  });

  const body = (await response.json().catch(() => null)) as { name?: string; message?: string; data?: Array<{ name: string; status: string }> } | null;

  // Sending-only keys may not list domains; the key itself is accepted.
  if (body?.name === "restricted_api_key") {
    return {
      status: "ok",
      detail: `Konfiguriert (Absender ${from}). Domain-Status mit diesem Sende-Schlüssel nicht prüfbar`,
    };
  }

  if (!response.ok) {
    return {
      status: "error",
      detail: `Resend lehnt den API-Key ab: ${body?.message ?? `HTTP ${response.status}`}`,
    };
  }

  const domain = body?.data?.find((candidate) => candidate.name.toLowerCase() === senderDomain);

  if (!domain) {
    return {
      status: "error",
      detail: `Absender-Domain ${senderDomain ?? "?"} ist bei Resend nicht angelegt`,
    };
  }

  return domain.status === "verified"
    ? {
        status: "ok",
        detail: `Domain ${domain.name} verifiziert, Absender ${from}`,
      }
    : {
        status: "error",
        detail: `Domain ${domain.name} ist noch nicht verifiziert (${domain.status}). DNS-Einträge prüfen`,
      };
}

async function checkErrorTracking(): Promise<CheckResult> {
  const server = Boolean(process.env.SENTRY_DSN);
  const client = Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN);

  if (server && client) {
    return {
      status: "ok",
      detail: "Sentry aktiv für Server und Browser",
    };
  }

  return {
    status: process.env.VERCEL_ENV === "production" ? "warn" : "disabled",
    detail: server || client ? `Sentry nur für ${server ? "Server" : "Browser"} konfiguriert` : "Sentry nicht konfiguriert (SENTRY_DSN, NEXT_PUBLIC_SENTRY_DSN)",
  };
}

async function checkFfmpeg(): Promise<CheckResult> {
  const { ffmpegPath, ffprobePath } = await getFfmpegBinaries();
  const [ffmpegVersion, ffprobeVersion] = await Promise.all([readBinaryVersion(ffmpegPath), readBinaryVersion(ffprobePath)]);

  return {
    status: "ok",
    detail: `ffmpeg ${ffmpegVersion}, ffprobe ${ffprobeVersion}`,
  };
}

async function checkSharp(): Promise<CheckResult> {
  await sharp({
    create: {
      width: 1,
      height: 1,
      channels: 3,
      background: "#000000",
    },
  })
    .webp()
    .toBuffer();

  return {
    status: "ok",
    detail: `sharp ${sharp.versions.sharp}, libvips ${sharp.versions.vips}`,
  };
}

async function checkStripeApi(): Promise<CheckResult> {
  if (!paymentsEnabled) {
    return {
      status: "disabled",
      detail: "Zahlungen sind deaktiviert (NEXT_PUBLIC_PAYMENTS_ENABLED)",
    };
  }

  const balance = await getStripe().balance.retrieve();

  return {
    status: balance.livemode ? "ok" : "warn",
    detail: balance.livemode ? "API erreichbar (Live-Modus)" : "API erreichbar, aber im Testmodus",
  };
}

async function checkStripeWebhook(): Promise<CheckResult> {
  if (!paymentsEnabled) {
    return {
      status: "disabled",
      detail: "Zahlungen sind deaktiviert",
    };
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return {
      status: "error",
      detail: "STRIPE_WEBHOOK_SECRET fehlt, Zahlungen würden nicht gutgeschrieben",
    };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!appUrl) {
    return {
      status: "warn",
      detail: "NEXT_PUBLIC_APP_URL fehlt, Webhook-URL kann nicht geprüft werden",
    };
  }

  const expectedUrl = new URL("/api/stripe/webhook", appUrl).toString();
  const endpoints = await getStripe().webhookEndpoints.list({
    limit: 100,
  });

  const endpoint = endpoints.data.find((candidate) => candidate.url === expectedUrl);

  if (!endpoint) {
    return {
      status: "error",
      detail: `Kein Webhook bei Stripe für ${expectedUrl} registriert`,
    };
  }

  if (endpoint.status !== "enabled") {
    return {
      status: "error",
      detail: `Webhook ist bei Stripe deaktiviert (${endpoint.status})`,
    };
  }

  const handlesCheckout = endpoint.enabled_events.includes("*") || endpoint.enabled_events.includes("checkout.session.completed");

  if (!handlesCheckout) {
    return {
      status: "error",
      detail: "Webhook empfängt checkout.session.completed nicht",
    };
  }

  return {
    status: "ok",
    detail: "Webhook registriert und aktiv",
  };
}

async function checkPendingVerifications(): Promise<CheckResult> {
  const [count, oldest] = await Promise.all([
    prisma.modelVerification.count({
      where: {
        status: "PENDING",
      },
    }),
    prisma.modelVerification.findFirst({
      where: {
        status: "PENDING",
      },
      orderBy: {
        submittedAt: "asc",
      },
      select: {
        submittedAt: true,
      },
    }),
  ]);

  if (count === 0 || !oldest) {
    return {
      status: "ok",
      detail: "Keine offenen Verifizierungen",
    };
  }

  const waitingHours = Math.floor((Date.now() - oldest.submittedAt.getTime()) / HOUR_MS);

  return {
    status: waitingHours >= 48 ? "warn" : "ok",
    detail: `${count} offen, älteste wartet seit ${waitingHours} h`,
  };
}

async function checkUnpurgedDocuments(): Promise<CheckResult> {
  const count = await prisma.modelVerification.count({
    where: {
      documentsDeletedAt: null,
      OR: [
        {
          status: {
            not: "PENDING",
          },
        },
        {
          user: {
            status: "DELETED",
          },
        },
      ],
    },
  });

  return count === 0
    ? {
        status: "ok",
        detail: "Alle geprüften Ausweisdokumente sind gelöscht",
      }
    : {
        status: "warn",
        detail: `${count} geprüfte Verifizierung(en) mit noch gespeicherten Ausweisfotos`,
      };
}

async function checkMediaPipeline(): Promise<CheckResult> {
  const [failed, stuck] = await Promise.all([
    prisma.postMedia.count({
      where: {
        status: "FAILED",
      },
    }),
    prisma.postMedia.count({
      where: {
        status: "PROCESSING",
        createdAt: {
          lt: new Date(Date.now() - HOUR_MS),
        },
      },
    }),
  ]);

  if (failed === 0 && stuck === 0) {
    return {
      status: "ok",
      detail: "Keine fehlgeschlagenen oder hängenden Uploads",
    };
  }

  return {
    status: "warn",
    detail: `${failed} fehlgeschlagen, ${stuck} hängen seit über 1 h in Verarbeitung`,
  };
}

/** The cron leaves no trace of its own, so expired invites that are still there show that it is not running. */
async function checkCleanupJob(): Promise<CheckResult> {
  if (!process.env.CRON_SECRET) {
    return {
      status: process.env.VERCEL_ENV === "production" ? "error" : "warn",
      detail: "CRON_SECRET fehlt, der tägliche Cleanup wird abgewiesen",
    };
  }

  const [openInvites, staleInvites] = await Promise.all([
    prisma.modelInvite.count({
      where: {
        status: "OPEN",
        expiresAt: {
          gt: new Date(),
        },
      },
    }),
    prisma.modelInvite.count({
      where: {
        status: "OPEN",
        expiresAt: {
          lt: new Date(Date.now() - 48 * HOUR_MS),
        },
      },
    }),
  ]);

  if (staleInvites > 0) {
    return {
      status: "warn",
      detail: `${staleInvites} seit über 2 Tagen abgelaufene Einladung(en) nicht gelöscht, der Cleanup läuft offenbar nicht`,
    };
  }

  return {
    status: "ok",
    detail: `${openInvites} offene Einladung(en), keine überfälligen Daten`,
  };
}

/** Card networks expect reported content to be reviewed promptly; urgent reasons older than 24 h are an error. */
async function checkOpenReports(): Promise<CheckResult> {
  const reports = await prisma.report.findMany({
    where: {
      status: "OPEN",
    },
    select: {
      reason: true,
      createdAt: true,
    },
  });

  if (reports.length === 0) {
    return {
      status: "ok",
      detail: "Keine offenen Meldungen",
    };
  }

  const now = Date.now();
  const urgent = reports.filter((report) => urgentReportReasons.includes(report.reason));
  const oldestUrgentHours = urgent.length > 0 ? Math.floor((now - Math.min(...urgent.map((report) => report.createdAt.getTime()))) / HOUR_MS) : 0;
  const oldestHours = Math.floor((now - Math.min(...reports.map((report) => report.createdAt.getTime()))) / HOUR_MS);

  const detail = `${reports.length} offen${urgent.length > 0 ? `, davon ${urgent.length} dringend` : ""}, älteste seit ${oldestHours} h`;

  if (urgent.length > 0 && oldestUrgentHours >= 24) {
    return {
      status: "error",
      detail,
    };
  }

  return {
    status: urgent.length > 0 || oldestHours >= 72 ? "warn" : "ok",
    detail,
  };
}

async function checkActivity(): Promise<CheckResult> {
  const since = new Date(Date.now() - 24 * HOUR_MS);

  const [newUsers, activeModels, pendingModels] = await Promise.all([
    prisma.user.count({
      where: {
        createdAt: {
          gte: since,
        },
      },
    }),
    prisma.user.count({
      where: {
        role: "MODEL",
        modelStatus: "ACTIVE",
        status: "ACTIVE",
      },
    }),
    prisma.user.count({
      where: {
        role: "MODEL",
        modelStatus: "PENDING",
        status: "ACTIVE",
      },
    }),
  ]);

  return {
    status: "ok",
    detail: `${newUsers} neue Konten (24 h), ${activeModels} aktive Models, ${pendingModels} in Prüfung`,
  };
}

export async function getSystemStatus(): Promise<SystemCheckGroup[]> {
  const [database, schema, publicBlob, privateBlob, environment, email, errorTracking, ffmpeg, sharpCheck, stripeApi, stripeWebhook, verifications, reports, documents, cleanup, media, activity] =
    await Promise.all([
      runCheck("database", "Datenbank", checkDatabase),
      runCheck("schema", "Datenbankschema", checkSchema),
      runCheck("blob-public", "Blob-Store Medien", checkPublicBlobStore),
      runCheck("blob-private", "Blob-Store Ausweise (privat)", checkPrivateBlobStore),
      runCheck("environment", "Umgebungsvariablen", checkEnvironment),
      runCheck("email", "E-Mail-Versand (Resend)", checkEmail),
      runCheck("error-tracking", "Error-Tracking (Sentry)", checkErrorTracking),
      runCheck("ffmpeg", "FFmpeg / FFprobe", checkFfmpeg),
      runCheck("sharp", "Bildverarbeitung (sharp)", checkSharp),
      runCheck("stripe-api", "Stripe API", checkStripeApi),
      runCheck("stripe-webhook", "Stripe Webhook", checkStripeWebhook),
      runCheck("verifications", "Offene Verifizierungen", checkPendingVerifications),
      runCheck("reports", "Offene Meldungen", checkOpenReports),
      runCheck("documents", "Löschung Ausweisdokumente", checkUnpurgedDocuments),
      runCheck("cleanup", "Cleanup-Job und Einladungen", checkCleanupJob),
      runCheck("media", "Medien-Uploads", checkMediaPipeline),
      runCheck("activity", "Aktivität", checkActivity),
    ]);

  return [
    {
      title: "Infrastruktur",
      checks: [database, schema, publicBlob, privateBlob, environment, email, errorTracking],
    },
    {
      title: "Medienverarbeitung",
      checks: [ffmpeg, sharpCheck],
    },
    {
      title: "Zahlungen",
      checks: [stripeApi, stripeWebhook],
    },
    {
      title: "Betrieb",
      checks: [verifications, reports, documents, cleanup, media, activity],
    },
  ];
}

export function getDeploymentInfo(): DeploymentInfo {
  const commitSha = process.env.VERCEL_GIT_COMMIT_SHA;

  return [
    {
      label: "Version",
      value: packageJson.version,
    },
    {
      label: "Umgebung",
      value: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unbekannt",
    },
    {
      label: "Commit",
      value: commitSha ? `${commitSha.slice(0, 7)} (${process.env.VERCEL_GIT_COMMIT_REF ?? "?"})` : "lokal",
    },
    {
      label: "Region",
      value: process.env.VERCEL_REGION ?? "lokal",
    },
    {
      label: "Node.js",
      value: process.version,
    },
    {
      label: "Zahlungen",
      value: paymentsEnabled ? "aktiviert" : "deaktiviert",
    },
  ];
}
