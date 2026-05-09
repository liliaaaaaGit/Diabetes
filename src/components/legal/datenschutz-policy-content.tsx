/**
 * Full Datenschutzerklärung (German) — copy-frozen legal text for /datenschutz.
 */
export function DatenschutzPolicyContent() {
  return (
    <article className="space-y-5 text-sm leading-relaxed text-slate-700">
      <header className="space-y-2 border-b border-slate-200 pb-6">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          GlucoCompanion — Datenschutzerklärung
        </h1>
        <p className="text-base text-slate-600">
          Forschungsprototyp für Diabetes-Selbstmanagement
        </p>
        <p className="text-sm text-slate-500">Stand: Mai 2026</p>
      </header>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900">1. Verantwortliche</h2>
        <p>Verantwortliche im Sinne der DSGVO:</p>
        <p>Lilia Schraut</p>
        <p>E-Mail: lilia@schraut.de</p>
        <p>
          Die Datenverarbeitung erfolgt im Rahmen einer Bachelorarbeit an der Ludwig-Maximilians-Universität
          München, betreut durch PD Dr. Claudia Riesmeyer (IfKW).
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900">2. Zweck der Datenverarbeitung</h2>
        <p>
          GlucoCompanion ist ein Forschungsprototyp, der im Rahmen einer wissenschaftlichen Abschlussarbeit
          entwickelt wird. Die App untersucht, wie KI-gestützte Funktionen das emotionale und metabolische
          Selbstmanagement von Menschen mit Diabetes unterstützen können. Die App ist kein Medizinprodukt und
          ersetzt keine ärztliche oder therapeutische Beratung. Die erhobenen Daten werden ausschließlich für
          die wissenschaftliche Auswertung im Rahmen der Bachelorarbeit verwendet. Eine kommerzielle Nutzung
          findet nicht statt.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900">3. Rechtsgrundlage</h2>
        <p>
          Die Verarbeitung Ihrer Daten erfolgt auf Grundlage Ihrer ausdrücklichen Einwilligung gemäß Art. 6 Abs.
          1 lit. a DSGVO in Verbindung mit Art. 9 Abs. 2 lit. a DSGVO (Einwilligung in die Verarbeitung
          besonderer Kategorien personenbezogener Daten, hier: Gesundheitsdaten). Sie können Ihre Einwilligung
          jederzeit mit Wirkung für die Zukunft widerrufen.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-semibold text-slate-900">4. Welche Daten werden erhoben?</h2>
        <p>
          <strong className="font-semibold text-slate-900">4.1 Registrierungsdaten:</strong> Frei gewähltes
          Pseudonym (kein Klarname erforderlich), PIN (gespeichert als kryptografischer bcrypt-Hash — die PIN
          selbst wird nicht gespeichert). Es werden keine E-Mail-Adressen, Namen oder Telefonnummern erhoben.
        </p>
        <p>
          <strong className="font-semibold text-slate-900">4.2 Demo-Daten:</strong> Bei der Registrierung werden
          automatisch fiktive Beispieldaten (Blutzuckerwerte, Mahlzeiten, Insulin, Stimmungseinträge, ein
          Beispielgespräch) in Ihren Account geladen. Diese Daten stammen nicht von echten Patienten und dienen
          der Demonstration der App-Funktionen.
        </p>
        <p>
          <strong className="font-semibold text-slate-900">4.3 Nutzergenerierte Gesundheitsdaten:</strong> Wenn
          Sie eigene Einträge erstellen: Blutzuckerwerte (mg/dL), Insulindosen (Einheiten, Insulintyp), Mahlzeiten
          (Beschreibung, geschätzte Kohlenhydrate), körperliche Aktivitäten, Stimmungseinträge (Freitext und/oder
          Skalenwert 1–5), Zeitstempel aller Einträge.
        </p>
        <p>
          <strong className="font-semibold text-slate-900">4.4 Gesprächsdaten (Diabetes-Buddy):</strong> Ihre
          Nachrichten an den KI-Chatbot, Antworten des KI-Chatbots, KI-generierte Gesprächszusammenfassungen,
          KI-generierte Emotionsanalysen.
        </p>
        <p>
          <strong className="font-semibold text-slate-900">4.5 Technische Daten:</strong> Pseudonymisierte
          Benutzer-ID (UUID), Session-Cookies zur Authentifizierung (httpOnly, keine Tracking-Cookies).
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-semibold text-slate-900">5. Einsatz von Künstlicher Intelligenz</h2>
        <p>
          <strong className="font-semibold text-slate-900">5.1 Diabetes-Buddy (Chatbot):</strong> Der
          Diabetes-Buddy ist ein KI-gestützter Chatbot für emotionales Selbstmanagement. Er orientiert sich an
          Ansätzen der kognitiven Verhaltenstherapie (CBT). Er ist kein Therapeut, kein Arzt und kein
          Medizinprodukt. Seine Antworten können fehlerhaft sein.
        </p>
        <p>
          <strong className="font-semibold text-slate-900">5.2 Tagebuch-Extraktion:</strong> Die
          Extraktionsfunktion wandelt Freitext-Eingaben in strukturierte Einträge um. KI-geschätzte
          Kohlenhydratwerte sind Richtwerte und ersetzen keine professionelle Ernährungsberatung.
        </p>
        <p>
          <strong className="font-semibold text-slate-900">5.3 Stimmungsanalyse:</strong> Freitext-Stimmungseinträge
          werden automatisch in einen numerischen Wert (1–5) umgewandelt. Gespräche mit dem Buddy werden nach
          Beendigung emotional analysiert.
        </p>
        <p>
          <strong className="font-semibold text-slate-900">
            5.4 Transparenzhinweis gemäß EU AI Act:
          </strong>{" "}
          Gemäß der EU-Verordnung über Künstliche Intelligenz weisen wir darauf hin, dass Sie in dieser App mit
          einem KI-System interagieren. Alle KI-generierten Inhalte werden automatisch erstellt und nicht von einem
          Menschen geprüft. Die KI-Funktionen dienen ausschließlich Forschungszwecken.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-semibold text-slate-900">6. Datenübermittlung an Dritte</h2>
        <p>
          Supabase — Zweck: Datenbank (PostgreSQL). Daten: Alle Nutzerdaten (pseudonymisiert). Serverstandort: EU
          (Frankfurt).
        </p>
        <p>
          OpenAI — Zweck: KI-Verarbeitung (Chat, Extraktion, Zusammenfassungen, Stimmungsanalyse). Daten:
          Textnachrichten, Tagebucheinträge (ohne User-ID oder Pseudonym). Serverstandort: USA.
        </p>
        <p>
          Vercel — Zweck: Hosting der Web-App. Daten: HTTP-Requests, IP-Adressen (Server-Logs). Serverstandort:
          USA.
        </p>
        <p>
          Hinweis zur Drittlandübermittlung: Die Übermittlung an OpenAI und Vercel (USA) erfolgt auf Grundlage
          Ihrer Einwilligung (Art. 49 Abs. 1 lit. a DSGVO) sowie der von diesen Anbietern bereitgestellten
          EU-Standardvertragsklauseln. Es besteht das Risiko, dass US-Behörden auf diese Daten zugreifen könnten.
          Ihre Daten werden pseudonymisiert übermittelt.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900">7. Datensicherheit</h2>
        <p>
          Pseudonymisierung: Zugang ausschließlich über frei gewähltes Pseudonym und PIN. Keine Klarnamen oder
          E-Mail-Adressen. Verschlüsselung: Alle Datenübertragungen über HTTPS/TLS. PIN als bcrypt-Hash
          gespeichert. Zugriffskontrolle: Row Level Security (RLS) auf Datenbankebene — jeder Nutzer kann
          ausschließlich seine eigenen Daten einsehen. Datenisolation: Serverseitige Durchsetzung der
          Datentrennung über API-Routen.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900">8. Speicherdauer und Löschung</h2>
        <p>
          Ihre Daten werden für die Dauer der Studie und bis zur Abgabe der Bachelorarbeit gespeichert. Nach
          Abschluss der Arbeit werden alle personenbezogenen Daten vollständig gelöscht. In die Bachelorarbeit
          fließen ausschließlich anonymisierte und aggregierte Auswertungen ein.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900">9. Ihre Rechte</h2>
        <p>
          Widerruf der Einwilligung (Art. 7 Abs. 3 DSGVO): Jederzeit möglich per E-Mail an lilia@schraut.de oder
          über die Löschfunktion in den App-Einstellungen. Auskunft (Art. 15 DSGVO): Sie können Auskunft über Ihre
          gespeicherten Daten verlangen. Löschung (Art. 17 DSGVO): Sie können die sofortige Löschung aller Ihrer
          Daten verlangen. Berichtigung (Art. 16 DSGVO): Sie können die Korrektur unrichtiger Daten verlangen.
          Datenübertragbarkeit (Art. 20 DSGVO): Sie können Ihre Daten in einem maschinenlesbaren Format über die
          Exportfunktion in den App-Einstellungen herunterladen. Beschwerde (Art. 77 DSGVO): Sie haben das Recht,
          sich bei der zuständigen Datenschutzaufsichtsbehörde zu beschweren (Bayerisches Landesamt für
          Datenschutzaufsicht).
        </p>
      </section>
    </article>
  )
}
