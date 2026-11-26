import type { ServiceGroup } from "../../generated/prisma/enums";

type ServiceSeed = {
  name: string;
  slug: string;
  group: ServiceGroup;
  sortOrder: number;
};

// "Angebote" as on xDate, in their order and grouping.
const general = [
  ["69 Stellung", "69-stellung"],
  ["Analsex", "analsex"],
  ["Deep Throat", "deep-throat"],
  ["Eier lecken", "eier-lecken"],
  ["Escort", "escort"],
  ["Facesitting", "facesitting"],
  ["Fisten", "fisten"],
  ["Französisch mit", "franzoesisch-mit"],
  ["Französisch ohne", "franzoesisch-ohne"],
  ["Fussfetisch", "fussfetisch"],
  ["Gangbang", "gangbang"],
  ["Girlfriend Sex", "girlfriend-sex"],
  ["Grosse Brüste", "grosse-brueste"],
  ["Handjob", "handjob"],
  ["Kaviar (aktiv)", "kaviar-aktiv"],
  ["Masturbieren", "masturbieren"],
  ["NS Spiele (aktiv)", "ns-spiele-aktiv"],
  ["NS Spiele (passiv)", "ns-spiele-passiv"],
  ["Outdoor Sex", "outdoor-sex"],
  ["Reizwäsche", "reizwaesche"],
  ["Sex in allen Positionen", "sex-in-allen-positionen"],
  ["Sex nur mit Kondom", "sex-nur-mit-kondom"],
  ["Sperma schlucken", "sperma-schlucken"],
  ["Strapon", "strapon"],
  ["Striptease / Lapdance", "striptease-lapdance"],
  ["Zungenanal (passiv)", "zungenanal-passiv"],
  ["Zungenküssen", "zungenkuessen"],
] as const;

const bdsm = [
  ["Bondage", "bondage"],
  ["Devot / Sklavin", "devot-sklavin"],
  ["Kliniksex", "kliniksex"],
  ["Leder / Latex / PVC", "leder-latex-pvc"],
  ["Rollenspiele", "rollenspiele"],
] as const;

const massage = [
  ["Anal/Prostata Massage", "anal-prostata-massage"],
  ["Body to Body", "body-to-body"],
  ["Erotische Massage", "erotische-massage"],
  ["Klassische Massage", "klassische-massage"],
  ["Nuru Massage", "nuru-massage"],
  ["Tantra Massage", "tantra-massage"],
  ["Thai Massage", "thai-massage"],
] as const;

function toSeeds(entries: ReadonlyArray<readonly [string, string]>, group: ServiceGroup, offset: number): ServiceSeed[] {
  return entries.map(([name, slug], index) => ({
    name,
    slug,
    group,
    sortOrder: offset + (index + 1) * 10,
  }));
}

export const services: ServiceSeed[] = [...toSeeds(general, "GENERAL", 0), ...toSeeds(bdsm, "BDSM", 1000), ...toSeeds(massage, "MASSAGE", 2000)];
