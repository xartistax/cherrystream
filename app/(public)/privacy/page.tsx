import type { Metadata } from "next";

import { LegalPage, Placeholder } from "@/components/public/legal-page";

export const metadata: Metadata = {
  title: "Datenschutzerklärung",
  robots: {
    index: false,
  },
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Datenschutzerklärung" updatedAt="November 2026">
      <section>
        <h2>1. Verantwortliche Stelle</h2>
        <p>
          Verantwortlich für die Bearbeitung von Personendaten nach dem Schweizer Datenschutzgesetz (DSG) ist <Placeholder>Firmenname, Adresse</Placeholder>.
          Kontakt für Datenschutzanliegen: <Placeholder>datenschutz@cherrystream.ch</Placeholder>.
        </p>
      </section>

      <section>
        <h2>2. Welche Daten wir bearbeiten</h2>
        <ul>
          <li>Kontodaten: E-Mail-Adresse, Benutzername, Passwort (nur verschlüsselt gespeichert), Geburtsdatum.</li>
          <li>Profildaten von Models: Name, Beschreibung, Ort, Kategorien, Fotos, Videos und freiwillig angegebene Kontaktkanäle.</li>
          <li>
            Verifizierung von Models: Foto eines Ausweises und ein Selfie. Diese Daten werden ausschliesslich zur Alters- und Identitätsprüfung verwendet,
            in einem nicht öffentlichen Speicher abgelegt und nach der Prüfung gelöscht. Wir bewahren nur auf, dass und wann eine Prüfung stattgefunden hat.
          </li>
          <li>Nutzungsdaten: Profilaufrufe und Klicks auf Kontaktkanäle, nur in anonymisierter Form (gehashte Kennungen).</li>
          <li>Meldungen: Inhalt der Meldung und eine gehashte Kennung der meldenden Person zum Schutz vor Missbrauch.</li>
        </ul>
        <p>
          Hinweis: Angaben auf Profilen von Models können Rückschlüsse auf das Sexualleben zulassen und gelten als besonders schützenswerte
          Personendaten. Wir bearbeiten sie nur mit der Einwilligung der betroffenen Person. <Placeholder>juristisch prüfen</Placeholder>
        </p>
      </section>

      <section>
        <h2>3. Vorbereitete Profile (Einladungen)</h2>
        <p>
          Wir können für Models auf Grundlage öffentlich verfügbarer Angaben ein nicht öffentliches Profil vorbereiten und sie dazu einladen. Ein solches
          Profil wird nie veröffentlicht, solange die Person es nicht selbst übernimmt und sich verifiziert. Über den Einladungslink kann sie es jederzeit
          sofort löschen lassen. Nicht übernommene Profile werden nach 30 Tagen automatisch gelöscht. Nach einer Ablehnung speichern wir nur einen
          verschlüsselten Hash der Telefonnummer, damit keine erneute Einladung erfolgt. <Placeholder>Rechtsgrundlage und Datenquellen juristisch prüfen</Placeholder>
        </p>
      </section>

      <section>
        <h2>4. Zwecke</h2>
        <ul>
          <li>Betrieb der Plattform und Darstellung von Profilen</li>
          <li>Alters- und Identitätsprüfung von Models</li>
          <li>Sicherheit, Missbrauchsbekämpfung und Bearbeitung von Meldungen</li>
          <li>Statistiken für Models über Aufrufe und Kontaktanfragen</li>
        </ul>
      </section>

      <section>
        <h2>5. Auftragsbearbeiter und Bekanntgabe ins Ausland</h2>
        <p>Wir setzen folgende Dienstleister ein. Die Daten können dabei auch in der EU oder den USA bearbeitet werden:</p>
        <ul>
          <li>Vercel Inc. (Hosting, Speicherung von Medien), USA</li>
          <li>Neon Inc. (Datenbank), <Placeholder>Region der Datenbank, z. B. EU (Frankfurt)</Placeholder></li>
          <li>
            <Placeholder>weitere Dienstleister, z. B. E-Mail-Versand oder Zahlungsanbieter</Placeholder>
          </li>
        </ul>
        <p>
          <Placeholder>Garantien für die Bekanntgabe ins Ausland angeben, z. B. Standardvertragsklauseln oder Swiss-U.S. Data Privacy Framework</Placeholder>
        </p>
      </section>

      <section>
        <h2>6. Aufbewahrung</h2>
        <ul>
          <li>Ausweis und Selfie: bis zum Abschluss der Prüfung, danach gelöscht</li>
          <li>Nicht übernommene Einladungen: höchstens 30 Tage</li>
          <li>Kontodaten: bis zur Löschung des Kontos <Placeholder>Fristen nach Kontolöschung festlegen</Placeholder></li>
        </ul>
      </section>

      <section>
        <h2>7. Cookies</h2>
        <p>
          Wir verwenden nur technisch notwendige Cookies: für die Anmeldung und um deine Bestätigung des Mindestalters zu speichern. Es werden keine
          Tracking- oder Werbe-Cookies eingesetzt.
        </p>
      </section>

      <section>
        <h2>8. Deine Rechte</h2>
        <p>
          Du kannst Auskunft über deine Daten verlangen, ihre Berichtigung oder Löschung fordern und eine erteilte Einwilligung widerrufen. Dein Konto
          kannst du in den Einstellungen selbst löschen. Anfragen an <Placeholder>datenschutz@cherrystream.ch</Placeholder>. Du kannst dich zudem beim
          Eidgenössischen Datenschutz- und Öffentlichkeitsbeauftragten (EDÖB) beschweren.
        </p>
      </section>
    </LegalPage>
  );
}
