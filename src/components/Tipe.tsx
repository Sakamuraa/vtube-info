import { Link } from "react-router-dom";

/**
 * Display faces side by side, at the sizes they would actually be used at.
 *
 * This exists because the typeface has been chosen twice already without anyone
 * looking at it rendered. Cormorant Garamond read as too plain. Bodoni Moda --
 * a Didone set at font-semibold -- read as glamour rather than the quiet
 * prestige that was asked for. Both verdicts were argued from metrics, and
 * neither was checked against the rendered page.
 *
 * So each face is shown three ways, and the first two rows are the ones that
 * matter:
 *
 *   600  the weight every display element on this site is currently set in
 *   400  the same line lighter, which is where most of these faces actually live
 *   18px the nav wordmark, where a Didone's hairlines start to fail
 *
 * Judging a serif at a single weight is what produced the wrong answer twice.
 */

interface Candidate {
  family: string;
  /** Cinzel is a titling face and ships no italic; the accent word needs one. */
  italic: boolean;
  /** What the face is for, and where it would go wrong. */
  note: string;
}

const CANDIDATES: Candidate[] = [
  {
    family: "Bodoni Moda Variable",
    italic: true,
    note: "Yang sekarang dipakai. Didone berkontras tinggi, tapi di bobot 600 batang hurufnya membesar dan kontras yang justru membuatnya terasa mewah justru menghilang.",
  },
  {
    family: "Fraunces Variable",
    italic: true,
    note: "Old-style hangat yang serasi dengan peach. Punya sumbu SOFT dan WONK, jadi bisa dijaga tetap kalem; kalau dibiarkan apa adanya, ia jadi sangat khas dan bukan yang tenang.",
  },
  {
    family: "Newsreader Variable",
    italic: true,
    note: "Dibuat khusus untuk layar, dengan kaligrafi yang tenang. Paling mendekati Mendelahan: tidak mencolok, tapi juga tidak terlihat murah.",
  },
  {
    family: "Cormorant Variable",
    italic: true,
    note: "Klasik yang lapang dan halus. Cocok kalau yang dicari kesegaran; risikonya terasa rapuh pada ukuran kecil.",
  },
  {
    family: "Cinzel Variable",
    italic: false,
    note: "Roman kapital yang monumental, dan yang Sam pilih untuk Kasdea. Tidak punya italic, jadi kata aksennya harus diganti.",
  },
];

const HERO = "The people behind the";
const ACCENT = "streams";

export function Tipe() {
  return (
    <section className="mx-auto max-w-6xl px-5 sm:px-8">
      <div className="border-b border-[var(--line)] py-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--accent)]">
          Spesimen
        </p>
        <h1 className="mt-6 max-w-[24ch] text-[clamp(1.9rem,4.5vw,3rem)] font-semibold leading-[1.08] tracking-[-0.01em]">
          Memilih face display untuk masthead
        </h1>
        <p className="mt-5 max-w-[62ch] leading-relaxed text-[var(--text-muted)]">
          Semua face di bawah memakai teks, ukuran, dan palet yang sama dengan
          home page, supaya yang dibandingkan benar-benar hasil hurufnya dan
          bukan sekadar nama typeface. Baris{" "}
          <strong className="text-[var(--text)]">600</strong> adalah bobot yang
          sekarang dipakai seluruh elemen display, dan itulah sebab Bodoni terasa
          seperti yang terjadi. Baris{" "}
          <strong className="text-[var(--text)]">400</strong> menunjukkan wajah
          sebenarnya dari tiap face.
        </p>
      </div>

      {CANDIDATES.map(({ family, italic, note }) => (
        <article key={family} className="border-b border-[var(--line)] py-10">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
            <h2 className="text-lg font-semibold">{family}</h2>
            <p className="max-w-[54ch] text-sm leading-relaxed text-[var(--text-muted)]">
              {note}
            </p>
          </div>

          <div className="mt-8 space-y-6">
            {[600, 400].map((weight) => (
              <div
                key={weight}
                className="flex flex-col gap-3 sm:flex-row sm:items-baseline sm:gap-6"
              >
                <span className="w-16 shrink-0 font-mono text-[11px] tabular-nums text-[var(--text-muted)]">
                  {weight}
                </span>
                <p
                  className="text-[clamp(1.6rem,4.4vw,2.75rem)] leading-[1.02] tracking-[-0.015em]"
                  style={{ fontFamily: `"${family}", serif`, fontWeight: weight }}
                >
                  {HERO}{" "}
                  <em
                    className="not-italic text-[var(--accent)]"
                    style={italic ? { fontStyle: "italic" } : undefined}
                  >
                    {ACCENT}
                  </em>
                  .
                </p>
              </div>
            ))}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-baseline sm:gap-6">
              <span className="w-16 shrink-0 font-mono text-[11px] tabular-nums text-[var(--text-muted)]">
                18px
              </span>
              <p
                className="text-lg font-semibold tracking-tight"
                style={{ fontFamily: `"${family}", serif` }}
              >
                VTube Info
              </p>
            </div>
          </div>
        </article>
      ))}

      <p className="py-10 text-sm leading-relaxed text-[var(--text-muted)]">
        Punya pilihan? Sebut saja namanya, dan face itu diganti di{" "}
        <code className="font-mono text-[var(--text)]">src/index.css</code>.
        Kalau belum yakin, yang paling aman untuk palet ini adalah{" "}
        <strong className="text-[var(--text)]">Newsreader</strong> di bobot 400:
        paling tidak berisiko terbaca glamor, dan paling tidak mendekati kesan
        murah.{" "}
        <Link to="/" className="underline underline-offset-4 hover:opacity-80">
          Kembali ke home
        </Link>
      </p>
    </section>
  );
}