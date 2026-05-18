/**
 * Full privacy policy (English) — copy-frozen legal text for /privacy (en locale).
 */
export function PrivacyPolicyContentEn() {
  return (
    <article className="space-y-5 text-sm leading-relaxed text-slate-700">
      <header className="space-y-2 border-b border-slate-200 pb-6">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          GlucoCompanion — Privacy Policy
        </h1>
        <p className="text-base text-slate-600">Research prototype for diabetes self-management</p>
        <p className="text-sm text-slate-500">As of: May 2026</p>
      </header>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900">1. Controller</h2>
        <p>Controller within the meaning of the GDPR:</p>
        <p>Lilia Schraut</p>
        <p>Fischartstraße 15, 80686 Munich, Germany</p>
        <p>Email: lilia@schraut.de</p>
        <p>
          Data processing takes place in the context of a bachelor&apos;s thesis at Ludwig-Maximilians-Universität
          Munich, supervised by PD Dr. Claudia Riesmeyer (Institute of Communication Studies, IfKW). LMU Munich
          does not provide technical infrastructure for this thesis; the data processing described here is the sole
          responsibility of Lilia Schraut.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900">2. Purpose of processing</h2>
        <p>
          GlucoCompanion is a research prototype developed as part of a scientific thesis. The app explores how
          AI-supported features can support emotional and metabolic self-management for people with diabetes. The
          app is not a medical device and does not replace medical or therapeutic advice. Data collected are used
          solely for scientific analysis in the context of the bachelor&apos;s thesis. There is no commercial use.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900">3. Legal basis</h2>
        <p>
          Processing is based on your explicit consent pursuant to Art. 6(1)(a) GDPR in conjunction with Art.
          9(2)(a) GDPR (consent to processing special categories of personal data, here: health data). You may
          withdraw your consent at any time with effect for the future, without affecting the lawfulness of
          processing carried out before withdrawal.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-semibold text-slate-900">4. What data are collected?</h2>
        <p>
          <strong className="font-semibold text-slate-900">4.1 Registration data:</strong> Freely chosen pseudonym
          (no real name required), PIN (stored as a bcrypt hash — the PIN itself is not stored). No email
          addresses, names, or phone numbers are collected.
        </p>
        <p>
          <strong className="font-semibold text-slate-900">4.2 Demo data:</strong> On registration, fictional
          sample data (blood glucose values, meals, insulin, mood entries, one sample conversation) are loaded into
          your account. This data does not come from real people with diabetes and serves to demonstrate app
          features.
        </p>
        <p>
          <strong className="font-semibold text-slate-900">4.3 User-generated health data:</strong> If you create
          your own entries: blood glucose values (mg/dL or mmol/L), insulin doses (units, insulin type), meals
          (description, estimated carbohydrates), physical activity, mood entries (free text and/or scale value
          1–5), timestamps of all entries.
        </p>
        <p>
          <strong className="font-semibold text-slate-900">4.4 Conversation data (Diabetes Buddy):</strong> Your
          messages to the AI chatbot, the chatbot&apos;s replies, AI-generated conversation summaries, AI-generated
          emotion analyses.
        </p>
        <p>
          <strong className="font-semibold text-slate-900">4.5 Technical data:</strong> Pseudonymised user ID
          (UUID), session cookies for authentication (httpOnly, no tracking cookies). Via Vercel (hosting),
          server logs including IP addresses are generated; these are stored for a maximum of 30 days and used
          solely for attack prevention and error analysis.
        </p>
        <p>
          <strong className="font-semibold text-slate-900">4.6 Questionnaire responses:</strong> When you complete
          the study questionnaire, we store your answers (both scale ratings and free-text responses) in
          pseudonymised form under your user ID. The answers are used solely for scientific evaluation as part
          of the bachelor&apos;s thesis and will be deleted by 31 December 2026 at the latest.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-semibold text-slate-900">5. Use of artificial intelligence</h2>
        <p>
          <strong className="font-semibold text-slate-900">5.1 Diabetes Buddy (chatbot):</strong> The Diabetes Buddy
          is an AI-supported chatbot for emotional self-management. It follows cognitive-behavioural therapy (CBT)
          approaches. It is not a therapist, not a doctor, and not a medical device. Its answers may be wrong.
        </p>
        <p>
          <strong className="font-semibold text-slate-900">5.2 Logbook extraction:</strong> The extraction feature
          turns free-text input into structured entries. AI-estimated carbohydrate values are rough estimates and
          do not replace professional dietary or diabetes advice. They must not be used as a basis for insulin
          dosing.
        </p>
        <p>
          <strong className="font-semibold text-slate-900">5.3 Mood analysis and profiling:</strong> Free-text mood
          entries are automatically converted to a numeric value (1–5). Conversations with the Buddy are analysed
          emotionally after they end. This processing constitutes profiling within the meaning of Art. 4(4) GDPR.
          However, no automated decision with legal or similarly significant effect within the meaning of Art. 22
          GDPR takes place.
        </p>
        <p>
          <strong className="font-semibold text-slate-900">5.4 Transparency notice under the EU AI Act:</strong> Under
          the EU Artificial Intelligence Act, we inform you that you interact with an AI system in this app. All
          AI-generated content is created automatically and is not reviewed by a human. The AI features are for
          research purposes only.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-semibold text-slate-900">
          6. Transfers to third parties / processors
        </h2>
        <p>
          The following external providers are used as processors pursuant to Art. 28 GDPR. Data processing
          agreements are in place with all providers:
        </p>
        <p>
          <strong className="font-semibold text-slate-900">Supabase</strong> — Purpose: database (PostgreSQL). Data:
          all user data (pseudonymised). Server location: EU (Frankfurt).
        </p>
        <p>
          <strong className="font-semibold text-slate-900">OpenAI</strong> — Purpose: AI processing (chat,
          extraction, summaries, mood analysis). Data: text messages, logbook entries (without user ID and without
          pseudonym). Server location: USA. Data exclusion for training purposes has been activated via the API.
        </p>
        <p>
          <strong className="font-semibold text-slate-900">Vercel</strong> — Purpose: hosting the web app. Data:
          HTTP requests, IP addresses (server logs, max. 30 days). Server location: USA.
        </p>
        <p>
          <strong className="font-semibold text-slate-900">Note on transfers to third countries:</strong> Transfers
          to OpenAI and Vercel (USA) are based on the EU Standard Contractual Clauses provided by those vendors
          pursuant to Art. 46(2)(c) GDPR. In addition, we rely on your explicit consent pursuant to Art. 49(1)(a)
          GDPR. Despite these safeguards, US authorities may theoretically access such data. Your data are
          transferred in pseudonymised form.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900">7. Data security</h2>
        <p>Pseudonymisation; HTTPS/TLS; PIN stored as bcrypt hash; row-level security (RLS) at database level.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900">8. Retention and deletion</h2>
        <p>
          Your data are stored until all questionnaires have been evaluated, at the latest until 31 December
          2026. After that, full and irreversible deletion. Only anonymised, aggregated analyses are included in
          the bachelor&apos;s thesis. Early withdrawal: data are deleted within 14 days.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900">9. Your rights</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="font-semibold text-slate-900">Withdraw consent (Art. 7(3)):</strong> by email to
            lilia@schraut.de.
          </li>
          <li>
            <strong className="font-semibold text-slate-900">Access (Art. 15):</strong> by email.
          </li>
          <li>
            <strong className="font-semibold text-slate-900">Erasure (Art. 17):</strong> by email to lilia@schraut.de,
            stating your pseudonym.
          </li>
          <li>
            <strong className="font-semibold text-slate-900">Rectification (Art. 16):</strong> by email.
          </li>
          <li>
            <strong className="font-semibold text-slate-900">Data portability (Art. 20):</strong> by email.
          </li>
          <li>
            <strong className="font-semibold text-slate-900">Complaint (Art. 77):</strong> Bavarian State Office for
            Data Protection Supervision (BayLDA).
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900">10. Age restriction</h2>
        <p>Participation is intended only for people aged 18 and over.</p>
      </section>
    </article>
  )
}
