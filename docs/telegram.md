# Telegram-Benachrichtigungen für Admins

Ein Bot schreibt in eine gemeinsame Telegram-Gruppe der Admins, sobald etwas zu tun ist. Die Nachricht enthält nur das Ereignis, den Benutzernamen und einen Link in den Admin-Bereich. Ausweise, E-Mail-Adressen und Meldetexte bleiben in CherryStream.

| Ereignis | Link |
| --- | --- |
| Neue Verifizierung | Prüfseite der Verifizierung |
| Neue Meldung (mit Grund, dringende markiert) | Meldungen |
| Einladung übernommen | Einladungen |
| Neues Model registriert | Benutzer, gefiltert auf das Konto |

Jedes Ereignis lässt sich im Admin-Bereich unter **Telegram** ein- und ausschalten. Die Schalter gelten für alle Admins, Änderungen stehen im Protokoll.

## Einrichten (einmalig, ca. 5 Minuten)

1. **Bot anlegen:** In Telegram den offiziellen Kontakt `@BotFather` öffnen, `/newbot` senden, einen Namen (z. B. „CherryStream Admin“) und einen Benutzernamen wählen, der auf `bot` endet. BotFather antwortet mit dem **Token**. Das ist `TELEGRAM_BOT_TOKEN`, wie ein Passwort behandeln.
2. **Gruppe anlegen:** Eine neue Gruppe mit allen Admins erstellen und den Bot als Mitglied hinzufügen.
3. **Chat-ID herausfinden:** In der Gruppe eine beliebige Nachricht schreiben, dann im Browser `https://api.telegram.org/bot<TOKEN>/getUpdates` öffnen. Unter `"chat": { "id": … }` steht die ID der Gruppe, eine negative Zahl wie `-1001234567890`. Das ist `TELEGRAM_CHAT_ID`.
4. **In Vercel eintragen:** Unter Settings → Environment Variables beide Werte für **Production** setzen (Token als „Sensitive“) und neu deployen.
5. **Prüfen:** Admin-Bereich → Telegram → „Testnachricht senden“. Die Statusseite zeigt unter „Admin-Benachrichtigungen (Telegram)“, ob der Bot die Gruppe erreicht.

Für lokale Tests dieselben Variablen in `.env.local` setzen, am besten mit einer eigenen Testgruppe.

## Verhalten

- Gesendet wird nach der Antwort an die Nutzerin (`after()`), ein langsamer oder fehlgeschlagener Versand blockiert also nichts. Fehler landen im Log.
- Ohne die beiden Variablen ist die Funktion aus, es wird nichts gesendet.
