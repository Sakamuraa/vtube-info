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
import { useLive, type LiveEntry } from "../useLive";

export function Home() {
  const count = creatorCount();
  const { live, settled } = useLive();

  /*
   * The band only exists when somebody is actually broadcasting.
   *
   * An "On Live" heading over an empty state is a promise the page cannot keep
   * most of the time -- five channels are rarely all offline at once, so the
   * honest default is to render nothing at all. `settled` keeps it hidden while
   * the answer is still unknown, so the section never flashes in and then out on
   * load.
   */
  const showLive = settled && live.length > 0;

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

      {showLive && <OnLive entries={live} />}

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

/**
 * The live band.
 *
 * Sits between the masthead and the index, above "Kreator", because it is the one
 * thing on this page that is about right now rather than about a directory.
 *
 * Laid out as a ruled row rather than a card, on purpose: the masthead above and
 * the index below are both ruled and full-bleed, and a single floating card in
 * between them would be the exact layout family this page was built to avoid.
 *
 * The dot pulses because "live" is the one claim on the site that decays on its
 * own. It is `aria-hidden`, with the word "Live" carrying the same information to
 * a screen reader -- the animation is for people who can see it.
 */
function OnLive({ entries }: { entries: LiveEntry[] }) {
  return (
    <section className="mx-auto max-w-6xl px-5 pt-16 sm:px-8" data-reveal>
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h2 className="flex items-center gap-3 font-display text-3xl font-semibold sm:text-4xl">
          <span className="relative flex size-3" aria-hidden="true">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-[var(--accent)] opacity-70" />
            <span className="relative inline-flex size-3 rounded-full bg-[var(--accent)]" />
          </span>
          On Live
        </h2>
        <p className="text-sm text-[var(--text-muted)]">
          {entries.length === 1 ? "1 sedang streaming" : `${entries.length} sedang streaming`}
        </p>
      </div>

      {/*
        `data-stagger` is read by src/motion.ts and animates the rows on scroll,
        the same way the index below does. Reusing it rather than a new hook keeps
        the live band and the index feeling like one page.
      */}
      <ul className="mt-8 border-t border-[var(--line)]" data-stagger>
        {entries.map((entry) => (
          <li key={entry.slug}>
            <a
              href={entry.streamUrl || entry.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group grid grid-cols-[3.5rem_1fr] items-center gap-x-5 gap-y-3 border-b border-[var(--line)] py-6 transition-colors hover:bg-[color-mix(in_oklab,var(--surface-deep)_45%,transparent)] md:grid-cols-[4.5rem_1fr_auto] md:gap-x-8"
            >
              <img
                src={entry.avatar}
                alt=""
                className="size-[3.5rem] rounded-pill border border-[var(--line)] object-cover md:size-[4.5rem]"
                loading="lazy"
                width={72}
                height={72}
              />

              <span className="min-w-0">
                <span className="block font-display text-xl font-semibold leading-tight sm:text-2xl">
                  {entry.name}
                </span>
                {/*
                  The stream title is the creator's own words and can be long, so
                  it truncates rather than wrapping into a three-line row that
                  would break the rhythm of the list.
                */}
                <span className="mt-1 block truncate text-sm text-[var(--text-muted)]">
                  {entry.title}
                </span>
              </span>

              <span className="col-start-2 inline-flex items-center gap-3 text-sm md:col-start-3 md:justify-self-end">
                {/*
                  Null viewers prints nothing rather than "0": the instance not
                  reporting a count is not the same as a stream nobody is watching.
                */}
                {entry.viewers !== null && (
                  <span className="font-mono tabular-nums text-[var(--text-muted)]">
                    {entry.viewers.toLocaleString("id-ID")} menonton
                  </span>
                )}
                <span className="inline-flex items-center gap-2 font-medium text-[var(--text-muted)] transition-colors group-hover:text-[var(--accent)]">
                  Tonton
                  <ArrowRight
                    size={16}
                    aria-hidden="true"
                    className="transition-transform group-hover:translate-x-1"
                  />
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}