import { Link } from "react-router-dom";

/**
 * Sans candidates side by side, at the sizes they would actually be used at.
 *
 * The first round of this specimen offered five serifs and every one was wrong.
 * Sam's reference for "elit dan elegan" turned out to be a Jost semibold heading
 * on this very page -- set in the BODY face, not the display face -- which says
 * the register being asked for was a geometric sans the whole time. Jost now
 * ships as both the display and the reading face; this route is here in case
 * something in that register reads better still.
 *
 * Each face is shown at 600, the weight the masthead is set in, and at 18px,
 * the nav wordmark. Both matter: a geometric sans that looks composed at 112px
 * can go shapeless at 18, and the wordmark is where that shows first.
 */

interface Candidate {
  family: string;
  /** Manrope and Sora have no italic in Fontsource; the accent word needs one. */
  italic: boolean;
  /** What the face is for, and where it would go wrong. */
  note: string;
}

const CANDIDATES: Candidate[] = [
  {
    family: "Jost Variable",
    italic: true,
    note: "Referensi Sam, dan yang sekarang dipakai untuk masthead maupun teks. Geometris ala Futura: besar, tenang, dan tidak banyak bertingkah.",
  },
  {
    family: "Plus Jakarta Sans Variable",
    italic: true,
    note: "Dirancang untuk Jakarta, jadi paling nyambung dengan konteksnya. Sedikit lebih hangat dan humanist daripada Jost, lebih kecil dari huruf besarnya.",
  },
  {
    family: "Schibsted Grotesk Variable",
    italic: true,
    note: "Neo-grotesk yang tetap sopan dan tidak·semboyan. Karakter ‘elit’ paling halus di daftar ini, dan risikonya jadi terlalu pelan.",
  },
  {
    family: "Manrope Variable",
    italic: false,
    note: "Geometris modern yang hangat, dengan angka yang enak dibaca. Cocok kalau nanti ada hitungan di dalam teks; tidak punya italic.",
  },
  {
    family: "Sora Variable",
    italic: false,
    note: "Geometris dengan lengkung yang terasa sendiri. Paling ‘desain’ di daftar, dan justru itu yang membuatnya kurang tenang untuk masthead.",
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
          Putar pertama halaman ini menawarkan lima serif, dan kelimanya salah.
          Acuan yang Sam maksud ternyata ada di halaman ini juga: baris judul di
          atas, yang memakai face teks. Masthead sekarang memakai face yang sama.
          Kalau di daftar ini ada yang lebih enak, sebut namanya.
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
            <div className="flex flex-col gap-3 sm:flex-row sm:items-baseline sm:gap-6">
              <span className="w-16 shrink-0 font-mono text-[11px] tabular-nums text-[var(--text-muted)]">
                600
              </span>
              <p
                className="text-[clamp(1.6rem,4.4vw,2.75rem)] leading-[1.02] tracking-[-0.015em]"
                style={{ fontFamily: `"${family}", sans-serif`, fontWeight: 600 }}
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

            <div className="flex flex-col gap-3 sm:flex-row sm:items-baseline sm:gap-6">
              <span className="w-16 shrink-0 font-mono text-[11px] tabular-nums text-[var(--text-muted)]">
                18px
              </span>
              <p
                className="text-lg font-semibold tracking-tight"
                style={{ fontFamily: `"${family}", sans-serif` }}
              >
                VTube Info
              </p>
            </div>
          </div>
        </article>
      ))}

      <p className="py-10 text-sm leading-relaxed text-[var(--text-muted)]">
        Punya pilihan? Sebut saja namanya, dan face itu menggantikan{" "}
        <code className="font-mono text-[var(--text)]">--font-display</code> di{" "}
        <code className="font-mono text-[var(--text)]">src/index.css</code>. Kalau
        tidak,{" "}
        <strong className="text-[var(--text)]">Jost</strong> tetap menjadi pilihan
        karena itu memang yang Sam tunjuk.{" "}
        <Link to="/" className="underline underline-offset-4 hover:opacity-80">
          Kembali ke home
        </Link>
      </p>
    </section>
  );
}