/**
 * The creators index.
 *
 * Same information as the home index, deliberately not the same layout: home is
 * ruled rows, this is a grid with the avatar and the real channel links -- two
 * columns on tablet, four on desktop, so eight cards fill two rows rather than
 * four. A page that lists the same creators twice has to earn the second
 * view, and repeating the first layout would look like a duplicate rather than
 * a fuller one.
 *
 * Every count in the copy is derived from the creators array, so adding an entry
 * updates the sentence instead of leaving a stale number behind.
 *
 * `data-reveal`, `data-stagger` and `data-parallax` are read by src/motion.ts.
 */
import { ArrowSquareOut } from "@phosphor-icons/react";

import { creatorCount, creators, type Creator } from "../content";

/**
 * The slug pinned above the grid, alone and full-width.
 *
 * Pulled out of the array by slug rather than by moving it to the front of the
 * array: a pinned slot is an editorial decision, and array order is also read by
 * the home page's featured slice and by /konten -- reordering to pin would move
 * the creator there too. Hoisting by slug keeps the grid order untouched and
 * keeps the pin where it was asked for.
 */
const PINNED_SLUG = "naplive";

export function Kreator() {
  const count = creatorCount();
  const pinned = creators.find((creator) => creator.slug === PINNED_SLUG);
  const rest = creators.filter((creator) => creator.slug !== PINNED_SLUG);

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

      {/* The pinned card sits above the grid as its own full-width block, so it
          reads as a featured entry rather than as the first cell of the grid.
          It renders nothing if the slug is missing -- a hard-coded card that
          outlives its array entry would be a row with no data behind it. */}
      {pinned && (
        <div
          className="mt-14 rounded-3xl border border-[var(--accent)] bg-[color-mix(in_oklab,var(--surface-deep)_40%,transparent)] p-6 sm:p-8"
          data-reveal
        >
          <CreatorCard creator={pinned} pinned />
        </div>
      )}

      {/* Two columns at md keeps the card readable at tablet width; four from
          lg up is the desktop grid. The pinned slot above stays out of both --
          it is a featured block, not a grid cell. */}
      <div className="mt-14 grid gap-x-8 gap-y-14 md:grid-cols-2 lg:grid-cols-4" data-stagger>
        {rest.map((creator) => (
          <CreatorCard key={creator.slug} creator={creator} />
        ))}
      </div>
    </section>
  );
}

/**
 * One creator's card, shared by the pinned slot and the grid.
 *
 * `pinned` only changes the frame: the featured card sits inside its own
 * bordered block, so it drops the grid card's top rule and gains the eyebrow
 * and a measure cap on the blurb -- a full-width paragraph with no cap would
 * run past any comfortable line length.
 */
function CreatorCard({ creator, pinned = false }: { creator: Creator; pinned?: boolean }) {
  return (
    <article
      className={
        pinned
          ? "flex h-full flex-col"
          : "flex h-full flex-col border-t border-[var(--line)] pt-8"
      }
    >
      {pinned && (
        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--accent)]">
          Pinned
        </p>
      )}

      {/* data-parallax is read by src/motion.ts: the avatar drifts against
          its card while the card crosses the viewport. */}
      <img
        src={creator.avatar}
        alt={`Avatar ${creator.name}`}
        className={
          pinned
            ? "mt-5 size-28 rounded-pill border border-[var(--line)] object-cover"
            : "size-28 rounded-pill border border-[var(--line)] object-cover"
        }
        loading="lazy"
        data-parallax="12"
      />

      <h2
        className={
          pinned
            ? "mt-6 font-display text-4xl font-semibold leading-tight sm:text-5xl"
            : "mt-6 font-display text-3xl font-semibold leading-tight"
        }
      >
        {creator.name}
      </h2>

      {/* The character leads. "VTuber · Live 2D · ID/EN" says the same thing
          on every row and distinguishes nobody. */}
      <p className="mt-2 text-sm font-medium text-[var(--text)]">{creator.role}</p>
      <p className="mt-1 text-sm text-[var(--text-muted)]">{creator.format}</p>

      <p
        className={
          pinned
            ? "mt-5 max-w-[62ch] leading-relaxed text-[var(--text-muted)]"
            : "mt-5 leading-relaxed text-[var(--text-muted)]"
        }
      >
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
  );
}
