/**
 * Full privacy policy (English) — copy-frozen legal text for /privacy (en locale).
 */
export function PrivacyPolicyContentEn() {
  return (
    <article className="space-y-5 text-sm leading-relaxed text-slate-700">
      <header className="space-y-2 border-b border-slate-200 pb-6">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Privacy Policy</h1>
        <p className="text-sm text-slate-500">As of: May 2026</p>
      </header>

      <section className="space-y-3">
        <p>
          Protecting your personal data is very important to me. This privacy policy informs you, in accordance
          with Art. 13 General Data Protection Regulation (GDPR), which personal data are processed when you use
          the GlucoCompanion web application, for which purposes and legal basis this processing takes place, and
          which rights you have.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900">1. Controller</h2>
        <p>Controller within the meaning of Art. 4 no. 7 GDPR:</p>
        <p>
          Lilia Schraut
          <br />
          Fischartstraße 15, 80686 Munich, Germany
          <br />
          Email: lilia@schraut.de
        </p>
        <p>
          Processing is carried out within the framework of a bachelor&apos;s thesis at the Institute of
          Communication Studies and Media Research (IfKW), Ludwig-Maximilians-Universität Munich (supervisor: PD
          Dr. Claudia Riesmeyer). The university does not provide technical infrastructure for this project; the
          processing described below is carried out under the sole responsibility of Lilia Schraut.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900">2. Subject matter and purpose of processing</h2>
        <p>
          GlucoCompanion is a scientific research prototype. The subject of the study is how AI-supported
          features can support emotional and metabolic self-management for people with diabetes. Data generated
          during use are processed exclusively for scientific purposes within the above-mentioned bachelor&apos;s
          thesis; there is no commercial use.
        </p>
        <p>
          The app is not a medical device and does not replace medical, therapeutic, or nutrition-related advice.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900">3. Legal basis</h2>
        <p>
          The legal basis for processing is your explicit consent under Art. 6(1)(a) in conjunction with Art.
          9(2)(a) GDPR (consent to processing special categories of personal data - here: health data). You may
          withdraw your consent at any time. The lawfulness of processing carried out before withdrawal remains
          unaffected.
        </p>
        <p>
          Providing your data is voluntary. There is neither a legal nor a contractual obligation to provide
          data. However, without consent, use of the app is not possible, as processing is required for
          operation.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-semibold text-slate-900">4. Categories of processed data</h2>
        <p>
          <strong className="font-semibold text-slate-900">4.1 Registration data.</strong> Freely chosen pseudonym
          (no real name required) and a PIN, which is stored only as a cryptographic hash (bcrypt); the PIN
          itself is not stored. No names, email addresses, or phone numbers are collected.
        </p>
        <p>
          <strong className="font-semibold text-slate-900">4.2 Demonstration data.</strong> Upon registration,
          fictional sample data (blood glucose, meals, insulin, mood entries, and one sample conversation) are
          automatically added to your account. These data do not come from real persons and are used solely to
          demonstrate the app&apos;s features.
        </p>
        <p>
          <strong className="font-semibold text-slate-900">4.3 Self-entered health data.</strong> If you create
          your own entries: blood glucose values (mg/dL or mmol/L), insulin doses (units, insulin type), meals
          (description, estimated carbohydrates as a range with confidence indicator), optional photos of meals
          for AI analysis, physical activities, mood entries (free text and/or scale value 1-5), and timestamps.
          Photos are transmitted to OpenAI exclusively for analysis and without pseudonym or user identifier.
          After analysis, they are discarded and not stored in the app. Please do not upload images in which
          persons are identifiable. Also note that image files may contain location information (EXIF data).
        </p>
        <p>
          <strong className="font-semibold text-slate-900">4.4 Communication data.</strong> Your messages to the
          AI chatbot &quot;Gluco&quot;, its replies, AI-generated conversation summaries, and AI-generated emotion
          analyses.
        </p>
        <p>
          <strong className="font-semibold text-slate-900">4.5 Technical data.</strong> A pseudonymous user
          identifier (UUID) and session cookies for authentication (httpOnly; no tracking cookies). Server-side
          log data including IP addresses are generated during hosting; these are stored for a maximum of 30
          days and used solely to ensure system security and for error analysis.
        </p>
        <p>
          <strong className="font-semibold text-slate-900">4.6 Survey data.</strong> If you complete the study
          questionnaire, your responses (scale and free-text responses) are stored pseudonymously under your user
          identifier.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-semibold text-slate-900">5. Use of artificial intelligence</h2>
        <p>
          <strong className="font-semibold text-slate-900">5.1 Chatbot &quot;Gluco&quot;.</strong> Gluco is an
          AI-supported chatbot for emotional self-management and is oriented toward approaches from cognitive
          behavioural therapy (CBT). It is not a therapist, not a doctor, and not a medical device. Its answers
          may be inaccurate.
        </p>
        <p>
          <strong className="font-semibold text-slate-900">5.2 Text recognition in the logbook.</strong> A
          recognition feature converts free-text input into structured entries. AI-estimated carbohydrate values
          are shown with a confidence indicator (low / medium / high) and may be broken down by components. These
          values are rough estimates, do not replace professional nutritional or diabetes advice, and must not be
          used as a basis for insulin dosing. Corrections you make are stored to improve future estimate quality.
        </p>
        <p>
          <strong className="font-semibold text-slate-900">5.3 Mood and emotion analysis (profiling).</strong>{" "}
          Free-text mood entries are automatically converted into a numeric value (1-5). Conversations with
          Gluco are emotionally analyzed after they end. This processing constitutes profiling within the meaning
          of Art. 4 no. 4 GDPR. No automated individual decision with legal or similarly significant effect
          within the meaning of Art. 22 GDPR takes place.
        </p>
        <p>
          <strong className="font-semibold text-slate-900">
            5.4 Transparency notice under the AI Regulation (EU AI Act).
          </strong>{" "}
          Under Regulation (EU) 2024/1689 on artificial intelligence, I inform you that you interact with an AI
          system in this app. All AI-generated content is created automatically and is not reviewed by a human.
          The AI functions are used solely for research purposes.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-semibold text-slate-900">6. Recipients and processors</h2>
        <p>
          The following service providers are used as processors pursuant to Art. 28 GDPR. Corresponding data
          processing agreements are in place with all providers:
        </p>
        <p>
          <strong className="font-semibold text-slate-900">Supabase</strong> - Provision of the database
          (PostgreSQL). All user data in pseudonymous form are processed. Server location: EU (Frankfurt am
          Main).
        </p>
        <p>
          <strong className="font-semibold text-slate-900">OpenAI</strong> - AI processing (chat, text
          recognition, summaries, and mood and image analysis). Processed data include text messages, logbook
          entries, and uploaded meal photos, each without user identifier and without pseudonym. Server location:
          USA.
        </p>
        <p>
          <strong className="font-semibold text-slate-900">Vercel</strong> - Hosting of the web application.
          Processed data include HTTP requests and IP addresses in server-side logs (stored for a maximum of 30
          days). Server location: USA.
        </p>
        <p>
          <strong className="font-semibold text-slate-900">Note on third-country transfers:</strong> Transfers to
          OpenAI and Vercel (USA) are based on the EU Standard Contractual Clauses provided by these providers
          pursuant to Art. 46(2)(c) GDPR. Additionally, transfers are based on your explicit consent pursuant to
          Art. 49(1)(a) GDPR. Despite these safeguards, access by US authorities cannot be ruled out. Data are
          transferred in pseudonymised form; for use of the OpenAI API, the exclusion of data use for training
          purposes is activated.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900">7. Data security</h2>
        <p>
          Appropriate technical and organizational measures are implemented to protect your data: access is
          possible only via pseudonym and PIN, without collection of real names. All data transfers are encrypted
          via HTTPS/TLS. The PIN is stored exclusively as a bcrypt hash. Server-side data separation using Row
          Level Security (RLS) ensures that each user can access only their own data. Access to the app is
          additionally restricted by an access code issued only to study participants.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900">8. Retention and deletion</h2>
        <p>
          Your data are stored until completion of the evaluation of all questionnaires, but no later than 31
          December 2026. Afterwards, they are fully and irreversibly deleted. Only anonymised and aggregated
          analyses are included in the bachelor&apos;s thesis. In case of early withdrawal, your data are deleted
          within 14 days.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900">9. Your rights</h2>
        <p>You have the following rights regarding your personal data:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Right of access (Art. 15 GDPR)</li>
          <li>Right to rectification (Art. 16 GDPR)</li>
          <li>Right to erasure (Art. 17 GDPR)</li>
          <li>Right to restriction of processing (Art. 18 GDPR)</li>
          <li>Right to data portability (Art. 20 GDPR)</li>
          <li>Right to withdraw consent (Art. 7(3) GDPR)</li>
        </ul>
        <p>
          To exercise these rights, an informal notice to lilia@schraut.de is sufficient. For access or erasure
          requests, please provide your pseudonym so your data can be identified.
        </p>
        <p>
          <strong className="font-semibold text-slate-900">Right to lodge a complaint (Art. 77 GDPR):</strong>{" "}
          Without prejudice to any other remedy, you have the right to lodge a complaint with a data protection
          supervisory authority. The competent authority is the Bavarian State Office for Data Protection
          Supervision (BayLDA), Promenade 18, 91522 Ansbach, Germany.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900">10. Age restriction</h2>
        <p>Participation in the study and use of the app are intended only for persons aged 18 and over.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900">11. Current status and changes to this policy</h2>
        <p>
          This privacy policy is current as of May 2026. If changes to the app or services used require an
          update, the current version will be provided within the app.
        </p>
      </section>
    </article>
  )
}
