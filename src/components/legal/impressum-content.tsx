/**
 * Impressum (German) — copy-frozen legal text for /impressum.
 */
export function ImpressumContent() {
  return (
    <article className="space-y-5 text-sm leading-relaxed text-slate-700">
      <header className="space-y-2 border-b border-slate-200 pb-6">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Impressum</h1>
      </header>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900">
          Angaben gemäß § 5 TMG / § 18 Abs. 2 MStV
        </h2>
        <p>
          Lilia Schraut
          <br />
          Fischartstraße 15
          <br />
          E-Mail:{" "}
          <a href="mailto:lilia@schraut.de" className="text-teal-700 underline underline-offset-2">
            lilia@schraut.de
          </a>
        </p>
      </section>

      <section className="space-y-3">
        <p>
          Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV: Lilia Schraut, Anschrift wie oben.
        </p>
      </section>

      <section className="space-y-3">
        <p>
          Diese App ist ein Forschungsprototyp im Rahmen einer Bachelorarbeit am Institut für
          Kommunikationswissenschaft (IfKW) der Ludwig-Maximilians-Universität München. Betreut durch PD Dr.
          Claudia Riesmeyer.
        </p>
      </section>

      <section className="space-y-3">
        <p>
          <strong>Haftungsausschluss:</strong> Diese App ist kein Medizinprodukt und ersetzt keine ärztliche
          Beratung. KI-generierte Inhalte können fehlerhaft sein.
        </p>
      </section>
    </article>
  )
}
