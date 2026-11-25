# Bilder für die Demo-Seed

Leg hier Bilder ab (`.jpg`, `.jpeg`, `.png`, `.webp`, `.avif`), dann `pnpm seed:demo` ausführen.
Die Bilder laufen durch dieselbe Verarbeitung wie echte Uploads und werden in Vercel Blob gespeichert.

## Zuordnung

- **Benannt nach Benutzername**: `mia_zurich.jpg`, `mia_zurich-2.jpg` gehören zu `@mia_zurich`.
- **Alle anderen Dateinamen** werden verteilt: Jedes Model ohne eigene Bilder bekommt mindestens eines.
  Gibt es weniger Bilder als Models, werden sie mehrfach verwendet.

Das erste Bild eines Models wird auch sein Profilbild. Jedes Bild wird ein öffentlicher Post.
Erneutes Ausführen lädt dasselbe Bild für dasselbe Model nicht doppelt hoch.

Benutzernamen: `model_demo`, `pending_demo` und die Demo-Models aus `prisma/seed/creators.ts`
(z. B. `mia_zurich`, `sophia_luxe`, `luna_relax`).

## Wichtig

- Nur Bilder verwenden, die du nutzen darfst (eigene Fotos, lizenzfreie Stockfotos), und keine echten Personen ohne deren Einwilligung.
- Die Bilddateien werden nicht eingecheckt (`.gitignore`).
