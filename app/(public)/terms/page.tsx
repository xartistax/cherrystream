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
      </section>

      <section>
        <h2>2. Mindestalter</h2>
        <p>
          CherryStream richtet sich ausschliesslich an volljährige Personen. Die Nutzung ist erst ab 18 Jahren erlaubt. Models müssen ihr Alter und ihre
          Identität vor der Veröffentlichung ihres Profils verifizieren.
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
        <h2>4. Pflichten von Models</h2>
        <ul>
          <li>Veröffentlicht werden dürfen nur eigene Inhalte, an denen du alle Rechte hast.</li>
          <li>Alle gezeigten Personen müssen volljährig sein und der Veröffentlichung zugestimmt haben. Das muss auf Anfrage nachgewiesen werden können.</li>
          <li>Die Angebote müssen dem geltenden Recht entsprechen, insbesondere den kantonalen Vorschriften zur Sexarbeit.</li>
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
        <h2>7. Kostenpflichtige Leistungen</h2>
        <p>
          <Placeholder>Bedingungen für Credits, Premium-Inhalte und Auszahlungen ergänzen, sobald Zahlungen aktiviert werden</Placeholder>
        </p>
      </section>

      <section>
        <h2>8. Haftung</h2>
        <p>
          CherryStream stellt eine Plattform zur Verfügung und ist nicht Partei von Vereinbarungen zwischen Models und Nutzern.{" "}
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
