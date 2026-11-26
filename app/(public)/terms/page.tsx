import type { Metadata } from "next";

import { LegalPage, Placeholder } from "@/components/public/legal-page";

export const metadata: Metadata = {
  title: "Nutzungsbedingungen",
  robots: {
    index: false,
  },
};

export default function TermsPage() {
  return (
    <LegalPage title="Nutzungsbedingungen" updatedAt="November 2026">
      <section>
        <h2>1. Geltungsbereich</h2>
        <p>
          Diese Bedingungen regeln die Nutzung von CherryStream, betrieben von <Placeholder>Firmenname, Adresse</Placeholder>. Mit der Registrierung
          akzeptierst du sie.
        </p>
        <p>
          CherryStream ist ein Verzeichnis für Erotik- und Escort-Inserate. Personen, die ein Inserat schalten (Inserierende), stellen sich dort vor;
          Besucherinnen und Besucher nehmen direkt mit ihnen Kontakt auf. CherryStream vermittelt keine Dienstleistungen, nimmt keine Buchungen oder
          Zahlungen für Treffen entgegen und ist an Treffen nicht beteiligt.
        </p>
      </section>

      <section>
        <h2>2. Mindestalter</h2>
        <p>
          CherryStream richtet sich ausschliesslich an volljährige Personen. Die Nutzung ist erst ab 18 Jahren erlaubt. Inserierende müssen ihr Alter und ihre
          Identität verifizieren, bevor ihr Inserat veröffentlicht wird.
        </p>
      </section>

      <section>
        <h2>3. Konten</h2>
        <ul>
          <li>Jede Person darf nur ein Konto führen. Angaben müssen wahr sein.</li>
          <li>Zugangsdaten sind geheim zu halten. Du bist für Aktivitäten in deinem Konto verantwortlich.</li>
          <li>Du kannst dein Konto jederzeit in den Einstellungen löschen.</li>
        </ul>
      </section>

      <section>
        <h2>4. Pflichten von Inserierenden</h2>
        <ul>
          <li>Veröffentlicht werden dürfen nur eigene Inhalte, an denen du alle Rechte hast.</li>
          <li>Alle gezeigten Personen müssen volljährig sein und der Veröffentlichung zugestimmt haben. Das muss auf Anfrage nachgewiesen werden können.</li>
          <li>Die Angebote müssen dem geltenden Recht entsprechen, insbesondere den kantonalen Vorschriften zur Sexarbeit.</li>
          <li>Rubriken, Angebote, Ort und Fotos müssen der Wahrheit entsprechen. Irreführende Angaben können zur Sperrung führen.</li>
          <li>
            <Placeholder>weitere Pflichten, z. B. Bewilligungen, Steuern, Werbebeschränkungen</Placeholder>
          </li>
        </ul>
      </section>

      <section>
        <h2>5. Verbotene Inhalte</h2>
        <ul>
          <li>Inhalte mit Minderjährigen oder Personen, die minderjährig wirken</li>
          <li>Inhalte ohne Einwilligung der gezeigten Personen</li>
          <li>Gewalt, Zwang, Menschenhandel oder Ausbeutung</li>
          <li>Fremde Fotos, Fake-Profile, Spam und Betrug</li>
          <li>Inhalte, die Rechte Dritter verletzen</li>
        </ul>
      </section>

      <section>
        <h2>6. Moderation und Meldungen</h2>
        <p>
          Wir prüfen Profile vor der Freigabe und gemeldete Inhalte umgehend. Wir können Inhalte ausblenden und Konten sperren oder löschen, wenn gegen
          diese Bedingungen oder geltendes Recht verstossen wird. Bei Verdacht auf Straftaten können wir die Behörden informieren.
        </p>
      </section>

      <section>
        <h2>7. Credits und Boosts für Inserierende</h2>
        <ul>
          <li>
            Inserierende können Credits in Paketen kaufen. Es gelten die Preise in CHF, die vor dem Kauf angezeigt werden{" "}
            <Placeholder>inkl. oder exkl. MWST angeben</Placeholder>. Die Credits werden gutgeschrieben, sobald der Zahlungsanbieter die Zahlung bestätigt.
          </li>
          <li>
            Mit Credits lassen sich Boosts buchen: Hochschieben (das Inserat steht danach zuoberst in der Standardliste), Auto-Hochschieben (in festen
            Abständen) und Hervorhebung (Rahmen und Abzeichen auf der Profilkarte). Laufzeit und Preis stehen vor der Buchung fest.
          </li>
          <li>
            Ein Boost verbessert die Sichtbarkeit, garantiert aber weder eine bestimmte Position noch eine Anzahl Aufrufe oder Kontakte. Andere Inserierende
            können ebenfalls hochschieben. Zwischen zwei manuellen Bumps liegen mindestens 30 Minuten.
          </li>
          <li>Credits verfallen nicht. Sie haben keinen Barwert, werden nicht ausbezahlt und sind nicht übertragbar.</li>
          <li>
            Gekaufte Credits und gebuchte Boosts werden nicht zurückerstattet, ausser bei einem technischen Fehler oder wo das Gesetz es verlangt. Wird
            ein Inserat wegen eines Verstosses gesperrt, laufen gebuchte Boosts ohne Wirkung ab. <Placeholder>Regelung juristisch prüfen</Placeholder>
          </li>
          <li>Eingeladene Inserierende können ein Startguthaben erhalten. Es ist ein freiwilliges Angebot ohne Barwert.</li>
          <li>
            Solange ein Testmodus angezeigt wird, finden keine echten Zahlungen statt. Im Testmodus gekaufte Credits können jederzeit zurückgesetzt
            werden.
          </li>
        </ul>
      </section>

      <section>
        <h2>8. Haftung</h2>
        <p>
          CherryStream stellt ein Inserate-Verzeichnis zur Verfügung und ist nicht Partei von Vereinbarungen zwischen Inserierenden und Besuchern.{" "}
          <Placeholder>Haftungsbeschränkung juristisch formulieren</Placeholder>
        </p>
      </section>

      <section>
        <h2>9. Anwendbares Recht und Gerichtsstand</h2>
        <p>
          Es gilt Schweizer Recht. Gerichtsstand ist <Placeholder>Sitz der Betreiberin</Placeholder>, soweit gesetzlich zulässig.
        </p>
      </section>
    </LegalPage>
  );
}
