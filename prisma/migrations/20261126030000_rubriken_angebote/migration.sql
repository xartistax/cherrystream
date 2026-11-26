-- CreateEnum
CREATE TYPE "ServiceGroup" AS ENUM ('GENERAL', 'BDSM', 'MASSAGE');

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "group" "ServiceGroup" NOT NULL DEFAULT 'GENERAL',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileService" (
    "profileId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfileService_pkey" PRIMARY KEY ("profileId","serviceId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Service_slug_key" ON "Service"("slug");

-- CreateIndex
CREATE INDEX "Service_isActive_group_sortOrder_idx" ON "Service"("isActive", "group", "sortOrder");

-- CreateIndex
CREATE INDEX "ProfileService_serviceId_profileId_idx" ON "ProfileService"("serviceId", "profileId");

-- AddForeignKey
ALTER TABLE "ProfileService" ADD CONSTRAINT "ProfileService_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileService" ADD CONSTRAINT "ProfileService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Replace the former lifestyle categories with the xDate Rubriken (profile links go with them via cascade).
DELETE FROM "Category" WHERE "slug" NOT IN ('escort', 'massagen', 'domina-bdsm', 'trans', 'milf');
INSERT INTO "Category" ("id", "name", "slug", "sortOrder", "isActive", "updatedAt") VALUES
  (gen_random_uuid()::text, 'Escort Service', 'escort', 10, true, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Massagen', 'massagen', 20, true, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Domina / BDSM Sex', 'domina-bdsm', 30, true, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Transsexuelle / Transen', 'trans', 40, true, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'MILF & reife Frauen', 'milf', 50, true, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO UPDATE SET "name" = EXCLUDED."name", "sortOrder" = EXCLUDED."sortOrder", "isActive" = true;

-- Open invites referenced the former categories by id.
UPDATE "ModelInvite" SET "categoryIds" = '{}';

-- Angebote as on xDate.
INSERT INTO "Service" ("id", "name", "slug", "group", "sortOrder", "isActive", "updatedAt") VALUES
  (gen_random_uuid()::text, '69 Stellung', '69-stellung', 'GENERAL', 10, true, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Analsex', 'analsex', 'GENERAL', 20, true, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Deep Throat', 'deep-throat', 'GENERAL', 30, true, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Eier lecken', 'eier-lecken', 'GENERAL', 40, true, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Escort', 'escort', 'GENERAL', 50, true, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Facesitting', 'facesitting', 'GENERAL', 60, true, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Fisten', 'fisten', 'GENERAL', 70, true, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Französisch mit', 'franzoesisch-mit', 'GENERAL', 80, true, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Französisch ohne', 'franzoesisch-ohne', 'GENERAL', 90, true, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Fussfetisch', 'fussfetisch', 'GENERAL', 100, true, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Gangbang', 'gangbang', 'GENERAL', 110, true, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Girlfriend Sex', 'girlfriend-sex', 'GENERAL', 120, true, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Grosse Brüste', 'grosse-brueste', 'GENERAL', 130, true, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Handjob', 'handjob', 'GENERAL', 140, true, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Kaviar (aktiv)', 'kaviar-aktiv', 'GENERAL', 150, true, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Masturbieren', 'masturbieren', 'GENERAL', 160, true, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'NS Spiele (aktiv)', 'ns-spiele-aktiv', 'GENERAL', 170, true, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'NS Spiele (passiv)', 'ns-spiele-passiv', 'GENERAL', 180, true, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Outdoor Sex', 'outdoor-sex', 'GENERAL', 190, true, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Reizwäsche', 'reizwaesche', 'GENERAL', 200, true, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Sex in allen Positionen', 'sex-in-allen-positionen', 'GENERAL', 210, true, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Sex nur mit Kondom', 'sex-nur-mit-kondom', 'GENERAL', 220, true, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Sperma schlucken', 'sperma-schlucken', 'GENERAL', 230, true, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Strapon', 'strapon', 'GENERAL', 240, true, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Striptease / Lapdance', 'striptease-lapdance', 'GENERAL', 250, true, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Zungenanal (passiv)', 'zungenanal-passiv', 'GENERAL', 260, true, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Zungenküssen', 'zungenkuessen', 'GENERAL', 270, true, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Bondage', 'bondage', 'BDSM', 1010, true, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Devot / Sklavin', 'devot-sklavin', 'BDSM', 1020, true, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Kliniksex', 'kliniksex', 'BDSM', 1030, true, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Leder / Latex / PVC', 'leder-latex-pvc', 'BDSM', 1040, true, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Rollenspiele', 'rollenspiele', 'BDSM', 1050, true, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Anal/Prostata Massage', 'anal-prostata-massage', 'MASSAGE', 2010, true, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Body to Body', 'body-to-body', 'MASSAGE', 2020, true, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Erotische Massage', 'erotische-massage', 'MASSAGE', 2030, true, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Klassische Massage', 'klassische-massage', 'MASSAGE', 2040, true, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Nuru Massage', 'nuru-massage', 'MASSAGE', 2050, true, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Tantra Massage', 'tantra-massage', 'MASSAGE', 2060, true, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Thai Massage', 'thai-massage', 'MASSAGE', 2070, true, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;
