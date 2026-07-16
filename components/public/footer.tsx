import Link from "next/link";

import { Logo } from "@/components/shared/logo";

const footerLinks = [
  {
    label: "Creator entdecken",
    href: "/creators",
  },
  {
    label: "Anmelden",
    href: "/login",
  },
  {
    label: "Registrieren",
    href: "/register",
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
    <footer className="relative border-t border-white/10 bg-zinc-950/70">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1fr_auto_auto] lg:px-8">
        <div className="max-w-sm">
          <Logo />

          <p className="mt-4 text-sm leading-6 text-zinc-500">Entdecke neue Profile und verbinde dich mit Menschen auf CherryStream.</p>
        </div>

        <div>
          <p className="text-sm font-semibold text-white">CherryStream</p>

          <nav className="mt-4 flex flex-col gap-3">
            {footerLinks.map((item) => (
              <Link key={item.href} href={item.href} className="text-sm text-zinc-500 transition-colors hover:text-rose-400">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div>
          <p className="text-sm font-semibold text-white">Rechtliches</p>

          <nav className="mt-4 flex flex-col gap-3">
            {legalLinks.map((item) => (
              <Link key={item.href} href={item.href} className="text-sm text-zinc-500 transition-colors hover:text-rose-400">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-zinc-600 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} CherryStream. Alle Rechte vorbehalten.</p>

          <p>Nur für Personen ab 18 Jahren.</p>
        </div>
      </div>
    </footer>
  );
}
