import Link from "next/link";

import { Logo } from "@/components/shared/logo";

const discoverLinks = [
  {
    label: "Profile entdecken",
    href: "/explore",
  },
  {
    label: "Kategorien",
    href: "/explore",
  },
  {
    label: "Neueste Profile",
    href: "/explore?sort=newest",
  },
] as const;

const platformLinks = [
  {
    label: "Profil erstellen",
    href: "/register",
  },
  {
    label: "Anmelden",
    href: "/login",
  },
  {
    label: "Dashboard",
    href: "/dashboard",
  },
] as const;

const legalLinks = [
  {
    label: "Impressum",
    href: "/imprint",
  },
  {
    label: "Datenschutz",
    href: "/privacy",
  },
  {
    label: "Nutzungsbedingungen",
    href: "/terms",
  },
] as const;

export function PublicFooter() {
  return (
    <footer className="relative mt-24 border-t border-white/10 bg-gradient-to-b from-zinc-900 to-zinc-950">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-8">
        <div className="max-w-sm">
          <Logo />

          <p className="mt-5 text-sm leading-7 text-zinc-500">
            Entdecke Profile aus der Schweiz, folge deinen Favoriten und finde Fotos, Videos und exklusive Inhalte auf CherryStream.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold tracking-wide text-white">Entdecken</h3>

          <nav className="mt-5 flex flex-col gap-3">
            {discoverLinks.map((item, i) => (
              <Link key={item.href + i} href={item.href} className="text-sm text-zinc-500 transition hover:text-rose-400">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div>
          <h3 className="text-sm font-semibold tracking-wide text-white">Plattform</h3>

          <nav className="mt-5 flex flex-col gap-3">
            {platformLinks.map((item) => (
              <Link key={item.href} href={item.href} className="text-sm text-zinc-500 transition hover:text-rose-400">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div>
          <h3 className="text-sm font-semibold tracking-wide text-white">Rechtliches</h3>

          <nav className="mt-5 flex flex-col gap-3">
            {legalLinks.map((item) => (
              <Link key={item.href} href={item.href} className="text-sm text-zinc-500 transition hover:text-rose-400">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} CherryStream. Alle Rechte vorbehalten.</p>

          <div className="flex flex-wrap items-center gap-4">
            <span>🇨🇭 Schweiz</span>
            <span>18+</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
