/**
 * Full Datenschutzerklärung (German) — copy-frozen legal text for /datenschutz.
 */
export function DatenschutzPolicyContent() {
  return (
    <article className="space-y-5 text-sm leading-relaxed text-slate-700">
      <header className="space-y-2 border-b border-slate-200 pb-6">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Datenschutzerklärung</h1>
        <p className="text-sm text-slate-500">Stand: Mai 2026</p>
      </header>

      <section className="space-y-3">
        <p>
          Der Schutz Ihrer personenbezogenen Daten ist mir ein wichtiges Anliegen. Mit dieser
          Datenschutzerklärung informiere ich Sie gemäß Art. 13 der Datenschutz-Grundverordnung (DSGVO)
          darüber, welche personenbezogenen Daten bei der Nutzung der Web-Anwendung GlucoCompanion
          verarbeitet werden, zu welchen Zwecken und auf welcher Rechtsgrundlage dies geschieht und welche
          Rechte Ihnen zustehen.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900">1. Verantwortliche</h2>
        <p>Verantwortliche im Sinne von Art. 4 Nr. 7 DSGVO:</p>
        <p>
          Lilia Schraut
          <br />
          Fischartstraße 15, 80686 München
          <br />
          E-Mail: lilia@schraut.de
        </p>
        <p>
          Die Verarbeitung erfolgt im Rahmen einer Bachelorarbeit am Institut für Kommunikationswissenschaft
          und Medienforschung (IfKW) der Ludwig-Maximilians-Universität München (Betreuung: PD Dr. Claudia
          Riesmeyer). Die Universität stellt für dieses Vorhaben keine technische Infrastruktur bereit; die
          nachfolgend beschriebenen Verarbeitungen erfolgen in alleiniger Verantwortung von Lilia Schraut.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900">2. Gegenstand und Zweck der Verarbeitung</h2>
        <p>
          GlucoCompanion ist ein wissenschaftlicher Forschungsprototyp. Gegenstand der Studie ist die Frage,
          wie KI-gestützte Funktionen das emotionale und metabolische Selbstmanagement von Menschen mit
          Diabetes unterstützen können. Die bei der Nutzung anfallenden Daten werden ausschließlich zu
          wissenschaftlichen Zwecken im Rahmen der genannten Abschlussarbeit verarbeitet; eine kommerzielle
          Nutzung findet nicht statt.
        </p>
        <p>
          Die App ist kein Medizinprodukt und ersetzt keine ärztliche, therapeutische oder ernährungsmedizinische
          Beratung.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900">3. Rechtsgrundlage</h2>
        <p>
          Rechtsgrundlage der Verarbeitung ist Ihre ausdrückliche Einwilligung gemäß Art. 6 Abs. 1 lit. a in
          Verbindung mit Art. 9 Abs. 2 lit. a DSGVO (Einwilligung in die Verarbeitung besonderer Kategorien
          personenbezogener Daten – hier: Gesundheitsdaten). Sie können Ihre Einwilligung jederzeit widerrufen.
          Die Rechtmäßigkeit der bis zum Widerruf erfolgten Verarbeitung bleibt hiervon unberührt.
        </p>
        <p>
          Die Bereitstellung Ihrer Daten ist freiwillig. Es besteht weder eine gesetzliche noch eine
          vertragliche Verpflichtung zur Bereitstellung. Ohne Einwilligung ist eine Nutzung der App jedoch
          nicht möglich, da die Verarbeitung für den Betrieb erforderlich ist.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-semibold text-slate-900">4. Kategorien verarbeiteter Daten</h2>
        <p>
          <strong className="font-semibold text-slate-900">4.1 Registrierungsdaten.</strong> Frei gewähltes
          Pseudonym (kein Klarname erforderlich) sowie eine PIN, die ausschließlich als kryptografischer Hash
          (bcrypt) gespeichert wird; die PIN selbst wird nicht gespeichert. Es werden keine Namen,
          E-Mail-Adressen oder Telefonnummern erhoben.
        </p>
        <p>
          <strong className="font-semibold text-slate-900">4.2 Demonstrationsdaten.</strong> Bei der
          Registrierung werden Ihrem Konto automatisch fiktive Beispieldaten (Blutzucker, Mahlzeiten, Insulin,
          Stimmungseinträge sowie ein Beispielgespräch) hinzugefügt. Diese Daten stammen nicht von realen
          Personen und dienen ausschließlich der Veranschaulichung der Funktionen.
        </p>
        <p>
          <strong className="font-semibold text-slate-900">4.3 Selbst eingegebene Gesundheitsdaten.</strong>{" "}
          Sofern Sie eigene Einträge vornehmen: Blutzuckerwerte (mg/dL bzw. mmol/L), Insulindosen (Einheiten,
          Insulintyp), Mahlzeiten (Beschreibung, geschätzte Kohlenhydrate als Spanne mit Konfidenzangabe),
          optional Fotografien von Mahlzeiten zur KI-Analyse, körperliche Aktivitäten, Stimmungseinträge
          (Freitext und/oder Skalenwert 1–5) sowie Zeitstempel. Fotografien werden ausschließlich zur Analyse
          und ohne Pseudonym oder Benutzerkennung an OpenAI übermittelt. Nach der Auswertung werden sie
          verworfen und nicht in der App gespeichert. Bitte laden Sie keine Aufnahmen hoch, auf denen Personen
          erkennbar sind. Beachten Sie zudem, dass Bilddateien Standortinformationen (EXIF-Daten) enthalten
          können.
        </p>
        <p>
          <strong className="font-semibold text-slate-900">4.4 Kommunikationsdaten.</strong> Ihre Nachrichten an
          den KI-Chatbot &quot;Gluco&quot;, dessen Antworten, KI-generierte Gesprächszusammenfassungen sowie
          KI-generierte Emotionsauswertungen.
        </p>
        <p>
          <strong className="font-semibold text-slate-900">4.5 Technische Daten.</strong> Eine pseudonyme
          Benutzerkennung (UUID) sowie Session-Cookies zur Authentifizierung (httpOnly; keine Tracking-Cookies).
          Beim Hosting fallen serverseitige Protokolldaten einschließlich IP-Adressen an; diese werden für
          höchstens 30 Tage gespeichert und ausschließlich zur Gewährleistung der Systemsicherheit sowie zur
          Fehleranalyse verwendet.
        </p>
        <p>
          <strong className="font-semibold text-slate-900">4.6 Befragungsdaten.</strong> Sobald du den
          Evaluations-Fragebogen ausfüllst, speichern wir deine Antworten (geschlossene Items und Freitext)
          pseudonymisiert unter deiner Benutzer-ID. Spätestens nach Abschluss der Studie werden sie gelöscht.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-semibold text-slate-900">5. Einsatz künstlicher Intelligenz</h2>
        <p>
          <strong className="font-semibold text-slate-900">5.1 Chatbot &quot;Gluco&quot;.</strong> Gluco ist ein
          KI-gestützter Chatbot zur Unterstützung des emotionalen Selbstmanagements und orientiert sich an
          Ansätzen der kognitiven Verhaltenstherapie (KVT). Er ist kein Therapeut, kein Arzt und kein
          Medizinprodukt. Seine Antworten können fehlerhaft sein.
        </p>
        <p>
          <strong className="font-semibold text-slate-900">5.2 Texterkennung im Tagebuch.</strong> Eine
          Erkennungsfunktion wandelt Freitexteingaben in strukturierte Einträge um. KI-geschätzte
          Kohlenhydratwerte werden mit einer Konfidenzangabe (niedrig / mittel / hoch) ausgewiesen und können
          nach Komponenten aufgeschlüsselt werden. Diese Werte sind grobe Richtwerte, ersetzen keine
          professionelle Ernährungs- oder Diabetesberatung und dürfen nicht als Grundlage für
          Insulindosierungen herangezogen werden. Von Ihnen vorgenommene Korrekturen werden gespeichert, um die
          Schätzqualität künftig zu verbessern.
        </p>
        <p>
          <strong className="font-semibold text-slate-900">
            5.3 Stimmungs- und Emotionsanalyse (Profiling).
          </strong>{" "}
          Freitext-Stimmungseinträge werden automatisch in einen numerischen Wert (1–5) überführt. Gespräche mit
          Gluco werden nach ihrer Beendigung emotional ausgewertet. Diese Verarbeitungen stellen ein Profiling
          im Sinne von Art. 4 Nr. 4 DSGVO dar. Eine automatisierte Entscheidung im Einzelfall mit rechtlicher
          oder ähnlich erheblicher Wirkung im Sinne von Art. 22 DSGVO findet nicht statt.
        </p>
        <p>
          <strong className="font-semibold text-slate-900">
            5.4 Transparenzhinweis nach der KI-Verordnung (EU AI Act).
          </strong>{" "}
          Nach der Verordnung (EU) 2024/1689 über künstliche Intelligenz weise ich darauf hin, dass Sie in
          dieser App mit einem KI-System interagieren. Alle KI-generierten Inhalte werden automatisch erstellt
          und nicht durch einen Menschen geprüft. Die KI-Funktionen dienen ausschließlich Forschungszwecken.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-semibold text-slate-900">6. Empfänger und Auftragsverarbeitung</h2>
        <p>
          Die nachfolgenden Dienstleister werden als Auftragsverarbeiter gemäß Art. 28 DSGVO eingesetzt. Mit
          allen Anbietern bestehen entsprechende Auftragsverarbeitungsverträge bzw.
          Datenverarbeitungsvereinbarungen:
        </p>
        <p>
          <strong className="font-semibold text-slate-900">Supabase</strong> – Bereitstellung der Datenbank
          (PostgreSQL). Verarbeitet werden sämtliche Nutzerdaten in pseudonymer Form. Serverstandort: EU
          (Frankfurt am Main).
        </p>
        <p>
          <strong className="font-semibold text-slate-900">OpenAI</strong> – KI-Verarbeitung (Chat,
          Texterkennung, Zusammenfassungen sowie Stimmungs- und Bildanalyse). Verarbeitet werden Textnachrichten,
          Tagebucheinträge sowie hochgeladene Mahlzeitenfotos, jeweils ohne Benutzerkennung und ohne Pseudonym.
          Serverstandort: USA.
        </p>
        <p>
          <strong className="font-semibold text-slate-900">Vercel</strong> – Hosting der Web-Anwendung.
          Verarbeitet werden HTTP-Anfragen und IP-Adressen im Rahmen serverseitiger Protokolle (Speicherung
          höchstens 30 Tage). Serverstandort: USA.
        </p>
        <p>
          <strong className="font-semibold text-slate-900">Hinweis zur Drittlandübermittlung:</strong> Die
          Übermittlung an OpenAI und Vercel (USA) erfolgt auf Grundlage der von diesen Anbietern
          bereitgestellten EU-Standardvertragsklauseln gemäß Art. 46 Abs. 2 lit. c DSGVO. Ergänzend wird die
          Übermittlung auf Ihre ausdrückliche Einwilligung gemäß Art. 49 Abs. 1 lit. a DSGVO gestützt. Trotz
          dieser Schutzmaßnahmen kann nicht ausgeschlossen werden, dass US-amerikanische Behörden auf diese Daten
          zugreifen. Die Übermittlung erfolgt in pseudonymisierter Form; für die Nutzung der
          OpenAI-Programmierschnittstelle ist der Ausschluss der Verwendung zu Trainingszwecken aktiviert.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900">7. Datensicherheit</h2>
        <p>
          Zum Schutz Ihrer Daten werden geeignete technische und organisatorische Maßnahmen getroffen: Der
          Zugang erfolgt ausschließlich über ein Pseudonym und eine PIN, ohne Erhebung von Klarnamen. Sämtliche
          Datenübertragungen sind durch HTTPS/TLS verschlüsselt. Die PIN wird ausschließlich als bcrypt-Hash
          gespeichert. Eine serverseitige Datentrennung mittels Row Level Security (RLS) stellt sicher, dass
          jede nutzende Person ausschließlich auf ihre eigenen Daten zugreifen kann. Der Zugang zur App ist
          überdies durch einen Zugangscode beschränkt, der nur an Studienteilnehmende ausgegeben wird.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900">8. Speicherdauer und Löschung</h2>
        <p>
          Ihre Daten werden bis zum Abschluss der Auswertung aller Fragebögen gespeichert, längstens jedoch bis
          zum 31. Dezember 2026. Anschließend werden sie vollständig und unwiderruflich gelöscht. In die
          Bachelorarbeit fließen ausschließlich anonymisierte und aggregierte Auswertungen ein. Im Falle eines
          vorzeitigen Widerrufs werden Ihre Daten innerhalb von 14 Tagen gelöscht.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900">9. Ihre Rechte</h2>
        <p>Ihnen stehen hinsichtlich der Sie betreffenden personenbezogenen Daten die folgenden Rechte zu:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Recht auf Auskunft (Art. 15 DSGVO)</li>
          <li>Recht auf Berichtigung (Art. 16 DSGVO)</li>
          <li>Recht auf Löschung (Art. 17 DSGVO)</li>
          <li>Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
          <li>Recht auf Datenübertragbarkeit (Art. 20 DSGVO)</li>
          <li>Recht auf Widerruf einer erteilten Einwilligung (Art. 7 Abs. 3 DSGVO)</li>
        </ul>
        <p>
          Zur Wahrnehmung dieser Rechte genügt eine formlose Mitteilung an lilia@schraut.de. Bei Auskunfts- und
          Löschersuchen geben Sie zur Zuordnung bitte Ihr Pseudonym an.
        </p>
        <p>
          <strong className="font-semibold text-slate-900">Beschwerderecht (Art. 77 DSGVO):</strong> Unbeschadet
          anderweitiger Rechtsbehelfe steht Ihnen ein Beschwerderecht bei einer Datenschutzaufsichtsbehörde zu.
          Zuständig ist das Bayerische Landesamt für Datenschutzaufsicht (BayLDA), Promenade 18, 91522 Ansbach.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900">10. Altersbeschränkung</h2>
        <p>Die Teilnahme an der Studie und die Nutzung der App sind ausschließlich für Personen ab 18 Jahren vorgesehen.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900">
          11. Aktualität und Änderung dieser Datenschutzerklärung
        </h2>
        <p>
          Diese Datenschutzerklärung hat den Stand Mai 2026. Sollten Anpassungen der App oder der eingesetzten
          Dienste eine Änderung erforderlich machen, wird die jeweils aktuelle Fassung innerhalb der App
          bereitgestellt.
        </p>
      </section>
    </article>
  )
}
