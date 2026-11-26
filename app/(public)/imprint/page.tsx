import type { Metadata } from "next";

import { LegalPage, Placeholder } from "@/components/public/legal-page";

export const metadata: Metadata = {
  title: "Impressum",
  robots: {
    index: false,
  },
};

export default function ImprintPage() {
  return (
    <LegalPage title="Impressum" updatedAt="November 2026">
      <section>
        <h2>Betreiberin</h2>
        <p>
          <Placeholder>Firmenname inkl. Rechtsform, z. B. Muster GmbH</Placeholder>
          <br />
          <Placeholder>Strasse und Nummer</Placeholder>
          <br />
          <Placeholder>PLZ Ort</Placeholder>
          <br />
          Schweiz
        </p>
      </section>

      <section>
        <h2>Kontakt</h2>
        <p>
          E-Mail: <a href="mailto:kontakt@cherrystream.ch">kontakt@cherrystream.ch</a>
        </p>
      </section>

      <section>
        <h2>Vertretungsberechtigte Personen</h2>
        <p>
          <Placeholder>Vor- und Nachname, Funktion</Placeholder>
        </p>
      </section>

      <section>
        <h2>Handelsregister und Mehrwertsteuer</h2>
        <ul>
          <li>
            Handelsregister: <Placeholder>Kanton, Firmennummer (CHE-xxx.xxx.xxx)</Placeholder>
          </li>
          <li>
            UID / MWST-Nummer: <Placeholder>CHE-xxx.xxx.xxx MWST, falls mehrwertsteuerpflichtig</Placeholder>
          </li>
        </ul>
      </section>

      <section>
        <h2>Meldungen zu Inhalten</h2>
        <p>
          Rechtswidrige Inhalte oder Inserate können direkt über die Funktion «Melden» auf jedem Inserat oder per E-Mail an{" "}
          <a href="mailto:meldungen@cherrystream.ch">meldungen@cherrystream.ch</a> gemeldet werden. Wir prüfen Meldungen umgehend.
        </p>
      </section>

      <section>
        <h2>Haftungsausschluss</h2>
        <p>
          Für Inhalte, die Nutzerinnen und Nutzer selbst veröffentlichen, sind diese verantwortlich. Für Inhalte externer Links übernehmen wir keine
          Haftung. <Placeholder>Text juristisch prüfen lassen</Placeholder>
        </p>
      </section>
    </LegalPage>
  );
}
