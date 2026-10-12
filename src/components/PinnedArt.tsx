import { ArrowUpRight } from "@phosphor-icons/react";
import { useEffect, useState } from "react";

/**
 * Pinned art card.
 *
 * Sam asked for NapLive's art to sit at the very top of the portal, above the
 * masthead, as its own pinned card. It fetches NapLive's own /api/art
 * client-side and shows the latest few pieces, linking through to that site's
 * /art page. If the endpoint is unreachable it renders nothing rather than an
 * empty frame -- the portal has no art of its own to fall back on.
 */
const NAPLIVE = "https://naplive.vtube-info.xyz";

type ArtItem = { id: string; url: string; image: string };

export function PinnedArt() {
  const [art, setArt] = useState<ArtItem[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${NAPLIVE}/api/art`, { signal: controller.signal, headers: { accept: "application/json" } })
      .then((r) => (r.ok ? r.json() : null))
      .then((payload: { art?: ArtItem[] } | null) => {
        if (payload && Array.isArray(payload.art)) setArt(payload.art.slice(0, 4));
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  if (art.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-5 pt-10 sm:px-8">
      <a
        href={`${NAPLIVE}/media`}
        target="_blank"
        rel="noopener noreferrer"
        className="group block rounded-3xl border border-[var(--line)] bg-[color-mix(in_oklab,var(--surface-deep)_40%,transparent)] p-5 transition-colors hover:border-[var(--accent)] sm:p-6"
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--accent)]">
              Pinned
            </p>
            <h2 className="mt-1 font-display text-xl font-semibold sm:text-2xl">
              Art pilihan · NapLive
            </h2>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-[var(--text-muted)] transition-colors group-hover:text-[var(--accent)]">
            Lihat semua
            <ArrowUpRight
              size={16}
              aria-hidden="true"
              className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {art.map((item) => (
            <img
              key={item.id}
              src={item.image}
              alt=""
              loading="lazy"
              decoding="async"
              className="aspect-square w-full rounded-2xl border border-[var(--line)] object-cover"
            />
          ))}
        </div>
      </a>
    </section>
  );
}
