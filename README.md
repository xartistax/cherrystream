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
| `FFMPEG_PATH`, `FFPROBE_PATH` | nein | Eigene FFmpeg-Binaries |

Die Pflichtvariablen werden beim Serverstart in `lib/env.ts` geprüft.

## Scripts

- `pnpm dev` – Entwicklungsserver
- `pnpm build` – Prisma Client generieren und Production Build
- `pnpm lint` – ESLint
- `pnpm seed` – Kantone, Städte, Kategorien und Test-Creator anlegen
