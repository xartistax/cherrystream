# Changelog

Versionierung nach [Semantic Versioning](https://semver.org/lang/de/). Bis zum öffentlichen Start (1.0.0) erhöhen neue Funktionen die mittlere Stelle, reine Fehlerbehebungen die letzte.

## 0.1.0 (26.11.2026)

Geschlossene Vorschau auf cherrystream.ch: Die Plattform ist funktional vollständig für erste Models, öffentlich ist nur die Coming-Soon-Seite.

### Neu

- **Galerie statt Social-Feed:** Models laden Bilder und Videos einzeln hoch; Profilbild ist das gewählte oder das erste Bild. Besucher merken sich Profile privat als Favoriten statt zu folgen oder zu liken.
- **Credits und Boosts:** Hochschieben (Bump), Auto-Hochschieben und Hervorhebung („Top“). Standardliste auf Entdecken und Startseite nach dem letzten Bump. Seite „Sichtbarkeit“ mit Guthaben, Listenplatz und Verlauf. Startguthaben für eingeladene Models, manuelle Gutschrift durch Admins.
- **Kauf von Credits** mit plattformweitem Testmodus (`PAYMENTS_MODE`) und eingebauter Testkasse; ein echter Zahlungsanbieter wird nur noch angeschlossen. Admin-Übersicht der Bestellungen mit Umsatz pro Monat.
- **Rubriken und Angebote** wie bei xDate (5 Rubriken, 39 Angebote in drei Gruppen), filterbar auf Entdecken und sichtbar im Profil.
- **Alle 2110 Gemeinden der Schweiz** (amtliches BFS-Verzeichnis), Ortswahl mit Suche; auf Entdecken ein Feld „Ort oder Kanton“ mit korrekten Zahlen.
- **Einladungen:** Rich-Text-Beschreibung, Angebote, Signal und Kontakt-Hinweis; offene Einladungen lassen sich bearbeiten, ohne dass sich der Link ändert.
- **Telegram-Benachrichtigungen** für Admins: neue Verifizierungen, Meldungen, Einladungen, Registrierungen, Konto-Löschungen, echte Zahlungen, technische Probleme, wartende Verifizierungen und eine tägliche Zusammenfassung; jedes Ereignis einzeln schaltbar.
- **Coming-Soon-Modus** mit Schalter unter Admin → Website und Vorschau-Link; angemeldete Konten und Einladungslinks kommen durch.
- **Eigene Domain** cherrystream.ch, E-Mails von `noreply@cherrystream.ch`, Kontaktadressen in den Rechtstexten.
- Rechtstexte als Entwürfe auf dem Stand der App (Dienstleister, Rubriken und Angebote, Credits und Boosts).

### Geändert

- Stripe vollständig entfernt (verbietet Erotik-Plattformen); Credit-Kauf läuft anbieterneutral.
- Täglicher Cron um 06:00 UTC (morgens in der Schweiz), danach die Telegram-Tagesnachrichten.
- Demo-Seed lässt sich für eine Vorschau gezielt in Production ausführen (`--production`, eigenes `SEED_PASSWORD`).
- `.env.example` vollständig.

### Behoben

- Zurück-Button auf dem Profil, auch in der mitlaufenden Leiste (auf dem Handy fehlte er).
- Vercel: sharp-Bibliotheken werden mitgeliefert, FFmpeg nur noch in der Galerie-Funktion (Funktionslimit).
- Einstellungen zeigen nur Benachrichtigungen, die es tatsächlich gibt.

### Noch offen bis 1.0.0

Firmenangaben und juristische Prüfung der Rechtstexte, Vercel Pro, echter Zahlungsanbieter, Altersprüfung für Besucher, erste echte Models, Aufräumen der Demo-Daten.

## 0.0.1 (25.11.2026)

Erste lauffähige Version: verifizierte Models mit Ausweisprüfung, Admin-Bereich mit Statusseite, Einladungen mit Übernahme-Ablauf, Meldungen, Rechtstext-Platzhalter, Deployment auf Vercel.
