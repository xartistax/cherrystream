import "./seed/env";

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { createInterface } from "node:readline/promises";

import { put } from "@vercel/blob";
import bcrypt from "bcryptjs";
import sharp from "sharp";

import type { ContactChannel, ModelStatus, UserRole } from "@/generated/prisma/enums";
import { syncProfileImage } from "@/lib/gallery/profile-image";
import { createInviteToken, getInviteExpiry, getInviteUrl } from "@/lib/invites/token";
import { processImage } from "@/lib/media/image";
import { storeProcessedImage } from "@/lib/media/process-uploaded-image";
import { prisma } from "@/lib/prisma";
import { getChallengeCode } from "@/lib/verification/challenge";
import { verificationBlobOptions } from "@/lib/verification/storage";

import { demoCreators, type CreatorSeed } from "./seed/creators";

/**
 * Demo data for local testing: demo models (with photos from prisma/seed/images), fixed test logins
 * and sample entries for the admin queues. Idempotent; refuses to run in production.
 *
 * Usage: pnpm seed:demo [--yes]
 */

const IMAGES_DIR = path.join(process.cwd(), "prisma", "seed", "images");
const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);
const DEMO_PASSWORD = process.env.SEED_PASSWORD || "CherryDemo2026!";
const DEMO_SOURCE_NOTE = "seed:demo";
const DEMO_REPORT_PREFIX = "[Demo]";

type AccountSeed = {
  username: string;
  email: string;
  name: string;
  role: UserRole;
  modelStatus: ModelStatus;
  profile: Omit<CreatorSeed, "username" | "email" | "name"> | null;
};

const testAccounts: AccountSeed[] = [
  {
    username: "admin_demo",
    email: "admin@cherrystream.test",
    name: "Admin Demo",
    role: "ADMIN",
    modelStatus: "NONE",
    profile: null,
  },
  {
    username: "model_demo",
    email: "model@cherrystream.test",
    name: "Model Demo",
    role: "MODEL",
    modelStatus: "ACTIVE",
    profile: {
      displayName: "Model Demo",
      bio: "<p>Freigegebenes Test-Model. Melde dich mit model@cherrystream.test an, um das Dashboard zu testen.</p>",
      gender: "WOMAN",
      cantonSlug: "zh",
      cityName: "Zürich",
      categorySlugs: ["lifestyle"],
      verified: true,
      phoneNumber: "+41 79 000 20 01",
      phoneEnabled: true,
      whatsappEnabled: true,
      preferredContact: "WHATSAPP",
      contactNote: null,
      instagram: null,
      instagramEnabled: false,
    },
  },
  {
    username: "pending_demo",
    email: "pending@cherrystream.test",
    name: "Pending Demo",
    role: "MODEL",
    modelStatus: "PENDING",
    profile: {
      displayName: "Pending Demo",
      bio: "<p>Model in Prüfung. Die zugehörige Verifizierung liegt in der Admin-Warteschlange.</p>",
      gender: "WOMAN",
      cantonSlug: "be",
      cityName: "Bern",
      categorySlugs: ["fashion"],
      verified: false,
      phoneNumber: "+41 79 000 20 02",
      phoneEnabled: false,
      whatsappEnabled: true,
      preferredContact: "WHATSAPP",
      contactNote: null,
      instagram: null,
      instagramEnabled: false,
    },
  },
  {
    username: "user_demo",
    email: "user@cherrystream.test",
    name: "User Demo",
    role: "USER",
    modelStatus: "NONE",
    profile: null,
  },
];

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase();
}

async function confirmTarget(): Promise<void> {
  if (process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production") {
    throw new Error("Die Demo-Seed läuft nicht in Production.");
  }

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL fehlt.");
  }

  console.log(`\nZiel-Datenbank: ${new URL(databaseUrl).host}`);
  console.log("Es werden Demo-Konten, Demo-Profile, Fotos und Test-Einträge angelegt.\n");

  if (process.argv.includes("--yes")) {
    return;
  }

  const readline = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const answer = await readline.question("Ist das eine Entwicklungs-Datenbank? Fortfahren? (j/N) ");
  readline.close();

  if (!["j", "ja", "y", "yes"].includes(answer.trim().toLowerCase())) {
    throw new Error("Abgebrochen.");
  }
}

async function upsertAccount(account: AccountSeed, passwordHash: string, locations: Awaited<ReturnType<typeof loadLocations>>): Promise<string> {
  const profile = account.profile;

  const city = profile
    ? (locations.cities.find((candidate) => candidate.cantonSlug === profile.cantonSlug && normalize(candidate.name) === normalize(profile.cityName)) ??
      locations.cities.find((candidate) => candidate.cantonSlug === profile.cantonSlug))
    : undefined;

  if (profile && !city) {
    console.warn(`  ⚠ ${account.username}: keine Stadt im Kanton ${profile.cantonSlug}, Profil ohne Ort.`);
  }

  const categoryIds = profile ? profile.categorySlugs.map((slug) => locations.categoryIds.get(slug)).filter((id): id is string => Boolean(id)) : [];

  const profileData = profile
    ? {
        displayName: profile.displayName,
        bio: profile.bio.trim(),
        gender: profile.gender,
        isPublic: true,
        verified: profile.verified,
        cantonId: city?.cantonId ?? null,
        cityId: city?.id ?? null,
        phoneNumber: profile.phoneNumber,
        phoneEnabled: profile.phoneEnabled,
        whatsappEnabled: profile.whatsappEnabled,
        instagram: profile.instagram,
        instagramEnabled: profile.instagramEnabled,
        preferredContact: profile.preferredContact as ContactChannel | null,
        contactNote: profile.contactNote,
      }
    : {
        displayName: account.name,
      };

  const user = await prisma.user.upsert({
    where: {
      username: account.username,
    },
    create: {
      username: account.username,
      email: account.email,
      name: account.name,
      passwordHash,
      role: account.role,
      modelStatus: account.modelStatus,
      status: "ACTIVE",
      emailVerified: new Date(),
      wallet: {
        create: {},
      },
      profile: {
        create: {
          ...profileData,
          birthDate: new Date("1995-06-15T00:00:00.000Z"),
        },
      },
    },
    update: {
      email: account.email,
      name: account.name,
      passwordHash,
      role: account.role,
      modelStatus: account.modelStatus,
      status: "ACTIVE",
      profile: {
        upsert: {
          create: profileData,
          update: profileData,
        },
      },
    },
    select: {
      id: true,
      profile: {
        select: {
          id: true,
        },
      },
    },
  });

  if (user.profile) {
    await prisma.profileCategory.deleteMany({
      where: {
        profileId: user.profile.id,
      },
    });

    if (categoryIds.length > 0) {
      await prisma.profileCategory.createMany({
        data: categoryIds.map((categoryId) => ({
          profileId: user.profile!.id,
          categoryId,
        })),
        skipDuplicates: true,
      });
    }
  }

  return user.id;
}

async function loadLocations() {
  const [cities, categories] = await Promise.all([
    prisma.city.findMany({
      select: {
        id: true,
        name: true,
        cantonId: true,
        canton: {
          select: {
            slug: true,
          },
        },
      },
    }),
    prisma.category.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        slug: true,
      },
    }),
  ]);

  if (cities.length === 0 || categories.length === 0) {
    throw new Error("Stammdaten fehlen. Bitte zuerst `pnpm seed` ausführen.");
  }

  return {
    cities: cities.map((city) => ({ ...city, cantonSlug: city.canton.slug })),
    categoryIds: new Map(categories.map((category) => [category.slug, category.id])),
  };
}

/**
 * Files named after a username (`mia_zurich.jpg`, `mia_zurich-2.jpg`) belong to that model.
 * All other files are shared out so every model without own files gets at least one photo.
 */
async function assignImages(usernames: string[]): Promise<Map<string, string[]>> {
  let files: string[] = [];

  try {
    files = (await readdir(IMAGES_DIR)).filter((file) => IMAGE_EXTENSIONS.has(path.extname(file).toLowerCase())).sort();
  } catch {
    return new Map();
  }

  const known = new Set(usernames);
  const assigned = new Map<string, string[]>(usernames.map((username) => [username, []]));
  const pool: string[] = [];

  for (const file of files) {
    const owner = path.parse(file).name.replace(/-\d+$/, "");

    if (known.has(owner)) {
      assigned.get(owner)!.push(file);
    } else {
      pool.push(file);
    }
  }

  if (pool.length > 0) {
    const withoutOwn = usernames.filter((username) => assigned.get(username)!.length === 0);

    withoutOwn.forEach((username, index) => {
      assigned.get(username)!.push(pool[index % pool.length]);
    });

    // Pool files beyond one per model are spread as additional photos.
    pool.slice(withoutOwn.length).forEach((file, index) => {
      const target = usernames[index % usernames.length];

      if (!assigned.get(target)!.includes(file)) {
        assigned.get(target)!.push(file);
      }
    });
  }

  return assigned;
}

async function seedImages(userId: string, files: string[]): Promise<number> {
  let created = 0;

  for (const file of files) {
    const processed = await processImage(await readFile(path.join(IMAGES_DIR, file)));

    // Same photo for the same model again (re-run) is skipped.
    const existing = await prisma.postMedia.findFirst({
      where: {
        checksum: processed.checksum,
        post: {
          authorId: userId,
        },
      },
      select: {
        id: true,
      },
    });

    if (existing) {
      continue;
    }

    const { media } = await storeProcessedImage(processed, userId);

    await prisma.post.create({
      data: {
        authorId: userId,
        visibility: "PUBLIC",
        media: {
          create: {
            ...media,
            sortOrder: 0,
          },
        },
      },
    });

    created += 1;
  }

  // Same rule as real uploads: the first image becomes the profile picture.
  await syncProfileImage(userId);

  return created;
}

async function createPlaceholderDocument(title: string, subtitle: string): Promise<Buffer> {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800">
      <rect width="100%" height="100%" fill="#1f2937"/>
      <rect x="40" y="40" width="1120" height="720" rx="32" fill="none" stroke="#f43f5e" stroke-width="8" stroke-dasharray="24 16"/>
      <text x="600" y="380" font-family="sans-serif" font-size="72" font-weight="700" fill="#ffffff" text-anchor="middle">${title}</text>
      <text x="600" y="470" font-family="sans-serif" font-size="40" fill="#fda4af" text-anchor="middle">${subtitle}</text>
    </svg>`;

  return sharp(Buffer.from(svg)).jpeg({ quality: 85 }).toBuffer();
}

async function seedPendingVerification(userId: string): Promise<string> {
  const existing = await prisma.modelVerification.findFirst({
    where: {
      userId,
    },
    select: {
      id: true,
    },
  });

  if (existing) {
    return "bereits vorhanden";
  }

  const challengeCode = getChallengeCode(userId, 0);
  const blobOptions = verificationBlobOptions();

  const [idDocument, selfie] = await Promise.all([
    createPlaceholderDocument("DEMO-AUSWEIS", "Kein echtes Dokument"),
    createPlaceholderDocument("DEMO-SELFIE", `Code: ${challengeCode}`),
  ]);

  const [idBlob, selfieBlob] = await Promise.all([
    put(`verifications/${userId}/id-document.jpg`, idDocument, { access: "private", ...blobOptions, contentType: "image/jpeg", addRandomSuffix: true }),
    put(`verifications/${userId}/selfie.jpg`, selfie, { access: "private", ...blobOptions, contentType: "image/jpeg", addRandomSuffix: true }),
  ]);

  await prisma.modelVerification.create({
    data: {
      userId,
      challengeCode,
      idDocumentPathname: idBlob.pathname,
      selfiePathname: selfieBlob.pathname,
    },
  });

  return "angelegt";
}

async function seedInvite(adminId: string): Promise<string> {
  await prisma.modelInvite.deleteMany({
    where: {
      sourceNote: DEMO_SOURCE_NOTE,
      status: "OPEN",
    },
  });

  const { token, tokenHash } = createInviteToken();

  await prisma.modelInvite.create({
    data: {
      tokenHash,
      expiresAt: getInviteExpiry(),
      displayName: "Demo Einladung",
      bio: "Dieses Profil wurde von der Demo-Seed vorbereitet.\n\nÜbernimm es mit einem neuen Konto, um den Ablauf zu testen.",
      phoneNumber: "+41790002099",
      whatsappEnabled: true,
      categoryIds: [],
      sourceNote: DEMO_SOURCE_NOTE,
      createdById: adminId,
    },
  });

  return getInviteUrl(token);
}

async function seedReports(userIds: Map<string, string>): Promise<number> {
  const existing = await prisma.report.count({
    where: {
      details: {
        startsWith: DEMO_REPORT_PREFIX,
      },
    },
  });

  if (existing > 0) {
    return 0;
  }

  const samples = [
    { username: "sophia_luxe", reason: "FAKE_PROFILE" as const, details: `${DEMO_REPORT_PREFIX} Die Fotos tauchen auch auf einer anderen Seite auf.` },
    { username: "luna_relax", reason: "MINOR" as const, details: `${DEMO_REPORT_PREFIX} Dringende Beispielmeldung, um die Hervorhebung zu testen.` },
  ];

  let created = 0;

  for (const sample of samples) {
    const reportedUserId = userIds.get(sample.username);

    if (!reportedUserId) {
      continue;
    }

    await prisma.report.create({
      data: {
        reportedUserId,
        reason: sample.reason,
        details: sample.details,
        reporterHash: "seed-demo",
      },
    });

    created += 1;
  }

  return created;
}

async function main(): Promise<void> {
  await confirmTarget();

  const locations = await loadLocations();
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const userIds = new Map<string, string>();

  console.log("Konten und Profile …");

  for (const account of testAccounts) {
    userIds.set(account.username, await upsertAccount(account, passwordHash, locations));
  }

  for (const creator of demoCreators) {
    const { username, email, name, ...profile } = creator;

    userIds.set(
      username,
      await upsertAccount({ username, email, name, role: "MODEL", modelStatus: "ACTIVE", profile }, passwordHash, locations),
    );
  }

  console.log(`  ✓ ${testAccounts.length} Test-Logins, ${demoCreators.length} Demo-Models`);

  console.log("Fotos …");

  const modelUsernames = ["model_demo", "pending_demo", ...demoCreators.map((creator) => creator.username)];
  const assignedImages = await assignImages(modelUsernames);
  const totalFiles = new Set([...assignedImages.values()].flat()).size;

  if (totalFiles === 0) {
    console.warn(`  ⚠ Keine Bilder in ${path.relative(process.cwd(), IMAGES_DIR)}. Profile bleiben ohne Fotos (siehe README dort).`);
  } else {
    let createdPosts = 0;

    for (const username of modelUsernames) {
      createdPosts += await seedImages(userIds.get(username)!, assignedImages.get(username) ?? []);
    }

    console.log(`  ✓ ${totalFiles} Bilddatei(en), ${createdPosts} neue Post(s)`);
  }

  console.log("Admin-Testdaten …");

  try {
    console.log(`  ✓ Verifizierung von @pending_demo: ${await seedPendingVerification(userIds.get("pending_demo")!)}`);
  } catch (error) {
    console.warn(`  ⚠ Verifizierung übersprungen (privater Blob-Store?): ${error instanceof Error ? error.message : error}`);
  }

  const inviteUrl = await seedInvite(userIds.get("admin_demo")!);
  console.log(`  ✓ ${await seedReports(userIds)} neue Demo-Meldung(en)`);

  console.log(`
Fertig. Test-Logins (Passwort für alle, auch die Demo-Models: ${DEMO_PASSWORD})
  Admin              admin@cherrystream.test
  Model (aktiv)      model@cherrystream.test
  Model (in Prüfung) pending@cherrystream.test
  User               user@cherrystream.test
  Demo-Models        z. B. mia.zurich@example.test

Einladungslink zum Testen der Übernahme (30 Tage gültig):
  ${inviteUrl}
`);
}

main()
  .catch((error: unknown) => {
    // The Neon driver rejects with a WebSocket ErrorEvent (not an Error) when the database is unreachable.
    const message = error instanceof Error ? error.message : "Keine Verbindung zur Datenbank. Prüfe DATABASE_URL.";

    console.error(`\n✗ ${message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
