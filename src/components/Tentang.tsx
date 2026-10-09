/**
 * About.
 *
 * Sam's note on the previous version was that it was "ngawur" -- invented
 * flavour text and a pull quote nobody said. So this page now carries facts
 * instead: who built it, where the code is, and what it is made of. Every link
 * here is a real URL and every version is the one actually installed.
 *
 * The layout is a single editorial column, deliberately unlike both the home
 * masthead and the creator grid.
 *
 * `data-reveal` and `data-stagger` are read by src/motion.ts.
 */
import { ArrowSquareOut, GithubLogo } from "@phosphor-icons/react";

import { creatorCount, developer, site } from "../content";

/**
 * The stack, as installed in package.json. Not aspirational and not rounded off:
 * if a version here drifts from the manifest, the manifest is right.
 */
const STACK: { name: string; note: string }[] = [
  { name: "React 19", note: "Routing dan komponen" },
  { name: "TypeScript", note: "Strict, tanpa toleransi implicit" },
  { name: "Vite 8", note: "Build dan bundling" },
  { name: "Tailwind CSS 4", note: "Token warna dan layout" },
  { name: "anime.js 4", note: "Semua animasi halaman" },
];

export function Tentang() {
  const count = creatorCount();

  return (
    <article className="mx-auto max-w-3xl px-5 py-16 sm:px-8 md:py-24">
      <header data-reveal>
        <h1 className="font-display text-4xl font-semibold sm:text-5xl">
          Tentang {site.name}
        </h1>
        <p className="mt-6 max-w-[52ch] text-lg leading-relaxed text-[var(--text-muted)]">
          Indeks {count.digits} channel VTuber Indonesia. Setiap kreator punya
          situsnya sendiri, dan halaman ini hanya menautkannya.
        </p>
      </header>

      {/* Developer. The reason this page exists. */}
      <section className="mt-16" data-reveal>
        <h2 className="font-display text-2xl font-semibold">Pembuat</h2>

        <div className="mt-6 border-t border-[var(--line)] pt-8">
          <a
            href={developer.profile}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start gap-5 transition-colors hover:text-[var(--accent)]"
          >
            <span
              aria-hidden="true"
              className="mt-1 grid size-12 shrink-0 place-items-center rounded-pill border border-[var(--line)] bg-[var(--surface-deep)]"
            >
              <GithubLogo size={22} weight="fill" />
            </span>

            <span className="min-w-0">
              {/* The name is Sakamura. The account behind the link is
                  Sakamuraa. Both are right and they are not the same string, so
                  they are read from two fields rather than one. */}
              <span className="flex items-center gap-2 font-display text-2xl font-semibold">
                {developer.name}
                <ArrowSquareOut
                  size={16}
                  aria-hidden="true"
                  className="text-[var(--text-muted)] transition-transform group-hover:translate-x-0.5"
                />
              </span>
              <span className="mt-1 block font-mono text-sm text-[var(--text-muted)]">
                @{developer.handle}
              </span>
            </span>
          </a>
        </div>
      </section>

      {/* Stack. Real versions, from the manifest. */}
      <section className="mt-16" data-reveal>
        <h2 className="font-display text-2xl font-semibold">Dibangun dengan</h2>
        <dl className="mt-6 divide-y divide-[var(--line)] border-y border-[var(--line)]">
          {STACK.map((item) => (
            <div
              key={item.name}
              className="grid grid-cols-1 gap-1 py-4 sm:grid-cols-[11rem_1fr] sm:gap-6"
            >
              <dt className="font-mono text-sm">{item.name}</dt>
              <dd className="text-sm text-[var(--text-muted)]">{item.note}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* The one caveat worth stating plainly. */}
      <section className="mt-16" data-reveal>
        <h2 className="font-display text-2xl font-semibold">Catatan</h2>
        <p className="mt-5 leading-relaxed text-[var(--text-muted)]">
          Halaman fans, bukan halaman resmi. Konten, artwork, dan seluruh materi
          di tiap situs kreator milik kreatornya. Tautan kanal resmi ada di setiap
          baris index, jadi tumor dan supporternya sampai ke kreatornya sendiri,
          tidak lewat halaman ini.
        </p>
      </section>
    </article>
  );
}