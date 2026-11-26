import type { ContactChannel, Gender } from "../../generated/prisma/enums";

export type CreatorSeed = {
  username: string;
  email: string;
  name: string;
  displayName: string;
  bio: string;
  gender: Gender;
  cantonSlug: string;
  cityName: string;
  categorySlugs: string[];
  serviceSlugs: string[];
  verified: boolean;
  phoneNumber: string;
  phoneEnabled: boolean;
  whatsappEnabled: boolean;
  preferredContact: ContactChannel | null;
  contactNote: string | null;
  instagram: string | null;
  instagramEnabled: boolean;
};

const escortServices = ["escort", "girlfriend-sex", "zungenkuessen", "franzoesisch-mit", "sex-nur-mit-kondom", "reizwaesche", "striptease-lapdance"];
const massageServices = ["erotische-massage", "body-to-body", "tantra-massage", "klassische-massage", "nuru-massage"];
const bdsmServices = ["bondage", "leder-latex-pvc", "rollenspiele", "kliniksex", "fussfetisch", "facesitting", "strapon"];

/** Demo profiles for local testing. Fictional people; used by `pnpm seed:demo` only. */
export const demoCreators: CreatorSeed[] = [
  {
    username: "mia_zurich",
    email: "mia.zurich@example.test",
    name: "Mia",
    displayName: "Mia Zürich",
    bio: `
      <h2>Willkommen bei mir ❤️</h2>
      <p>Ich bin eine gepflegte, diskrete und unkomplizierte Begleitung aus Zürich.</p>
      <p>Bei mir stehen gegenseitiger Respekt, Sauberkeit und eine entspannte Atmosphäre im Mittelpunkt.</p>
      <h3>Termine</h3>
      <ul>
        <li>Termine nach Vereinbarung</li>
        <li>Kurzfristige Anfragen möglich</li>
        <li>Diskrete Kontaktaufnahme</li>
      </ul>
    `,
    gender: "WOMAN",
    cantonSlug: "zh",
    cityName: "Zürich",
    categorySlugs: ["escort"],
    serviceSlugs: escortServices,
    verified: true,
    phoneNumber: "+41 79 000 10 01",
    phoneEnabled: true,
    whatsappEnabled: true,
    preferredContact: "WHATSAPP",
    contactNote: "Terminanfragen bitte mit gewünschter Uhrzeit und Dauer.",
    instagram: "mia.zurich",
    instagramEnabled: true,
  },
  {
    username: "sophia_luxe",
    email: "sophia.luxe@example.test",
    name: "Sophia",
    displayName: "Sophia Luxe",
    bio: `
      <h2>Eleganz und Diskretion</h2>
      <p>Ich freue mich auf respektvolle Gäste, die eine entspannte und stilvolle Zeit schätzen.</p>
      <blockquote>Qualität, Diskretion und eine persönliche Atmosphäre stehen für mich an erster Stelle.</blockquote>
    `,
    gender: "WOMAN",
    cantonSlug: "zh",
    cityName: "Winterthur",
    categorySlugs: ["escort"],
    serviceSlugs: [...escortServices, "69-stellung"],
    verified: true,
    phoneNumber: "+41 79 000 10 02",
    phoneEnabled: true,
    whatsappEnabled: false,
    preferredContact: "PHONE",
    contactNote: "Keine WhatsApp-Kontakte. Bitte ausschliesslich anrufen.",
    instagram: "sophia.luxe.ch",
    instagramEnabled: true,
  },
  {
    username: "luna_relax",
    email: "luna.relax@example.test",
    name: "Luna",
    displayName: "Luna Relax",
    bio: `
      <h2>Entspannung in ruhiger Atmosphäre</h2>
      <p>Bei mir kannst du den Alltag für einen Moment vergessen und dich vollständig entspannen.</p>
      <ul>
        <li>Gepflegtes Ambiente</li>
        <li>Diskrete Lage</li>
        <li>Termine nach Vereinbarung</li>
      </ul>
    `,
    gender: "WOMAN",
    cantonSlug: "be",
    cityName: "Bern",
    categorySlugs: ["massagen"],
    serviceSlugs: massageServices,
    verified: false,
    phoneNumber: "+41 79 000 10 03",
    phoneEnabled: true,
    whatsappEnabled: true,
    preferredContact: "WHATSAPP",
    contactNote: null,
    instagram: null,
    instagramEnabled: false,
  },
  {
    username: "valentina_rose",
    email: "valentina.rose@example.test",
    name: "Valentina",
    displayName: "Valentina Rose",
    bio: `
      <h2>Schön, dass du hier bist</h2>
      <p>Ich bin offen, herzlich und lege grossen Wert auf einen respektvollen Umgang.</p>
      <p>Schreibe mir gerne für weitere Informationen und freie Termine.</p>
    `,
    gender: "WOMAN",
    cantonSlug: "bs",
    cityName: "Basel",
    categorySlugs: ["escort"],
    serviceSlugs: escortServices,
    verified: true,
    phoneNumber: "+41 79 000 10 04",
    phoneEnabled: false,
    whatsappEnabled: true,
    preferredContact: "WHATSAPP",
    contactNote: "Bitte keine Anrufe. Nachrichten werden täglich beantwortet.",
    instagram: "valentina.rose",
    instagramEnabled: true,
  },
  {
    username: "emma_wellness",
    email: "emma.wellness@example.test",
    name: "Emma",
    displayName: "Emma Wellness",
    bio: `
      <h2>Zeit für dich</h2>
      <p>Eine ruhige Atmosphäre, gepflegte Räumlichkeiten und ausreichend Zeit gehören für mich zu einem gelungenen Besuch.</p>
    `,
    gender: "WOMAN",
    cantonSlug: "lu",
    cityName: "Luzern",
    categorySlugs: ["massagen"],
    serviceSlugs: [...massageServices, "thai-massage"],
    verified: false,
    phoneNumber: "+41 79 000 10 05",
    phoneEnabled: true,
    whatsappEnabled: true,
    preferredContact: "PHONE",
    contactNote: null,
    instagram: null,
    instagramEnabled: false,
  },
  {
    username: "isabella_geneva",
    email: "isabella.geneva@example.test",
    name: "Isabella",
    displayName: "Isabella Geneva",
    bio: `
      <h2>Bienvenue</h2>
      <p>Je suis disponible sur rendez-vous dans une ambiance élégante et discrète.</p>
      <p>Français, anglais et italien.</p>
    `,
    gender: "WOMAN",
    cantonSlug: "ge",
    cityName: "Genève",
    categorySlugs: ["escort"],
    serviceSlugs: [...escortServices, "outdoor-sex"],
    verified: true,
    phoneNumber: "+41 79 000 10 06",
    phoneEnabled: true,
    whatsappEnabled: true,
    preferredContact: "WHATSAPP",
    contactNote: "Merci d’indiquer votre prénom et l’heure souhaitée.",
    instagram: "isabella.geneva",
    instagramEnabled: true,
  },
  {
    username: "lea_love",
    email: "lea.love@example.test",
    name: "Lea",
    displayName: "Lea Love",
    bio: `
      <h2>Natürlich und unkompliziert</h2>
      <p>Ich mag entspannte Begegnungen ohne Zeitdruck und freue mich über sympathische Nachrichten.</p>
    `,
    gender: "WOMAN",
    cantonSlug: "ag",
    cityName: "Aarau",
    categorySlugs: ["escort"],
    serviceSlugs: escortServices.slice(0, 5),
    verified: false,
    phoneNumber: "+41 79 000 10 07",
    phoneEnabled: false,
    whatsappEnabled: true,
    preferredContact: "WHATSAPP",
    contactNote: null,
    instagram: null,
    instagramEnabled: false,
  },
  {
    username: "nina_touch",
    email: "nina.touch@example.test",
    name: "Nina",
    displayName: "Nina Touch",
    bio: `
      <h2>Entspannt ankommen</h2>
      <p>Ich empfange dich in einer ruhigen, gepflegten und diskreten Umgebung.</p>
      <h3>Wichtig</h3>
      <ul>
        <li>Nur Termine nach Vereinbarung</li>
        <li>Keine anonymen Anrufe</li>
        <li>Respektvoller Umgang</li>
      </ul>
    `,
    gender: "WOMAN",
    cantonSlug: "sg",
    cityName: "St. Gallen",
    categorySlugs: ["massagen", "escort"],
    serviceSlugs: [...massageServices.slice(0, 3), "escort", "girlfriend-sex"],
    verified: false,
    phoneNumber: "+41 79 000 10 08",
    phoneEnabled: true,
    whatsappEnabled: false,
    preferredContact: "PHONE",
    contactNote: "Termine ausschliesslich telefonisch.",
    instagram: null,
    instagramEnabled: false,
  },
  {
    username: "aurora_elite",
    email: "aurora.elite@example.test",
    name: "Aurora",
    displayName: "Aurora Elite",
    bio: `
      <h2>Exklusive Begleitung</h2>
      <p>Stil, Diskretion und eine persönliche Atmosphäre stehen bei mir im Vordergrund.</p>
      <blockquote>Bitte kontaktiere mich frühzeitig für eine verbindliche Terminplanung.</blockquote>
    `,
    gender: "WOMAN",
    cantonSlug: "vd",
    cityName: "Lausanne",
    categorySlugs: ["escort"],
    serviceSlugs: [...escortServices, "deep-throat"],
    verified: true,
    phoneNumber: "+41 79 000 10 09",
    phoneEnabled: true,
    whatsappEnabled: true,
    preferredContact: "WHATSAPP",
    contactNote: "Termine bitte mindestens zwei Stunden vorher vereinbaren.",
    instagram: "aurora.elite.ch",
    instagramEnabled: true,
  },
  {
    username: "chloe_dream",
    email: "chloe.dream@example.test",
    name: "Chloe",
    displayName: "Chloe Dream",
    bio: `
      <h2>Deine kleine Auszeit</h2>
      <p>Ich bin freundlich, offen und freue mich darauf, neue Menschen kennenzulernen.</p>
    `,
    gender: "WOMAN",
    cantonSlug: "tg",
    cityName: "Frauenfeld",
    categorySlugs: ["escort"],
    serviceSlugs: escortServices.slice(0, 4),
    verified: false,
    phoneNumber: "+41 79 000 10 10",
    phoneEnabled: false,
    whatsappEnabled: true,
    preferredContact: "WHATSAPP",
    contactNote: null,
    instagram: "chloe.dream.ch",
    instagramEnabled: true,
  },
  {
    username: "julia_harmony",
    email: "julia.harmony@example.test",
    name: "Julia",
    displayName: "Julia Harmony",
    bio: `
      <h2>Ruhe, Harmonie und Diskretion</h2>
      <p>Bei mir erwartet dich eine angenehme Atmosphäre und ausreichend Zeit zum Abschalten.</p>
    `,
    gender: "WOMAN",
    cantonSlug: "so",
    cityName: "Solothurn",
    categorySlugs: ["massagen"],
    serviceSlugs: massageServices,
    verified: false,
    phoneNumber: "+41 79 000 10 11",
    phoneEnabled: true,
    whatsappEnabled: true,
    preferredContact: "PHONE",
    contactNote: null,
    instagram: null,
    instagramEnabled: false,
  },
  {
    username: "sofia_noir",
    email: "sofia.noir@example.test",
    name: "Sofia",
    displayName: "Sofia Noir",
    bio: `
      <h2>Selbstbewusst und stilvoll</h2>
      <p>Ich schätze klare Kommunikation, Diskretion und einen respektvollen Umgang.</p>
    `,
    gender: "WOMAN",
    cantonSlug: "ne",
    cityName: "Neuchâtel",
    categorySlugs: ["domina-bdsm"],
    serviceSlugs: bdsmServices,
    verified: true,
    phoneNumber: "+41 79 000 10 12",
    phoneEnabled: true,
    whatsappEnabled: false,
    preferredContact: "PHONE",
    contactNote: "Bitte keine Sprachnachrichten.",
    instagram: "sofia.noir",
    instagramEnabled: true,
  },
  {
    username: "anna_secret",
    email: "anna.secret@example.test",
    name: "Anna",
    displayName: "Anna Secret",
    bio: `
      <h2>Diskret und persönlich</h2>
      <p>Mein Profil richtet sich an respektvolle Gäste, die eine private und entspannte Atmosphäre suchen.</p>
    `,
    gender: "WOMAN",
    cantonSlug: "zg",
    cityName: "Zug",
    categorySlugs: ["milf", "escort"],
    serviceSlugs: escortServices,
    verified: false,
    phoneNumber: "+41 79 000 10 13",
    phoneEnabled: false,
    whatsappEnabled: true,
    preferredContact: "WHATSAPP",
    contactNote: null,
    instagram: null,
    instagramEnabled: false,
  },
  {
    username: "sarah_spa",
    email: "sarah.spa@example.test",
    name: "Sarah",
    displayName: "Sarah Spa",
    bio: `
      <h2>Wellness und Entspannung</h2>
      <p>Geniesse eine ruhige Auszeit in gepflegter Atmosphäre.</p>
      <ul>
        <li>Flexible Termine</li>
        <li>Zentrale Lage</li>
        <li>Diskreter Empfang</li>
      </ul>
    `,
    gender: "WOMAN",
    cantonSlug: "fr",
    cityName: "Fribourg",
    categorySlugs: ["massagen"],
    serviceSlugs: [...massageServices, "anal-prostata-massage"],
    verified: false,
    phoneNumber: "+41 79 000 10 14",
    phoneEnabled: true,
    whatsappEnabled: true,
    preferredContact: "WHATSAPP",
    contactNote: null,
    instagram: "sarah.spa.ch",
    instagramEnabled: true,
  },
  {
    username: "elena_ticino",
    email: "elena.ticino@example.test",
    name: "Elena",
    displayName: "Elena Ticino",
    bio: `
      <h2>Benvenuto</h2>
      <p>Ti aspetto in un ambiente curato, tranquillo e discreto.</p>
      <p>Italiano, tedesco e inglese.</p>
    `,
    gender: "WOMAN",
    cantonSlug: "ti",
    cityName: "Lugano",
    categorySlugs: ["escort"],
    serviceSlugs: escortServices.slice(1),
    verified: true,
    phoneNumber: "+41 79 000 10 15",
    phoneEnabled: true,
    whatsappEnabled: true,
    preferredContact: "WHATSAPP",
    contactNote: null,
    instagram: "elena.ticino",
    instagramEnabled: true,
  },
  {
    username: "amelie_lausanne",
    email: "amelie.lausanne@example.test",
    name: "Amélie",
    displayName: "Amélie Lausanne",
    bio: `
      <h2>Une rencontre élégante</h2>
      <p>Je vous accueille dans un cadre agréable et discret, uniquement sur rendez-vous.</p>
    `,
    gender: "WOMAN",
    cantonSlug: "vd",
    cityName: "Lausanne",
    categorySlugs: ["escort", "domina-bdsm"],
    serviceSlugs: [...escortServices.slice(0, 4), "rollenspiele", "leder-latex-pvc"],
    verified: false,
    phoneNumber: "+41 79 000 10 16",
    phoneEnabled: false,
    whatsappEnabled: true,
    preferredContact: "WHATSAPP",
    contactNote: "Messages uniquement, pas d’appels WhatsApp.",
    instagram: null,
    instagramEnabled: false,
  },
];
