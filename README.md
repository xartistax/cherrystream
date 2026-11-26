# CherryStream

Kontaktplattform für professionelle Models in der Schweiz. Vision, Economy und Entscheidungen liegen in [`docs/`](docs).

## Stack

- Next.js 16 (App Router, `proxy.ts`), React 19
- Prisma 7 mit Neon (PostgreSQL)
- Auth.js (Credentials, JWT-Sessions)
- Vercel Blob für Medien, sharp und FFmpeg für die Medienverarbeitung

## Setup

```bash
pnpm install
cp .env.example .env   # Werte eintragen
pnpm prisma migrate dev
pnpm seed
pnpm seed:demo   # optional, Demo-Daten (siehe unten)
pnpm dev
```

### Umgebungsvariablen

| Variable | Pflicht | Zweck |
| --- | --- | --- |
| `DATABASE_URL` | ja | Neon Pooled Connection (App) |
| `DIRECT_URL` | ja | Direkte Verbindung (Prisma Migrationen) |
| `AUTH_SECRET` | ja | Auth.js Secret, mind. 32 Zeichen |
| `BLOB_READ_WRITE_TOKEN` | ja | Vercel Blob |
| `VERIFICATION_BLOB_READ_WRITE_TOKEN` | empfohlen | Privater Blob-Store für Ausweisdokumente (Fallback: `BLOB_READ_WRITE_TOKEN`) |
| `NEXT_PUBLIC_APP_URL` | nein | Öffentliche URL der App |
| `NEXT_PUBLIC_PAYMENTS_ENABLED` | nein | `true` aktiviert Credits, Premium und Stripe (Standard: aus) |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | nein | Zahlungen (in v0.0.1 deaktiviert) |
| `RESEND_API_KEY`, `EMAIL_FROM` | in Production | E-Mail-Versand über Resend. Lokal ohne Key: Mails erscheinen in der Server-Konsole |
| `EMAIL_DEV_REDIRECT` | nein | Nur lokal: leitet alle Mails an eine Adresse um (z. B. im Resend-Testmodus) |
| `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN` | empfohlen | Error-Tracking. `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` nur für Source Maps im Build |
| `CRON_SECRET` | in Production | Schützt den täglichen Cleanup-Job (`openssl rand -hex 32`) |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | optional | Admin-Benachrichtigungen in eine Telegram-Gruppe (docs/telegram.md) |
| `FFMPEG_PATH`, `FFPROBE_PATH` | nein | Eigene FFmpeg-Binaries |

Die Pflichtvariablen werden beim Serverstart in `lib/env.ts` geprüft.

## Scripts

- `pnpm dev` – Entwicklungsserver
- `pnpm build` – Prisma Client generieren und Production Build
- `pnpm lint` – ESLint
- `pnpm seed` – Stammdaten: Kategorien, alle 26 Kantone und ihre wichtigsten Städte (sicher für Production)
- `pnpm seed:demo [--yes]` – Demo-Daten für lokale Tests: 16 Demo-Models mit Fotos aus `prisma/seed/images/`, Test-Logins (Admin, Model, Model in Prüfung, User) sowie eine offene Verifizierung, eine Einladung und Beispiel-Meldungen. Fragt vor dem Schreiben nach. Production nur mit `--production` und eigenem `SEED_PASSWORD` (siehe docs/deploy.md).
- `pnpm smoke [url]` – Rauchtest gegen ein Deployment (nur lesende Anfragen)
- `pnpm make-admin <email> [--revoke]` – Konto zum Admin machen (oder Rechte entziehen)

## Betrieb

Deployment-Anleitung und Go-Live-Checkliste: [`docs/deploy.md`](docs/deploy.md)

- `/admin` – Systemstatus, Verifizierungen, Benutzer, Inhalte und Protokoll (nur Admins)
- `/api/health` – öffentlicher Health-Check für Uptime-Monitore (`200` oder `503`, ohne Details)
- `/api/cron/cleanup` – täglicher Cleanup um 03:00 UTC (vercel.json): löscht abgelaufene Einladungen und liegengebliebene Ausweisfotos
