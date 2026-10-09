/**
 * Home.
 *
 * Sam was explicit that this must not read like the two VTuber sites, and the
 * layout it was replacing did: eyebrow, big serif headline on the left, and an
 * empty rounded card on the right. That split-with-a-box shape is the default for
 * a creator profile page, so copying it made this page indistinguishable from the
 * ones it is supposed to index.
 *
 * So the structure is editorial instead. The masthead runs the full width, the
 * type is set as a broadsheet rather than a headline block, and the creators are
 * presented as a numbered index with rules -- closer to a table of contents than
 * to a card wall. There is no card, no box, and nothing floating in a column.
 *
 * Layout families on the page, deliberately all different:
 *   - masthead (full-bleed type, ruled)
 *   - index (numbered ruled rows)
 *   - closing band (centred statement)
 *
 * Motion hooks (`data-hero-*`, `data-reveal`, `data-index-row`) are read by
 * src/motion.ts. They are data attributes because they describe behaviour, not
 * appearance.
 */
import { ArrowRight } from "@phosphor-icons/react";
import { Link } from "react-router-dom";

import { creatorCount, creators, site } from "../content";

export function Home() {
  const count = creatorCount();

  return (
    <>
      {/*
        Masthead. Full width, ruled top and bottom, and the headline is set
        against the measure rather than centred -- a broadsheet masthead, not a
        hero block.
      */}
      <section className="mx-auto max-w-6xl px-5 sm:px-8">
        <div
          className="border-y border-[var(--line)] py-12 md:py-16"
          data-hero-masthead
        >
          <p
            className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--accent)]"
            data-hero-line
          >
            Direktori independen · vtube-info.xyz
          </p>

          <h1
            className="mt-8 max-w-[15ch] font-display text-[clamp(2.75rem,9vw,7rem)] font-semibold leading-[0.94] tracking-[-0.02em]"
            data-hero-title
          >
            The people behind the{" "}
            <em className="italic text-[var(--accent)]">streams</em>.
          </h1>

          <div
            className="mt-10 flex flex-col gap-8 border-t border-[var(--line)] pt-8 md:flex-row md:items-end md:justify-between"
            data-hero-foot
          >
            <p className="max-w-[42ch] text-base leading-relaxed text-[var(--text-muted)] sm:text-lg">
              {site.description} Diindeks di satu halaman, masing-masing dengan
              situsnya sendiri.
            </p>

            <div className="flex flex-wrap items-center gap-4">
<Link
                  to="/kreator"
                  className="inline-flex items-center gap-2 rounded-pill bg-[var(--accent)] px-7 py-3 text-sm font-semibold text-[var(--surface)] transition-transform hover:opacity-90 active:translate-y-px"
                >
                  Lihat kreator
                  <ArrowRight size={16} weight="bold" aria-hidden="true" />
                </Link>
              <Link
                to="/tentang"
                className="text-sm font-medium underline-offset-4 transition-colors hover:text-[var(--accent)] hover:underline"
              >
                Tentang portal ini
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/*
        The creators. Numbered rows with rules, but carrying each creator's own
        og:image -- the same picture their social card uses, so the two cannot
        drift apart.

        Deliberately not headed "Index": that word turns a page of people into a
        table of contents, and a TOC is exactly the feeling to avoid next to two
        sites that are about characters rather than listings. The count sits in
        the corner instead, which says the same thing without naming the format.
      */}
      <section className="mx-auto max-w-6xl px-5 pb-24 pt-20 sm:px-8" data-reveal>
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h2 className="font-display text-3xl font-semibold sm:text-4xl">
            Kreator
          </h2>
          <p className="text-sm text-[var(--text-muted)]">
            {count.digits} channel, {count.total} situs
          </p>
        </div>

        <ul className="mt-10 border-t border-[var(--line)]">
          {creators.map((creator, i) => (
            <li key={creator.slug} data-index-row>
              <a
                href={creator.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group grid grid-cols-[2.5rem_4.5rem_1fr] items-center gap-x-5 gap-y-4 border-b border-[var(--line)] py-8 transition-colors hover:bg-[color-mix(in_oklab,var(--surface-deep)_45%,transparent)] md:grid-cols-[3.5rem_6rem_1fr_auto] md:gap-x-8"
              >
                <span className="font-mono text-sm tabular-nums text-[var(--accent)]">
                  {String(i + 1).padStart(2, "0")}
                </span>

                {/* Their own og:image, not a generic placeholder. */}
                <img
                  src={creator.avatar}
                  alt=""
                  className="size-[4.5rem] rounded-pill border border-[var(--line)] object-cover md:size-24"
                  loading="lazy"
                  width={96}
                  height={96}
                />

                <span className="min-w-0">
                  <span className="block font-display text-3xl font-semibold leading-tight sm:text-4xl">
                    {creator.name}
                  </span>
                  <span className="mt-2 block text-sm text-[var(--text-muted)]">
                    {/* The character leads, the format trails. Same split as the
                        creator cards, and the reason the two rows do not read as
                        the same kind of entry. */}
                    <span className="text-[var(--text)]">{creator.role}</span>
                    <span aria-hidden="true"> · </span>
                    {creator.format}
                  </span>
                </span>

                <span
                  data-index-arrow
                  className="col-start-3 inline-flex items-center gap-2 text-sm font-medium text-[var(--text-muted)] transition-colors group-hover:text-[var(--accent)] md:col-start-4 md:justify-self-end"
                >
                  Buka situsnya
                  <ArrowRight
                    size={16}
                    aria-hidden="true"
                    className="transition-transform group-hover:translate-x-1"
                  />
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      {/* Closing band. Centred, and the only centred section on the page, which is
          what keeps it from reading as another layout family. */}
      <section className="border-t border-[var(--line)] py-24" data-reveal>
        <div className="mx-auto max-w-3xl px-5 text-center sm:px-8">
          <p className="font-display text-3xl font-medium leading-snug sm:text-4xl">
            Setiap kreator punya situsnya sendiri. Halaman ini cuma indeksnya.
          </p>
          <p className="mt-6 text-sm leading-relaxed text-[var(--text-muted)]">
            Semua karya di halaman-halaman itu milik kreatornya, dan tautan resmi
            mereka ada di tiap baris index.
          </p>
        </div>
      </section>
    </>
  );
}