/**
 * Legal notice (English) — copy-frozen legal text for /imprint.
 */
export function ImprintContentEn() {
  return (
    <article className="space-y-5 text-sm leading-relaxed text-slate-700">
      <header className="space-y-2 border-b border-slate-200 pb-6">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Legal Notice</h1>
      </header>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900">
          Information pursuant to § 5 TMG / § 18 (2) MStV (German law)
        </h2>
        <p>
          Lilia Schraut
          <br />
          Fischartstraße 15
          <br />
          Email:{" "}
          <a href="mailto:lilia@schraut.de" className="text-teal-700 underline underline-offset-2">
            lilia@schraut.de
          </a>
        </p>
      </section>

      <section className="space-y-3">
        <p>Responsible for content pursuant to § 18 (2) MStV: Lilia Schraut, address as above.</p>
      </section>

      <section className="space-y-3">
        <p>
          This app is a research prototype developed as part of a bachelor&apos;s thesis at the Institute for
          Communication Science (IfKW), Ludwig Maximilian University of Munich. Supervised by PD Dr. Claudia
          Riesmeyer.
        </p>
      </section>

      <section className="space-y-3">
        <p>
          <strong>Disclaimer:</strong> This app is not a medical device and does not replace medical advice.
          AI-generated content may be incorrect.
        </p>
      </section>
    </article>
  )
}
