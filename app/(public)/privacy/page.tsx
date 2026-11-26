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
          <li>Profildaten von Models: Name, Beschreibung, Ort, Rubriken, Angebote, Fotos, Videos und freiwillig angegebene Kontaktkanäle.</li>
          <li>
            Verifizierung von Models: Foto eines Ausweises und ein Selfie. Diese Daten werden ausschliesslich zur Alters- und Identitätsprüfung verwendet,
            in einem nicht öffentlichen Speicher abgelegt und nach der Prüfung gelöscht. Wir bewahren nur auf, dass und wann eine Prüfung stattgefunden hat.
          </li>
          <li>Nutzungsdaten: Profilaufrufe und Klicks auf Kontaktkanäle, nur in anonymisierter Form (gehashte Kennungen).</li>
          <li>Favoriten: Profile, die du dir merkst. Diese Liste siehst nur du, Models sehen nur eine Gesamtzahl ohne Namen.</li>
          <li>
            Credits und Käufe von Models: gekaufte Pakete, Betrag, Zeitpunkt, Status und die Referenz des Zahlungsanbieters sowie gebuchte Boosts.
            Kreditkarten- oder Kontodaten erhalten wir nicht, sie liegen nur beim Zahlungsanbieter.
          </li>
          <li>Schutz vor Missbrauch: gehashte IP-Adressen für Begrenzungen bei Anmeldung und Formularen, nach spätestens 24 Stunden gelöscht.</li>
          <li>Meldungen: Inhalt der Meldung und eine gehashte Kennung der meldenden Person zum Schutz vor Missbrauch.</li>
        </ul>
        <p>
          Hinweis: Angaben auf Profilen von Models, insbesondere Rubriken und Angebote, können Rückschlüsse auf das Sexualleben zulassen und gelten als besonders schützenswerte
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
          <li>Abwicklung von Credit-Käufen und Boosts</li>
          <li>Interne Benachrichtigung der Administratoren über neue Verifizierungen, Meldungen und Registrierungen</li>
        </ul>
      </section>

      <section>
        <h2>5. Auftragsbearbeiter und Bekanntgabe ins Ausland</h2>
        <p>Wir setzen folgende Dienstleister ein. Die Daten können dabei auch in der EU oder den USA bearbeitet werden:</p>
        <ul>
          <li>Vercel Inc., USA: Hosting der Website; Fotos, Videos und Ausweisdokumente werden in Rechenzentren in Frankfurt (EU) gespeichert</li>
          <li>Neon Inc., USA: Datenbank, Rechenzentrum in Frankfurt (EU)</li>
          <li>Resend Inc., USA: Versand von E-Mails (Bestätigung der E-Mail-Adresse, Passwort zurücksetzen, Hinweise zur Verifizierung)</li>
          <li>Functional Software Inc. (Sentry), USA: Fehlerberichte zur Stabilität der Website, Datenspeicherung in der EU; ohne Benutzerdaten, Cookies und Formularinhalte</li>
          <li>
            Telegram: interne Benachrichtigungen an die Administratoren. Übermittelt werden nur die Art des Ereignisses und der Benutzername, keine
            Ausweise, E-Mail-Adressen oder Meldetexte
          </li>
          <li>
            Zahlungsanbieter für den Kauf von Credits: <Placeholder>Anbieter nennen, sobald unter Vertrag (z. B. SegPay, Paysafecard, TWINT)</Placeholder>
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
          <li>Gehashte IP-Adressen zum Schutz vor Missbrauch: höchstens 24 Stunden</li>
          <li>
            Käufe von Credits: 10 Jahre, soweit sie als Geschäftsbelege aufbewahrt werden müssen <Placeholder>Frist juristisch bestätigen</Placeholder>
          </li>
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
