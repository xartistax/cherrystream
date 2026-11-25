# Zahlungsanbieter: Recherche

Stand: 25.11.2026 · Grundlage für [credits-boosts.md](credits-boosts.md)

Geschäftsmodell für die Anbieterprüfung: Schweizer Verzeichnis für Models und Escorts. Models kaufen Prepaid-Credits (CHF 10–100) für Werbeplatzierung, es werden keine expliziten Inhalte verkauft. Stripe ist ausgeschlossen.

„Nicht verifiziert“ heisst: auf den geöffneten Seiten nicht belegt, direkt beim Anbieter klären.

## Kurzfassung

- **TWINT** sieht die Branche „Dating and Escort Services“ (MCC 7273) in der Preisliste vor; ausgeschlossen ist laut AGB „Pornographie“. Einstufung vorab schriftlich klären.
- **Schweizer PSPs** (Payrexx, Saferpay, eher auch Wallee und Datatrans) schliessen Escort-Angebote aus oder entscheiden im Einzelfall.
- **Kartenzahlung** geht realistisch nur über Adult-Anbieter wie Verotel oder CCBill, mit hohen Gebühren.
- **Krypto** ist für die Zielgruppe ungeeignet; NOWPayments verbietet Escort-Seiten in den AGB.

## Instant-Zahlung mit Test-API

Anforderung: sofortige Bestätigung, Webhook und eine Sandbox, damit der plattformweite Testmodus (`PAYMENTS_MODE=test`) in Production funktioniert.

| Anbieter | Escort-Werbung erlaubt | CHF | Gebühren | Sandbox / Test-API | Webhook |
| --- | --- | --- | --- | --- | --- |
| [SegPay](https://gethelp.segpay.com/docs/Content/DeveloperDocs/ProcessingAPI/10-TestingPayments.htm) | Adult ja, Escort nicht verifiziert | nicht verifiziert | nicht verifiziert | ja: neue Packages starten im Testmodus, Testkarten für genehmigt und abgelehnt | ja, auch im Test, mit `TESTTRANS=1` |
| [Paysafecard](https://www.paysafe.com/en/paysafecard-business/faq/) direkt | Adult nur mit anerkannter Altersprüfung (Selbstauskunft reicht nicht); Escort nicht verifiziert; nur MWST-registrierte Firmen | ja (CH-Karten CHF 25/75/150) | 15 % bis 9,5 % je nach Volumen, keine Fixkosten | ja: Testsystem mit REST-API, Implementierungstest vor Go-live | ja, Notification an die pnURL |
| [TWINT Acquiring](https://www.twint.ch/en/business-customers/twint-acquiring/gtc-merchant/) direkt | offen: MCC 7273 vorgesehen, „Pornographie“ ausgeschlossen | ja | 1,35 % + 0,10 % | über PSP belegt ([Datatrans](https://docs.datatrans.ch/v1.0.1/docs/twint): Test-App, Test-Guthaben); für Direkt-Händler nicht verifiziert | für Direkt-Integration nicht verifiziert |
| [CCBill](https://ccbill.com/kb/?p=3221) | ja, als Verzeichnis | nein | nicht veröffentlicht, Kartennetz-Gebühren USD 1950/Jahr | ja: Sandbox-Umschalter, Testkarten | `NewSaleSuccess`; Versand im Sandbox nicht verifiziert |
| [Verotel FlexPay](https://controlcenter.verotel.com/flexpay-doc/purchase.html) | High Risk ja, Escort nicht verifiziert | ja | 13–15,5 %, 10 % Reserve | nicht verifiziert (Doku hinter Login) | ja; ohne „OK“ innert 30 s erfolgt eine automatische Rückerstattung |
| [Klarna](https://docs.klarna.com/acquirer/jpm/resources/legal-and-compliance/policies-and-term-of-service/prohibited-and-restricted-businesses/) | nein, Escort verboten | – | – | – | – |
| [PostFinance Checkout](https://developer.postfinance.ch/content/dam/pfch/doc/460_479/460_334_de.pdf) | eher nein („anrüchiger Inhalt“) | – | – | – | – |
| [Dimoco](https://www.dimoco.com/products/carrier-billing/) (Telefon) | Einzelprüfung, Schweiz nicht genannt | nicht verifiziert | nicht verifiziert | nicht verifiziert | nicht verifiziert |

**Empfohlene Reihenfolge:**

1. **SegPay** für Karten: einziger Anbieter mit öffentlich belegtem Testmodus samt Test-Webhooks. Vorab klären: Escort-Verzeichnisse, CHF, Gebühren. Ersatz: CCBill.
2. **Paysafecard** direkt: instant, CHF, Testsystem, bei xDate bereits im Einsatz. Bedingung: anerkannte Altersprüfung und MWST-registrierte Firma.
3. **TWINT** direkt: günstigster und verbreitetster Weg, aber Freigabe für MCC 7273 und Test-Umgebung für Direkt-Händler noch offen. Antrag früh starten.

## Adult-PSPs

| | CCBill | Verotel (NL) | SegPay | Epoch |
| --- | --- | --- | --- | --- |
| Escort-Werbung erlaubt | ja, wenn die Seite als Verzeichnis auftritt ([EU-AUP Pkt. 23](https://ccbill.com/cs/client/policies/cceu/acceptable_use-eu.html)) | High Risk akzeptiert ([Preisliste](https://verotel.com/en/pricechart.html)); Escort nicht verifiziert | Adult ja ([Prohibited](https://gethelp.segpay.com/docs/Content/ComplianceDocs/ProhibitedContent.htm)); Escort nicht verifiziert | nicht verifiziert ([legal](https://epoch.com/legal_docs/legal.html)) |
| CHF | nein ([Methoden](https://ccbill.com/doc/accepted-payment-methods)) | Zahlung ja, Auszahlung USD/EUR/GBP ([Processing](https://verotel.com/en/paymentprocessing.html)) | nicht verifiziert | nicht verifiziert |
| Gebühren | nicht veröffentlicht; Visa USD 950 + Mastercard USD 1000 pro Jahr ([pricing](https://ccbill.com/pricing)) | Basic 15,5 % + EUR 500/Jahr; Premium 13–14 % ([Preisliste](https://verotel.com/en/pricechart.html)) | nicht verifiziert | nicht verifiziert |
| Automatisierbar | Webhook `NewSaleSuccess` ([Webhooks](https://ccbill.com/doc/webhooks-overview)) | FlexPay für Prepaid-Credits | nicht verifiziert | nicht verifiziert |
| Haken | keine CHF, „Verzeichnis“ nicht definiert | 10 % Reserve über 26 Wochen ([Vertrag](https://www.verotel.com/en/merchantagreement.html)) | Reserve vorgesehen | keine öffentliche Policy |

## TWINT

| Kriterium | Befund |
| --- | --- |
| Escort-Werbung erlaubt | Branche „Dating and Escort Services“ (MCC 7273) mit +0,10 % Zuschlag in der [Preisliste](https://www.twint.ch/en/business-customers/twint-acquiring/prices/); [AGB Ziff. 6.2](https://www.twint.ch/content/uploads/2026/08/GK-AGB-DE-Version-07-2026-2-6.pdf) schliesst „Pornographie“ aus, Zusatzvereinbarung möglich |
| Gebühren | Distanzgeschäft 1,35 % + 0,10 % Branchenzuschlag, keine Fixgebühr |
| Einrichtung | direkt bei TWINT Acquiring, über zertifiziertes Plugin oder PSP ([GTC](https://www.twint.ch/en/business-customers/twint-acquiring/gtc-merchant/)) |
| Auszahlung | standardmässig wöchentlich, täglich auf Wunsch |
| Haken | gängige PSPs (z. B. Payrexx) schliessen Escort aus, daher direkter Weg nötig |

## Schweizer PSPs

| | Escort-Werbung erlaubt | Quelle |
| --- | --- | --- |
| Payrexx | nein, Escort ausdrücklich ausgeschlossen | [Doc](https://docs.payrexx.com/merchant/english/account-verification/prohibited-business-models) |
| Wallee | Einzelfall, Branchenliste nicht öffentlich, Ablehnung ohne Begründung möglich | [AGB](https://app-wallee.com/de/s/1/resource/general-terms-and-conditions.pdf) |
| Datatrans | Gateway, Zulassung entscheidet der Acquirer | [datatrans](https://datatrans.weareplanet.com/) |
| Saferpay (Worldline) | wahrscheinlich nein, „Escort Services“ auf der Restricted-Liste von Worldline Direct | [PDF](https://docs.direct.worldline-solutions.com/global/downloads/restricted+merchant+services+and+products+list.pdf) |

## Krypto

| | Befund | Quelle |
| --- | --- | --- |
| NOWPayments | AGB Ziff. 14.1.5 verbietet Escort-Seiten | [ToS](https://nowpayments.io/doc/fd-tos.pdf) |
| CoinGate | Adult nur mit Altersverifikation; Escort nicht verifiziert | [Blog](https://coingate.com/blog/post/crypto-payment-processor-high-risk-business) |
| BTCPay Server | selbst gehostet, keine Zustimmung Dritter, keine CHF-Auszahlung | [FAQ](https://docs.btcpayserver.org/FAQ/General/) |

## Mitbewerber

- [xDate](https://www.xdate.ch/faq): Guthaben per Kreditkarte, Paysafecard oder Zahlung per Telefon; Anbieter dahinter nicht öffentlich.
- and6, fgirl: Seiten blockieren automatisierte Abrufe, nicht verifiziert.

## Verworfen

- **Banküberweisung / QR-Rechnung:** nicht instant (1–3 Tage), daher vom Product Owner ausgeschlossen.
