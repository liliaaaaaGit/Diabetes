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
        <p className="text-base text-slate-600">Forschungsprototyp für Diabetes-Selbstmanagement</p>
        <p className="text-sm text-slate-500">Stand: Mai 2026</p>
      </header>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900">1. Verantwortliche</h2>
        <p>Verantwortliche im Sinne der DSGVO:</p>
        <p>Lilia Schraut</p>
        <p>Fischartstraße 15, 80686 München</p>
        <p>E-Mail: lilia@schraut.de</p>
        <p>
          Die Datenverarbeitung erfolgt im Rahmen einer Bachelorarbeit an der Ludwig-Maximilians-Universität
          München, betreut durch PD Dr. Claudia Riesmeyer (Institut für Kommunikationswissenschaft, IfKW). Die
          LMU München stellt für diese Arbeit keine technische Infrastruktur zur Verfügung; die hier genannten
          Datenverarbeitungen erfolgen in alleiniger Verantwortung von Lilia Schraut.
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
          jederzeit mit Wirkung für die Zukunft widerrufen, ohne dass dies Auswirkungen auf die Rechtmäßigkeit
          der bis dahin erfolgten Verarbeitung hat.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-semibold text-slate-900">4. Welche Daten werden erhoben?</h2>
        <p>
          <strong className="font-semibold text-slate-900">4.1 Registrierungsdaten:</strong> Frei gewähltes
          Pseudonym (kein Klarname erforderlich), PIN (gespeichert als bcrypt-Hash — die PIN selbst wird nicht
          gespeichert). Es werden keine E-Mail-Adressen, Namen oder Telefonnummern erhoben.
        </p>
        <p>
          <strong className="font-semibold text-slate-900">4.2 Demo-Daten:</strong> Bei der Registrierung werden
          automatisch fiktive Beispieldaten (Blutzuckerwerte, Mahlzeiten, Insulin, Stimmungseinträge, ein
          Beispielgespräch) in Ihren Account geladen. Diese Daten stammen nicht von echten Personen mit Diabetes
          und dienen der Demonstration der App-Funktionen.
        </p>
        <p>
          <strong className="font-semibold text-slate-900">4.3 Nutzergenerierte Gesundheitsdaten:</strong> Sofern
          Sie eigene Einträge erstellen: Blutzuckerwerte (mg/dL bzw. mmol/L), Insulindosen (Einheiten,
          Insulintyp), Mahlzeiten (Beschreibung, geschätzte Kohlenhydrate), körperliche Aktivitäten,
          Stimmungseinträge (Freitext und/oder Skalenwert 1–5), Zeitstempel aller Einträge.
        </p>
        <p>
          <strong className="font-semibold text-slate-900">4.4 Gesprächsdaten (Diabetes-Buddy):</strong> Ihre
          Nachrichten an den KI-Chatbot, Antworten des Chatbots, KI-generierte Gesprächszusammenfassungen,
          KI-generierte Emotionsanalysen.
        </p>
        <p>
          <strong className="font-semibold text-slate-900">4.5 Technische Daten:</strong> Pseudonymisierte
          Benutzer-ID (UUID), Session-Cookies zur Authentifizierung (httpOnly, keine Tracking-Cookies). Über
          Vercel (Hosting) fallen Server-Logs mit IP-Adressen an; diese werden maximal 30 Tage gespeichert und
          ausschließlich zur Abwehr von Angriffen und Fehleranalyse verwendet.
        </p>
        <p>
          <strong className="font-semibold text-slate-900">4.6 Fragebogen-Antworten:</strong> Wenn Sie den
          Studien-Fragebogen ausfüllen, speichern wir Ihre Antworten (sowohl die Skalenwerte als auch Ihre
          Freitext-Antworten) pseudonymisiert unter Ihrer Benutzer-ID. Die Antworten werden ausschließlich für
          die wissenschaftliche Auswertung im Rahmen der Bachelorarbeit verwendet und spätestens zum 31.12.2026
          gelöscht.
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
          Kohlenhydrate werden als Spanne (Minimum–Maximum) mit einem Konfidenz-Hinweis (niedrig /
          mittel / hoch) angezeigt; die Schätzung kann nach Komponenten aufgeschlüsselt werden. Diese
          Werte sind grobe Richtwerte und ersetzen keine professionelle Ernährungs- oder
          Diabetesberatung. Sie dürfen nicht als Grundlage für Insulindosierungen verwendet werden.
          Korrekturen durch Sie werden gespeichert, um die Schätzqualität künftig zu verbessern.
        </p>
        <p>
          <strong className="font-semibold text-slate-900">5.3 Stimmungsanalyse und Profiling:</strong>{" "}
          Freitext-Stimmungseinträge werden automatisch in einen numerischen Wert (1–5) umgewandelt. Gespräche
          mit dem Buddy werden nach Beendigung emotional analysiert. Diese Verarbeitungen stellen Profiling im
          Sinne von Art. 4 Nr. 4 DSGVO dar. Es findet jedoch keine automatisierte Entscheidung mit rechtlicher
          oder ähnlich erheblicher Wirkung im Sinne von Art. 22 DSGVO statt.
        </p>
        <p>
          <strong className="font-semibold text-slate-900">
            5.4 Transparenzhinweis gemäß EU AI Act:
          </strong>{" "}
          Gemäß der EU-Verordnung über Künstliche Intelligenz weisen wir darauf hin, dass Sie in dieser App mit
          einem KI-System interagieren. Alle KI-generierten Inhalte werden automatisch erstellt und nicht von
          einem Menschen geprüft. Die KI-Funktionen dienen ausschließlich Forschungszwecken.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-semibold text-slate-900">
          6. Datenübermittlung an Dritte / Auftragsverarbeitung
        </h2>
        <p>
          Die folgenden externen Dienstleister werden im Rahmen einer Auftragsverarbeitung gemäß Art. 28 DSGVO
          eingesetzt. Mit allen Anbietern bestehen Auftragsverarbeitungsverträge bzw.
          Datenverarbeitungsvereinbarungen:
        </p>
        <p>
          <strong className="font-semibold text-slate-900">Supabase</strong> — Zweck: Datenbank (PostgreSQL).
          Daten: alle Nutzerdaten (pseudonymisiert). Serverstandort: EU (Frankfurt).
        </p>
        <p>
          <strong className="font-semibold text-slate-900">OpenAI</strong> — Zweck: KI-Verarbeitung (Chat,
          Extraktion, Zusammenfassungen, Stimmungsanalyse). Daten: Textnachrichten, Tagebucheinträge (ohne
          Benutzer-ID und ohne Pseudonym). Serverstandort: USA. Über die API-Nutzung wurde der Datenausschluss
          für Trainingszwecke aktiviert.
        </p>
        <p>
          <strong className="font-semibold text-slate-900">Vercel</strong> — Zweck: Hosting der Web-App. Daten:
          HTTP-Requests, IP-Adressen (Server-Logs, max. 30 Tage). Serverstandort: USA.
        </p>
        <p>
          <strong className="font-semibold text-slate-900">Hinweis zur Drittlandübermittlung:</strong> Die
          Übermittlung an OpenAI und Vercel (USA) erfolgt auf Grundlage der von diesen Anbietern
          bereitgestellten EU-Standardvertragsklauseln gemäß Art. 46 Abs. 2 lit. c DSGVO. Ergänzend stützen wir
          die Übermittlung auf Ihre ausdrückliche Einwilligung gemäß Art. 49 Abs. 1 lit. a DSGVO. Trotz dieser
          Schutzmaßnahmen besteht das Risiko, dass US-Behörden auf diese Daten zugreifen könnten. Ihre Daten
          werden pseudonymisiert übermittelt.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900">7. Datensicherheit</h2>
        <p>
          Pseudonymisierung; HTTPS/TLS; PIN als bcrypt-Hash; Row Level Security (RLS) auf Datenbankebene.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900">8. Speicherdauer und Löschung</h2>
        <p>
          Ihre Daten werden bis zur Auswertung aller Fragebögen gespeichert, längstens bis 31.12.2026. Danach
          vollständige und unwiderrufliche Löschung. In die Bachelorarbeit fließen ausschließlich anonymisierte,
          aggregierte Auswertungen ein. Vorzeitiger Widerruf: Daten werden innerhalb von 14 Tagen gelöscht.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900">9. Ihre Rechte</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="font-semibold text-slate-900">Widerruf der Einwilligung (Art. 7 Abs. 3):</strong>{" "}
            per E-Mail an lilia@schraut.de.
          </li>
          <li>
            <strong className="font-semibold text-slate-900">Auskunft (Art. 15):</strong> per E-Mail.
          </li>
          <li>
            <strong className="font-semibold text-slate-900">Löschung (Art. 17):</strong> per E-Mail an
            lilia@schraut.de unter Angabe des Pseudonyms.
          </li>
          <li>
            <strong className="font-semibold text-slate-900">Berichtigung (Art. 16):</strong> per E-Mail.
          </li>
          <li>
            <strong className="font-semibold text-slate-900">Datenübertragbarkeit (Art. 20):</strong> per
            E-Mail.
          </li>
          <li>
            <strong className="font-semibold text-slate-900">Beschwerde (Art. 77):</strong> Bayerisches
            Landesamt für Datenschutzaufsicht (BayLDA).
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900">10. Altersbeschränkung</h2>
        <p>Die Teilnahme ist nur für Personen ab 18 Jahren vorgesehen.</p>
      </section>
    </article>
  )
}
