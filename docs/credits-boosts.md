# Credits & Boosts

Stand: 25.11.2026 · Status: Phasen 1–4 umgesetzt; im Kauf fehlt nur der echte Zahlungsanbieter (Testmodus läuft)

Models kaufen Credits und setzen sie ein, um ihr Profil in der Liste nach oben zu schieben und optisch hervorzuheben, ähnlich wie bei xDate. Mitglieder zahlen nichts, Sichtbarkeit wird nur von Models gekauft.

## Entscheidungen

| Thema | Entscheid |
| --- | --- |
| Boost-Arten | Hochschieben (Bump) als Kern, dazu Auto-Hochschieben und optische Hervorhebung |
| Hervorhebung | rein optisch: Rahmen und Badge „Top“, kein eigener Streifen, keine Vorrangstellung |
| Preise | 1 Credit = CHF 0.10 im kleinsten Paket, Bump = 25 Credits (CHF 2.50) |
| Startguthaben | 100 Credits (4 Bumps), nur für eingeladene Models, gutgeschrieben bei der Freischaltung |
| Mindestabstand | 30 Minuten zwischen zwei manuellen Bumps |
| Zahlung | nur Instant-Zahlungen, keine Banküberweisung; jeder Anbieter braucht eine Test-API |
| Testbetrieb | plattformweiter Testmodus, damit Käufe in Production durchgetestet werden können |

## Boost-Mechanik

Jedes Profil bekommt einen Zeitstempel „zuletzt hochgeschoben“. Die Standardsortierung auf Entdecken und der Startseite richtet sich danach: Wer zuletzt hochgeschoben hat, steht zuoberst und rutscht nach unten, wenn andere nachziehen. Das gilt auch innerhalb der Filter für Kanton, Stadt und Kategorie.

| Boost | Was passiert | Laufzeit |
| --- | --- | --- |
| Hochschieben | Profil springt sofort an die Spitze der Liste | einmalig |
| Auto-Hochschieben | Profil wird automatisch in festen Abständen hochgeschoben | 1 oder 7 Tage |
| Hervorhebung | Karte mit farbigem Rahmen und Badge „Top“, überall wo die Karte erscheint | 1, 7 oder 30 Tage |

- Hochschieben und Hervorhebung lassen sich kombinieren. Die Hervorhebung ändert die Position nicht.
- Neue Profile starten oben: Bei der Freischaltung wird der Zeitstempel auf diesen Moment gesetzt.
- Boosts gibt es nur für verifizierte, öffentliche Profile.
- Wird ein Profil gesperrt oder ausgeblendet, laufen Boosts weiter ab, wirken aber nicht. Rückerstattung nur manuell durch einen Admin.
- Die Sortierung „Beliebt“ (nach Anzahl Favoriten) bleibt als zweite Option und ist nicht käuflich.
- Vercel Hobby führt Cron-Jobs nur einmal täglich aus. Auto-Hochschieben braucht deshalb keinen Cron: Der nächste fällige Zeitpunkt wird beim Laden der Liste nachgeführt, höchstens einmal pro Minute.

> Die Sortierlogik ist in [ranking.md](ranking.md) festgehalten.

## Credits und Preise

| Paket | Preis | Credits | Bonus |
| --- | --- | --- | --- |
| Start | CHF 10 | 100 | – |
| Plus | CHF 25 | 300 | +20 % |
| Pro | CHF 50 | 700 | +40 % |
| Max | CHF 100 | 1600 | +60 % |

| Boost | Credits | Gegenwert im Start-Paket |
| --- | --- | --- |
| Hochschieben, einmal | 25 | CHF 2.50 |
| Auto-Hochschieben, 1 Tag, alle 2 h (12×) | 200 | CHF 20.00 |
| Auto-Hochschieben, 7 Tage, alle 4 h (42×) | 750 | CHF 75.00 |
| Hervorhebung, 1 Tag | 50 | CHF 5.00 |
| Hervorhebung, 7 Tage | 200 | CHF 20.00 |
| Hervorhebung, 30 Tage | 600 | CHF 60.00 |

- Auto-Hochschieben ist günstiger als die gleiche Zahl manueller Bumps (12 einzeln: 300 Credits).
- Credits verfallen nicht. Gekaufte Credits werden nicht ausbezahlt.
- Admins können Credits gutschreiben oder abziehen, jeweils mit Begründung im Audit-Log.

## Zahlung und Testmodus

Nur Zahlungswege mit sofortiger Bestätigung und Webhook. Kandidaten und Vergleich: [payment-research.md](payment-research.md).

Der Testmodus gilt für die ganze Plattform und wird über eine Umgebungsvariable geschaltet:

- `PAYMENTS_MODE=test` nutzt bei allen Anbietern die Sandbox-Zugangsdaten, `live` die echten. Ohne Wert sind Käufe ausgeblendet.
- Solange kein Anbieter angeschlossen ist, gibt es im Testmodus die eingebaute **Testkasse** (`/dashboard/checkout/test/…`): Sie simuliert Zahlung erfolgreich, abgelehnt oder abgebrochen und bucht genau wie ein echter Webhook über `completeCreditOrder` (`lib/payments/orders.ts`).
- Einen echten Anbieter anschliessen: in `PaymentProvider` (Schema) und `getAvailableProviders` ergänzen, `getCheckoutUrl` auf dessen Kasse zeigen lassen und im Webhook `completeCreditOrder(orderId, providerReference)` aufrufen. Die Buchung ist idempotent.
- Offene Bestellungen laufen nach 24 Stunden ab (täglicher Cleanup). Admin-Übersicht: Admin → Bestellungen.
- Im Testmodus zeigt die Kaufseite ein deutliches Banner „Testmodus: keine echten Zahlungen“.
- Jede Bestellung speichert, in welchem Modus sie entstanden ist. Test-Credits sind im Verlauf als „Testzahlung“ markiert und zählen nicht zum Umsatz. Zurücksetzen von Test-Guthaben geht vorerst über die Admin-Buchung (Credits abziehen).
- Die Statusseite im Admin-Bereich zeigt den aktiven Modus und prüft, ob die Zugangsdaten zum Modus passen.

## Datenmodell

| Teil | Status | Änderung |
| --- | --- | --- |
| `Wallet.userCredits` | vorhanden | Guthaben des Models; Abzug nur in einer Transaktion mit Prüfung „Guthaben reicht“ |
| `WalletTransaction` | vorhanden | Typen `CREDIT_PURCHASE`, `BOOST_PURCHASE`, `ADJUSTMENT` gibt es schon; neu `STARTER_CREDIT` |
| `Profile.bumpedAt` | neu | Zeitpunkt des letzten Hochschiebens, Index für die Sortierung |
| `Profile.highlightUntil` | neu | Ende der Hervorhebung; aktiv, solange in der Zukunft |
| `Boost` | neu | Verlauf aller Boosts: Art, Start, Ende, Intervall, Credits, Buchung |
| `CreditOrder` | neu | Kauf eines Pakets: Betrag, Credits, Anbieter, Modus (test/live), Status, Referenz |

Jede Gutschrift aus einer Bestellung trägt die Bestell-ID als Idempotenz-Schlüssel. Ein wiederholter Webhook bucht so nie zweimal.

## Phasen

1. **Guthaben:** Wallet-Service (gutschreiben, abziehen, idempotent), Credits-Seite mit Kontostand und Verlauf, Admin-Gutschrift, Startguthaben bei der Freischaltung eingeladener Models.
2. **Boosts:** Hochschieben und Hervorhebung, neue Standardsortierung, Karte mit Rahmen und Badge, Dashboard-Bereich „Sichtbarkeit“.
3. **Auto-Hochschieben:** Pakete mit Intervall, Nachführen beim Laden der Liste.
4. **Kauf:** Paketseite, Testmodus, Anbindung der gewählten Anbieter mit Webhook.

Phasen 1 bis 3 funktionieren ohne Zahlungsanbieter: Startguthaben und Admin-Gutschriften reichen zum Testen.
