/**
 * The creators index.
 *
 * Same information as the home index, deliberately not the same layout: home is
 * ruled rows, this is a two-column grid with the avatar and the real channel
 * links. A page that lists the same creators twice has to earn the second
 * view, and repeating the first layout would look like a duplicate rather than a
 * fuller one.
 *
 * Every count in the copy is derived from the creators array, so adding an entry
 * updates the sentence instead of leaving a stale number behind.
 *
 * `data-reveal` and `data-stagger` are read by src/motion.ts.
 */
import { ArrowSquareOut } from "@phosphor-icons/react";

import { creatorCount, creators } from "../content";

export function Kreator() {
  const count = creatorCount();

  return (
    <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 md:py-24">
      <header
        className="max-w-2xl border-b border-[var(--line)] pb-10"
        data-reveal
      >
        <h1 className="font-display text-4xl font-semibold sm:text-5xl">Kreator</h1>
        <p className="mt-5 leading-relaxed text-[var(--text-muted)]">
          {/* Derived, not typed. "Dua channel" was hardcoded and became a lie the
              moment a third creator was added. */}
          {count.word} channel, {count.total} situs. Semua artwork di sini milik
          kreatornya; halaman ini cuma indeks.
        </p>
      </header>

      <div className="mt-14 grid gap-x-8 gap-y-14 md:grid-cols-2" data-stagger>
        {creators.map((creator) => (
          <article
            key={creator.slug}
            className="flex h-full flex-col border-t border-[var(--line)] pt-8"
          >
            <img
              src={creator.avatar}
              alt={`Avatar ${creator.name}`}
              className="size-28 rounded-pill border border-[var(--line)] object-cover"
              loading="lazy"
            />

            <h2 className="mt-6 font-display text-3xl font-semibold leading-tight">
              {creator.name}
            </h2>

            {/* The character leads. "VTuber · Live 2D · ID/EN" says the same thing
                on every row and distinguishes nobody. */}
            <p className="mt-2 text-sm font-medium text-[var(--text)]">
              {creator.role}
            </p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {creator.format}
            </p>

            <p className="mt-5 leading-relaxed text-[var(--text-muted)]">
              {creator.blurb}
            </p>

            <ul className="mt-6 flex flex-wrap gap-2">
              {creator.tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-pill bg-[color-mix(in_oklab,var(--color-butter)_40%,transparent)] px-3 py-1 font-mono text-xs text-[var(--text)]"
                >
                  {tag}
                </li>
              ))}
            </ul>

            <div className="mt-auto pt-8">
              <a
                href={creator.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-pill bg-[var(--accent)] px-6 py-2.5 text-sm font-semibold text-[var(--surface)] transition-transform hover:opacity-90 active:translate-y-px"
              >
                Buka situsnya
                <ArrowSquareOut size={15} weight="bold" aria-hidden="true" />
              </a>

              <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 border-t border-[var(--line)] pt-5 text-sm">
                {creator.channels.map((c) => (
                  <li key={c.label}>
                    <a
                      href={c.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--text-muted)] underline-offset-4 hover:text-[var(--accent)] hover:underline"
                    >
                      {c.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}