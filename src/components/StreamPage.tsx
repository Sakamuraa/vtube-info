import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import {
  ArrowLeft,
  ArrowLineDown,
  ArrowSquareOut,
  Archive,
  CaretDown,
  ChatCircle,
  Check,
  CopySimple,
  Eye,
  Play,
  Spinner,
} from "@phosphor-icons/react";

import { creators } from "../content";
import { LiveNumber } from "../LiveNumber";
import { useLive } from "../useLive";
import { useLiveChat } from "../useLiveChat";
import { useYouTubePlayer } from "../useYouTubePlayer";

/**
 * The portal's own watch page: `/streams?id=<videoId>`.
 *
 * The seven fan sites each carry a stream page under /konten/streams. This is the
 * portal's richer counterpart -- same chat/player engine (ported hooks + /api/chat),
 * but laid out in VTube Info's editorial language and carrying what only a portal
 * can: the creator's identity joined from the index, and a strip of whoever else
 * is live right now so a visitor can hop between broadcasts without leaving.
 *
 * Identity (avatar/name/role) is only known while the stream is actually live,
 * because the live list is the one reliable videoId -> slug map. A direct link to
 * an ended broadcast still works -- the chat engine serves the replay and the
 * heading falls back to the title the endpoint reads off the watch page.
 */

/** Window of replay chat shown around the playhead, in seconds. Matches the panel. */
const BEHIND_SECONDS = 90;
const AHEAD_SECONDS = 15;

export function StreamPage() {
  const [params] = useSearchParams();
  const id = (params.get("id") ?? "").trim();

  const { live } = useLive();
  const liveEntry = live.find((e) => e.videoId === id) ?? null;
  const creator = liveEntry ? creators.find((c) => c.slug === liveEntry.slug) ?? null : null;

  const { started, currentTime, mountRef } = useYouTubePlayer(id);
  const chat = useLiveChat(id, currentTime);

  const heading = liveEntry?.title || chat.title || "Siaran";
  const isLive = chat.mode === "live";

  useEffect(() => {
    document.title = `${heading} · VTube Info`;
  }, [heading]);

  const [copied, setCopied] = useState(false);
  const copyLink = useCallback(() => {
    navigator.clipboard
      ?.writeText(window.location.href)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {});
  }, []);

  const [descOpen, setDescOpen] = useState(false);

  // Other creators live right now -- the portal-only cross-nav. Dropped if their
  // slug has no entry in the index, same guard the home page uses.
  const others = live.flatMap((e) => {
    if (!e.videoId || e.videoId === id) return [];
    const c = creators.find((x) => x.slug === e.slug);
    return c ? [{ entry: e, creator: c }] : [];
  });

  if (!id) return <Missing />;

  return (
    <>
      {/* A. Identity header -- data-hero-* so motion.ts gives it a completing
          timeline entrance rather than a scroll-gated one. Never data-hero-title:
          that triggers splitText, which fights the async chat.title re-render. */}
      <section className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="border-y border-[var(--line)] py-6 md:py-8" data-hero-masthead>
          <div className="flex items-center justify-between gap-4" data-hero-line>
            <Link
              to="/"
              className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--accent)] transition-opacity hover:opacity-80"
            >
              <ArrowLeft size={14} weight="bold" aria-hidden="true" />
              Kembali ke portal
            </Link>
            <StatusPill mode={chat.mode} />
          </div>

          <div
            className="mt-6 flex flex-col gap-5 md:flex-row md:items-center md:justify-between"
            data-hero-foot
          >
            <div className="flex min-w-0 items-center gap-4">
              {creator ? (
                <img
                  src={creator.avatar}
                  alt=""
                  className="size-14 shrink-0 rounded-pill border border-[var(--line)] object-cover md:size-16"
                  loading="lazy"
                  width={64}
                  height={64}
                />
              ) : (
                <span className="size-14 shrink-0 rounded-pill border border-[var(--line)] bg-[var(--surface-deep)] md:size-16" />
              )}
              <div className="min-w-0">
                <span className="block truncate font-display text-2xl font-semibold md:text-3xl">
                  {creator?.name ?? "Siaran langsung"}
                </span>
                <span className="block text-sm text-[var(--text-muted)]">
                  {creator?.role ?? (chat.mode === "replay" ? "Replay" : "VTube Info")}
                </span>
              </div>
            </div>

            {liveEntry?.viewers != null && (
              <span
                className="inline-flex items-baseline font-mono text-sm tabular-nums text-[var(--text-muted)]"
                data-live-viewers
              >
                <LiveNumber value={liveEntry.viewers} />
                <span className="ml-1.5">menonton</span>
              </span>
            )}
          </div>
        </div>
      </section>

      {/* B. Player + chat. Deliberately NO data-* hooks: motion.ts must never
          touch this grid, or the async YouTube iframe / chat log could be left at
          opacity:0. The two functional surfaces are the only cards on the page. */}
      <section className="mx-auto max-w-6xl px-5 pt-6 sm:px-8">
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <div className="aspect-video w-full overflow-hidden rounded-card border border-[var(--line)] bg-[var(--surface-deep)]">
              <div
                ref={mountRef}
                className="size-full [&>iframe]:size-full [&>iframe]:border-0"
                title={`Pemutar ${creator?.name ?? "broadcast"}`}
              />
            </div>
          </div>
          <div className="lg:col-span-4">
            <ChatPanel videoId={id} chat={chat} started={started} currentTime={currentTime} />
          </div>
        </div>
      </section>

      {/* C. Broadsheet title + meta + actions. data-reveal is safe here (below the
          player row), the same scroll-gated reveal the home index uses. */}
      <section className="mx-auto max-w-6xl px-5 pt-10 sm:px-8" data-reveal>
        <h1 className="max-w-[24ch] font-display text-[clamp(1.6rem,4.5vw,3rem)] font-semibold leading-[1.05]">
          {heading}
        </h1>

        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 font-mono text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">
          <span className="text-[var(--accent)]">{isLive ? "Live" : "Replay"}</span>
          {liveEntry?.viewers != null && (
            <span className="inline-flex items-center gap-1.5">
              <Eye size={13} aria-hidden="true" />
              <LiveNumber value={liveEntry.viewers} />
            </span>
          )}
          <a
            href={`https://www.youtube.com/watch?v=${id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-[var(--accent)]"
          >
            Buka di YouTube
            <ArrowSquareOut size={13} aria-hidden="true" />
          </a>
          {creator && (
            <a
              href={creator.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-[var(--accent)]"
            >
              Situs {creator.name}
              <ArrowSquareOut size={13} aria-hidden="true" />
            </a>
          )}
          <button
            type="button"
            onClick={copyLink}
            className="inline-flex items-center gap-1.5 uppercase tracking-[0.14em] transition-colors hover:text-[var(--accent)]"
          >
            {copied ? <Check size={13} aria-hidden="true" /> : <CopySimple size={13} aria-hidden="true" />}
            {copied ? "Tersalin" : "Salin link"}
          </button>
        </div>

        {creator && creator.tags.length > 0 && (
          <ul className="mt-5 flex flex-wrap gap-2">
            {creator.tags.map((tag) => (
              <li
                key={tag}
                className="rounded-pill bg-[color-mix(in_oklab,var(--glow)_40%,transparent)] px-3 py-1 font-mono text-xs text-[var(--text)]"
              >
                {tag}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* D. Description, expand/collapse. Only when the endpoint carried one. */}
      {chat.description && (
        <section className="mx-auto max-w-6xl px-5 pt-10 sm:px-8" data-reveal>
          <div className="border-t border-[var(--line)] pt-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--accent)]">
              Deskripsi
            </p>
            <p
              className={`mt-3 max-w-[70ch] whitespace-pre-wrap break-words text-sm leading-relaxed text-[var(--text-muted)] ${
                descOpen ? "" : "line-clamp-3"
              }`}
            >
              {chat.description}
            </p>
            <button
              type="button"
              onClick={() => setDescOpen((v) => !v)}
              aria-expanded={descOpen}
              className="mt-3 inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.14em] text-[var(--text)] transition-colors hover:text-[var(--accent)]"
            >
              {descOpen ? "Tutup" : "Selengkapnya"}
              <CaretDown
                size={13}
                weight="bold"
                aria-hidden="true"
                className={`transition-transform ${descOpen ? "rotate-180" : ""}`}
              />
            </button>
          </div>
        </section>
      )}

      {/* E. Juga live sekarang -- the portal-only cross-nav. Omitted when nobody
          else is live. Rows route internally, swapping the player/chat in place. */}
      {others.length > 0 && (
        <section
          className="mx-auto mt-16 max-w-6xl border-t border-[var(--line)] px-5 pt-12 sm:px-8"
          data-reveal
        >
          <h2 className="flex items-center gap-3 font-display text-2xl font-semibold sm:text-3xl">
            <span className="relative flex size-3" aria-hidden="true">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-[var(--accent)] opacity-70" />
              <span className="relative inline-flex size-3 rounded-full bg-[var(--accent)]" />
            </span>
            Juga live sekarang
          </h2>

          <ul className="mt-6 border-t border-[var(--line)]" data-stagger>
            {others.map(({ entry, creator: c }) => (
              <li key={entry.slug}>
                <Link
                  to={`/streams?id=${entry.videoId}`}
                  className="group grid grid-cols-[3rem_1fr_auto] items-center gap-x-5 border-b border-[var(--line)] py-5 transition-colors hover:bg-[color-mix(in_oklab,var(--surface-deep)_45%,transparent)]"
                >
                  <img
                    src={c.avatar}
                    alt=""
                    className="size-12 rounded-pill border border-[var(--line)] object-cover"
                    loading="lazy"
                    width={48}
                    height={48}
                  />
                  <span className="min-w-0">
                    <span className="block font-display text-lg font-semibold leading-tight">
                      {c.name}
                    </span>
                    <span className="mt-0.5 block truncate text-sm text-[var(--text-muted)]">
                      {entry.title}
                    </span>
                  </span>
                  {entry.viewers != null && (
                    <span className="inline-flex items-baseline font-mono text-xs tabular-nums text-[var(--text-muted)]">
                      <LiveNumber value={entry.viewers} />
                      <span className="ml-1.5 hidden sm:inline">menonton</span>
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="h-24" />


    </>
  );
}

/** Live / Replay pill in the header. The dot pulses only while actually live. */
function StatusPill({ mode }: { mode: "live" | "replay" | null }) {
  if (mode === "replay") {
    return (
      <span className="inline-flex items-center gap-2 rounded-pill border border-[var(--line)] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
        <Archive size={13} aria-hidden="true" />
        Replay
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 rounded-pill bg-[var(--accent)] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--surface)]">
      <span className="relative flex size-2" aria-hidden="true">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-[var(--surface)] opacity-75" />
        <span className="relative inline-flex size-2 rounded-full bg-[var(--surface)]" />
      </span>
      Live
    </span>
  );
}

/** No id in the query -- a direct hit on /streams with nothing to show. */
function Missing() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-24 sm:px-8 md:py-32">
      <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--accent)]">
        Siaran
      </p>
      <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        Tidak ada siaran yang dipilih
      </h1>
      <p className="mt-4 max-w-[52ch] text-base leading-relaxed text-[var(--text-muted)]">
        Buka halaman ini dari band "On Live" di beranda untuk menonton siaran yang
        sedang berlangsung.
      </p>
      <div className="mt-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-pill bg-[var(--accent)] px-7 py-3 text-sm font-semibold text-[var(--surface)] transition-transform hover:opacity-90 active:translate-y-px"
        >
          <ArrowLeft size={16} weight="bold" aria-hidden="true" />
          Kembali ke portal
        </Link>
      </div>
    </section>
  );
}

/**
 * Live / replay chat beside the player.
 *
 * Ported wholesale from the fan sites' ChatPanel (same follow/unread/present
 * three-state scroll, playhead centering by data-offset, and the live-ungate so
 * live chat shows before playback) -- only the classes change to VTube Info's
 * tokens. See src/useLiveChat.ts for the data engine.
 */
function ChatPanel({
  videoId,
  chat,
  started,
  currentTime,
}: {
  videoId: string;
  chat: ReturnType<typeof useLiveChat>;
  started: boolean;
  currentTime: number;
}) {
  const { messages, status, mode } = chat;
  const isLive = mode === "live";

  const [logEl, setLogEl] = useState<HTMLDivElement | null>(null);
  const logRef = useCallback((node: HTMLDivElement | null) => setLogEl(node), []);

  // Everything held; the window around the playhead. A live stream has no fixed
  // positions, so it shows all it holds.
  const visible = useMemo(() => {
    if (mode !== "replay" || !started) return messages;
    return messages.filter((m) => {
      if (m.offsetSeconds === null) return false;
      return (
        m.offsetSeconds <= currentTime + AHEAD_SECONDS &&
        m.offsetSeconds >= currentTime - BEHIND_SECONDS
      );
    });
  }, [messages, mode, started, currentTime]);

  const [following, setFollowing] = useState(true);
  const [unread, setUnread] = useState(0);

  const followingRef = useRef(true);
  const lastCountRef = useRef(0);
  const lastModeRef = useRef<string | null>(null);
  const presentRef = useRef<number | null>(null);

  const markFollowing = useCallback((value: boolean) => {
    followingRef.current = value;
    setFollowing(value);
    if (value) setUnread(0);
  }, []);

  useEffect(() => {
    if (!logEl) return;
    const onScroll = () => {
      if (mode === "replay" && presentRef.current !== null) {
        const distance = Math.abs(logEl.scrollTop - presentRef.current);
        markFollowing(distance <= 48);
        return;
      }
      const slack = logEl.scrollHeight - logEl.scrollTop - logEl.clientHeight;
      markFollowing(slack <= 6);
    };
    logEl.addEventListener("scroll", onScroll, { passive: true });
    return () => logEl.removeEventListener("scroll", onScroll);
  }, [markFollowing, mode, logEl]);

  // New lines in a live stream: follow if parked at the bottom, else count them.
  useEffect(() => {
    if (!logEl) return;
    if (mode !== "live") {
      lastModeRef.current = mode;
      return;
    }
    const grew = visible.length - lastCountRef.current;
    const firstLoad = lastModeRef.current !== "live";
    lastCountRef.current = visible.length;
    lastModeRef.current = mode;

    if (firstLoad) {
      logEl.scrollTop = logEl.scrollHeight;
      markFollowing(true);
      return;
    }
    if (grew <= 0) return;
    if (followingRef.current) {
      logEl.scrollTo({ top: logEl.scrollHeight, behavior: "smooth" });
    } else {
      setUnread((n) => n + grew);
    }
  }, [visible.length, mode, markFollowing, logEl]);

  const jumpToLatest = useCallback(() => {
    if (!logEl) return;
    logEl.scrollTo({ top: logEl.scrollHeight, behavior: "smooth" });
    markFollowing(true);
  }, [markFollowing, logEl]);

  // Replay: keep the log beside the playhead, by scanning data-offset rows.
  useEffect(() => {
    if (!started || mode !== "replay") return;
    if (!logEl) return;
    const log = logEl;

    let nearest: HTMLElement | null = null;
    let nearestGap = Infinity;
    for (const row of log.querySelectorAll<HTMLElement>("li[data-offset]")) {
      const offset = Number(row.dataset.offset);
      if (!Number.isFinite(offset)) continue;
      const gap = Math.abs(offset - currentTime);
      if (gap < nearestGap) {
        nearestGap = gap;
        nearest = row;
      }
    }
    if (!nearest) return;

    const target = nearest.offsetTop - log.clientHeight / 2 + nearest.offsetHeight / 2;
    const clamped = Math.max(0, Math.min(target, log.scrollHeight - log.clientHeight));
    presentRef.current = clamped;
    if (!followingRef.current) return;
    log.scrollTop = clamped;
  }, [currentTime, mode, started, visible.length, logEl]);

  const jumpToPresent = useCallback(() => {
    if (presentRef.current !== null && logEl) {
      logEl.scrollTo({ top: presentRef.current, behavior: "smooth" });
      markFollowing(true);
    }
  }, [markFollowing, logEl]);

  return (
    <div className="flex max-h-[70vh] flex-col overflow-hidden rounded-card border border-[var(--line)] bg-[var(--surface)] lg:aspect-[8/9] lg:max-h-none">
      <div className="flex items-center gap-2 border-b border-[var(--line)] px-5 py-3.5">
        {mode === "replay" ? (
          <Archive size={18} aria-hidden="true" className="text-[var(--text-muted)]" />
        ) : (
          <ChatCircle size={18} aria-hidden="true" className="text-[var(--text-muted)]" />
        )}
        <h2 className="text-sm font-semibold">{mode === "replay" ? "Replay chat" : "Live chat"}</h2>
        {visible.length > 0 && (started || mode === "live") && (
          <span className="ml-auto font-mono text-xs text-[var(--text-muted)]">{visible.length}</span>
        )}
      </div>

      {!started && mode !== "live" ? (
        <WaitingState status={status} />
      ) : visible.length > 0 ? (
        <div className="relative flex min-h-0 flex-1 flex-col">
          <div
            id="streams-chat-log"
            ref={logRef}
            className="min-h-0 flex-1 overflow-y-auto px-5 py-4"
            aria-live={following ? "polite" : "off"}
          >
            <ul className="flex flex-col gap-3">
              {visible.map((m) => (
                <li key={m.id} data-offset={m.offsetSeconds ?? undefined} className="flex gap-2.5">
                  {m.avatar ? (
                    <img
                      src={m.avatar}
                      alt=""
                      width={28}
                      height={28}
                      loading="lazy"
                      className="mt-0.5 h-7 w-7 shrink-0 rounded-full"
                    />
                  ) : (
                    <span className="mt-0.5 h-7 w-7 shrink-0 rounded-full bg-[var(--surface-deep)]" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-baseline gap-x-2 text-xs">
                      <span className="font-semibold text-[var(--text)]">{m.author || "Tanpa nama"}</span>
                      {m.badge === "member" && (
                        <span className="rounded-full bg-[color-mix(in_oklab,var(--glow)_40%,transparent)] px-1.5 py-px text-[0.625rem] font-medium text-[var(--text)]">
                          Member
                        </span>
                      )}
                      {m.badge === "paid" && (
                        <span className="rounded-full bg-[var(--accent)] px-1.5 py-px text-[0.625rem] font-medium text-[var(--surface)]">
                          Disokong
                        </span>
                      )}
                      {m.at && (
                        <time
                          className="font-mono text-[var(--text-muted)]"
                          dateTime={new Date(m.at).toISOString()}
                        >
                          {new Date(m.at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                        </time>
                      )}
                    </p>
                    <p className="wrap-anywhere mt-0.5 text-sm leading-relaxed text-[var(--text-muted)]">
                      {m.body}
                      {Object.keys(m.emojis).length > 0 && (
                        <span className="mt-1 flex flex-wrap gap-1">
                          {Object.entries(m.emojis).map(([name, url]) => (
                            <img
                              key={name}
                              src={url}
                              alt={name}
                              title={name}
                              width={20}
                              height={20}
                              loading="lazy"
                              className="inline-block h-5 w-5 align-text-bottom"
                            />
                          ))}
                        </span>
                      )}
                    </p>
                  </div>
                </li>
              ))}

            </ul>
          </div>
          {((mode === "live" && unread > 0) || (mode === "replay" && !following)) && (
            <button
              type="button"
              onClick={mode === "live" ? jumpToLatest : jumpToPresent}
              className="absolute inset-x-0 bottom-3 mx-auto w-fit rounded-full border border-[var(--line)] bg-[var(--surface)] px-3.5 py-1.5 text-xs font-medium text-[var(--text)] shadow-sm transition-colors hover:bg-[var(--surface-deep)] focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              {mode === "live" ? (
                <>
                  ↓ {unread} baru<span className="sr-only"> — ke pesan terbaru</span>
                </>
              ) : (
                <>
                  <ArrowLineDown size={13} weight="bold" aria-hidden="true" className="mr-1 inline" />
                  Ke posisi video
                  <span className="sr-only"> — kembali ke chat di detik yang sedang ditonton</span>
                </>
              )}
            </button>
          )}

        </div>
      ) : (
        <EmptyState
          mode={mode}
          messagesLength={messages.length}
          status={status}
          isLive={isLive}
          videoId={videoId}
        />
      )}

    </div>
  );
}

/** Before playback (replay only -- live chat shows without pressing play). */
function WaitingState({ status }: { status: ReturnType<typeof useLiveChat>["status"] }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col justify-center px-5 py-8 text-center">
      <Play size={22} aria-hidden="true" className="mx-auto text-[var(--text-muted)]" weight="fill" />
      <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
        {status === "loading" ? "Membaca chat…" : "Putar videonya dulu"}
      </p>
      {status !== "loading" && (
        <p className="mt-2 text-xs leading-relaxed text-[var(--text-muted)]">
          Chat replay-nya muncul begitu video diputar, lalu ikut waktu tayangnya.
        </p>
      )}
    </div>
  );
}

/** The chat box with nothing to show: names which empty this is. */
function EmptyState({
  mode,
  messagesLength,
  status,
  isLive,
  videoId,
}: {
  mode: "live" | "replay" | null;
  messagesLength: number;
  status: ReturnType<typeof useLiveChat>["status"];
  isLive: boolean;
  videoId: string;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col justify-center px-5 py-8 text-center">
      {mode === "replay" && messagesLength > 0 ? (
        <>
          <Archive size={22} aria-hidden="true" className="mx-auto text-[var(--text-muted)]" />
          <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">Belum ada chat di menit ini.</p>
          <p className="mt-2 text-xs leading-relaxed text-[var(--text-muted)]">
            Kalau quiet, chat-nya akan muncul sendiri sesuai waktu tayangnya.
          </p>
        </>
      ) : status === "loading" ? (
        <>
          <Spinner size={22} aria-hidden="true" className="mx-auto animate-spin text-[var(--text-muted)]" />
          <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">Membaca chat…</p>
        </>
      ) : status === "quiet" && isLive ? (
        <>
          <ChatCircle size={22} aria-hidden="true" className="mx-auto text-[var(--text-muted)]" />
          <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
            Stream-nya live, tapi belum ada chat di jam-jam terakhir ini.
          </p>
        </>
      ) : status === "quiet" ? (
        <>
          <Archive size={22} aria-hidden="true" className="mx-auto text-[var(--text-muted)]" />
          <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
            Chat dari broadcast ini sudah ditutup YouTube, jadi tidak ada yang bisa diputar ulang.
          </p>
        </>
      ) : (
        <>
          <ChatCircle size={22} aria-hidden="true" className="mx-auto text-[var(--text-muted)]" />
          <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
            Chat untuk stream ini belum bisa dibaca dari server.
          </p>
          <p className="mt-2 text-xs leading-relaxed text-[var(--text-muted)]">
            YouTube menutup endpoint chat-nya dari server. Buka di YouTube untuk ikut chat.
          </p>
        </>
      )}
      <div className="mt-5">
        <a
          href={`https://www.youtube.com/watch?v=${videoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-pill border border-[var(--line)] px-5 py-2.5 text-sm font-medium text-[var(--text)] transition-colors hover:bg-[var(--surface-deep)]"
        >
          Buka di YouTube
          <ArrowSquareOut size={16} aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}



