# Deployment und Go-Live

Anleitung für das erste Production-Deployment von v0.0.1 auf Vercel.

## 1. Dienste

| Dienst | Wofür | Hinweis |
| --- | --- | --- |
| Domain (z. B. `cherrystream.ch`) | App-URL, E-Mail-Absender, Impressum | bei einem Schweizer Registrar |
| Vercel | Hosting, Cron | Projekt mit dem GitHub-Repo verbinden |
| Neon | Datenbank | **Production und Entwicklung getrennt** (eigener Neon-Branch für lokal) |
| Vercel Blob, Store 1 | Medien | Zugriff **Public** |
| Vercel Blob, Store 2 | Ausweisdokumente | Zugriff **Private**, Prefix `VERIFICATION_BLOB` |
| Resend | E-Mails | Domain verifizieren, Region EU |
| Sentry (optional) | Error-Tracking | Region **EU** (`de.sentry.io`) wählen |

## 2. Umgebungsvariablen in Vercel (Production)

| Variable | Wert |
| --- | --- |
| `DATABASE_URL` | Neon Production, **pooled** |
| `DIRECT_URL` | Neon Production, direkt (für Migrationen) |
| `AUTH_SECRET` | neu erzeugen: `openssl rand -base64 32`, nicht den lokalen Wert verwenden |
| `NEXT_PUBLIC_APP_URL` | `https://cherrystream.ch` |
| `BLOB_READ_WRITE_TOKEN` | Medien-Store (wird beim Verbinden gesetzt) |
| `VERIFICATION_BLOB_READ_WRITE_TOKEN` | privater Store |
| `RESEND_API_KEY` | Resend |
| `EMAIL_FROM` | `CherryStream <noreply@cherrystream.ch>` |
| `CRON_SECRET` | `openssl rand -hex 32` |
| `NEXT_PUBLIC_PAYMENTS_ENABLED` | `false` |
| `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN` | optional, gleicher DSN |
| `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` | optional, nur für Source Maps |

**Nicht** in Production setzen: `EMAIL_DEV_REDIRECT`, `SEED_PASSWORD`, `FFMPEG_PATH`, `FFPROBE_PATH`.

Variablen mit `NEXT_PUBLIC_` werden beim Build eingebaut. Nach einer Änderung neu deployen.

## 3. Datenbank vorbereiten

Lokal mit den **Production**-Werten für `DATABASE_URL` und `DIRECT_URL` (z. B. temporär in einer separaten Shell):

```bash
pnpm prisma migrate deploy   # wendet alle Migrationen an, ändert nichts an bestehenden Daten
pnpm seed                    # Stammdaten: Kategorien, Kantone, Städte
```

`pnpm seed:demo` **nie** gegen Production ausführen.

## 4. Deployen

1. Pull Request `release/v0.0.1` nach `main` mergen. Vercel baut `main` automatisch.
2. Vercel verwendet pnpm automatisch (`packageManager` in `package.json`). Node.js-Version im Projekt: 24.
3. Nach dem ersten Deploy die Admins anlegen (Konten vorher normal registrieren):

```bash
pnpm make-admin erste@adresse.ch
pnpm make-admin zweite@adresse.ch
```

## 5. Prüfen

1. Automatischer Rauchtest:

   ```bash
   pnpm smoke https://cherrystream.ch
   ```

2. Als Admin `/admin` öffnen: Alle Systeme sollen grün sein. Erwartete Ausnahmen: «Zahlungen» deaktiviert, «Error-Tracking» falls Sentry noch fehlt.

3. Manuelle Checkliste:

   - [ ] Registrieren, Bestätigungsmail kommt an, Link bestätigt die Adresse
   - [ ] Passwort vergessen: Mail kommt an, neues Passwort funktioniert
   - [ ] «Mitglied werden» durchlaufen, Ausweis und Selfie hochladen
   - [ ] Admin bekommt Mail, prüft unter Verifizierungen, gibt frei
   - [ ] Model bekommt Freigabe-Mail, Profil ist öffentlich sichtbar
   - [ ] Bild posten; **Video posten (auch ein längeres)**, Poster wird erzeugt
   - [ ] Einladung erstellen, Link im privaten Fenster öffnen, übernehmen
   - [ ] «Nicht interessiert» bei einer zweiten Einladung löscht sie
   - [ ] Profil melden (dringender Grund), Admin bekommt Mail
   - [ ] «Als Model ansehen» und «Ansicht beenden»
   - [ ] Altershinweis erscheint im privaten Fenster
   - [ ] Am nächsten Tag: Statusseite zeigt den Cleanup-Job ohne Warnung

## 6. Wenn etwas schiefgeht

- **Vercel → Deployments → Instant Rollback** auf das vorherige Deployment.
- Alle Migrationen von v0.0.1 sind additiv (neue Tabellen und Spalten). Ein Rollback des Codes funktioniert mit dem neuen Schema.
- Fehler: Sentry, sonst Vercel → Logs.

## 7. Vor dem öffentlichen Start

- [ ] Impressum, Datenschutz und AGB: Platzhalter ersetzen und juristisch prüfen lassen (danach `robots: noindex` auf den Seiten entfernen)
- [ ] Domain bei Resend verifiziert, `EMAIL_FROM` darauf umgestellt
- [ ] Zahlungsanbieter für Erwachsenen-Inhalte angefragt, falls Premium geplant ist
