/**
 * Request a VTuber.
 *
 * A visitor fills four fields, in the order the sheet's columns run; the row
 * lands in Sam's Google Sheet through /api/submit (which talks to an Apps
 * Script the sheet owns -- see that file). The sheet's own "No." column is
 * assigned by the script on append, so this form never asks a visitor to
 * invent a number.
 *
 * The name field is the one piece of plumbing: type a VTuber's name and a
 * dropdown of matching YouTube channels appears (GET /api/submit?q=). Pick
 * one and the link fills itself with that channel's URL. Nothing works the
 * other way round -- a link never guesses a name -- and when the channel is
 * not in the dropdown the visitor pastes a link into the second field by
 * hand, which is the whole form without the dropdown.
 *
 * A creator already in the index does not need a request, so the form blocks
 * one: findServedCreator() in src/content.ts matches the current name and link
 * against the creators array -- the same array /kreator renders -- and the
 * visitor gets a note pointing there instead of a queued duplicate row.
 *
 * `data-reveal` is read by src/motion.ts.
 */
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle,
  Info,
  Spinner,
  WarningCircle,
} from "@phosphor-icons/react";

import { findServedCreator } from "../content";

type SendState = "idle" | "sending" | "done";

type Suggest = { name: string; url: string; avatar?: string; subs?: string };

const FIELD =
  "mt-2 w-full rounded-2xl border border-[var(--line)] bg-[var(--surface-deep)] px-4 py-3 text-base text-[var(--text)] outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]";

const LABEL = "text-sm font-medium text-[var(--text)]";
const HINT = "mt-1 text-xs leading-relaxed text-[var(--text-muted)]";

/** Server error codes, in the register the rest of the site writes in. */
const ERROR_COPY: Record<string, string> = {
  "name-required": "Nama VTuber-nya belum diisi.",
  "youtube-invalid": "Link YouTube-nya belum ketahuan bentuknya. Coba paste ulang.",
  "requested-by-required": "Requested by-nya belum diisi.",
  "webhook-unconfigured": "Formulir ini belum diset di server. Kabari pemilik situs.",
  "sheet-unreachable": "Sheet-nya gagal dihubungi. Coba lagi sebentar lagi.",
};

export function Submit() {
  const [name, setName] = useState("");
  const [youtube, setYoutube] = useState("");
  const [fan, setFan] = useState("");
  const [requestedBy, setRequestedBy] = useState("");

  const [state, setState] = useState<SendState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [queuedNo, setQueuedNo] = useState<number | null>(null);

  const [suggests, setSuggests] = useState<Suggest[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [searching, setSearching] = useState(false);
  /** Has the visitor searched at least once for the current name? */
  const [searched, setSearched] = useState(false);

  /*
   * True while the link in the field was put there by a dropdown pick.
   *
   * It is a ref, not state, for two reasons: nothing on screen depends on it,
   * and the search effect below must be able to read it without listing it as
   * a dependency -- which would re-run the search on the very write the pick
   * just performed. Typing a different name clears the pick's link, because a
   * link kept next to a changed name is a link to the wrong person; a link the
   * visitor pasted themselves is theirs and is left alone.
   */
  const autoLink = useRef(false);

  /*
   * Debounced channel search. 400ms of quiet on the name field is the
   * trigger, one request per pause rather than one per keystroke, and each
   * new run aborts the previous one so a slow answer can never open the
   * dropdown with results for an older query.
   *
   * A pick writes the name programmatically, which does not fire onChange but
   * does change this effect's dependency -- so the effect checks autoLink and
   * returns without searching when the change came from a pick.
   */
  useEffect(() => {
    const query = name.trim();
    if (query.length < 2 || autoLink.current) {
      setSuggests([]);
      setOpen(false);
      setActiveIdx(-1);
      setSearching(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const endpoint = `/api/submit?q=${encodeURIComponent(query)}`;
        const response = await fetch(endpoint, {
          signal: controller.signal,
          headers: { accept: "application/json" },
        });
        const payload = (response.ok
          ? await response.json()
          : null) as { results?: Suggest[] } | null;
        const results = Array.isArray(payload?.results) ? payload.results : [];
        setSuggests(results);
        setOpen(results.length > 0);
        setActiveIdx(results.length > 0 ? 0 : -1);
        setSearched(true);
      } catch {
        // Offline or aborted: the manual form stands.
        setSuggests([]);
        setOpen(false);
        setActiveIdx(-1);
      }
      setSearching(false);
    }, 400);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [name]);

  function choose(result: Suggest) {
    autoLink.current = true;
    setName(result.name);
    setYoutube(result.url);
    setSuggests([]);
    setOpen(false);
    setActiveIdx(-1);
    setSearching(false);
  }

  function onNameChange(value: string) {
    // Any keystroke here means the visitor is no longer picking from the
    // dropdown, so a link the dropdown placed belongs to a name that is
    // being edited away -- take it back out.
    if (autoLink.current) {
      autoLink.current = false;
      setYoutube("");
    }
    setName(value);
    setSearched(false);
  }

  function onYoutubeChange(value: string) {
    setYoutube(value);
    // A hand-edited link is the visitor's own; stop the name field from
    // treating it as pick-owned.
    autoLink.current = false;
  }

  function onNameKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      if (open) {
        event.preventDefault();
        setOpen(false);
        setActiveIdx(-1);
      }
      return;
    }
    if (event.key === "ArrowDown" && suggests.length > 0) {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        setActiveIdx(0);
      } else {
        setActiveIdx((i) => (i + 1) % suggests.length);
      }
      return;
    }
    if (event.key === "ArrowUp" && open && suggests.length > 0) {
      event.preventDefault();
      setActiveIdx((i) => (i <= 0 ? suggests.length - 1 : i - 1));
      return;
    }
    // Enter picks the highlighted row when the dropdown is up; with it closed
    // it falls through and submits the form like any other field.
    if (event.key === "Enter" && open && activeIdx >= 0) {
      const picked = suggests[activeIdx];
      if (picked) {
        event.preventDefault();
        choose(picked);
      }
    }
  }

  /*
   * Already in the index, rechecked on every keystroke against the live
   * creators array -- so adding a creator removes them from the form's
   * acceptance without this file being touched.
   */
  const served = findServedCreator(name, youtube);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === "sending") return;
    // The button is already disabled while blocked; this is the belt to that
    // pair of braces, so a stale render can never queue a duplicate row.
    if (served) return;

    setError(null);
    if (!name.trim() || !youtube.trim() || !requestedBy.trim()) {
      setError(
        !name.trim()
          ? ERROR_COPY["name-required"]
          : !youtube.trim()
            ? "Link YouTube-nya belum diisi. Pilih dari daftar atau tempel link-nya."
            : ERROR_COPY["requested-by-required"],
      );
      return;
    }

    const form = event.currentTarget;
    setState("sending");
    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          youtube: youtube.trim(),
          fan: fan.trim(),
          requestedBy: requestedBy.trim(),
          // Honeypot: empty for a human, and the server treats a filled copy
          // as a bot and answers success without writing anything.
          website: new FormData(form).get("website") ?? "",
        }),
      });
      const payload = (await response.json().catch(() => null)) as {
        ok?: boolean;
        no?: number | null;
        error?: string;
      } | null;

      if (!response.ok || !payload?.ok) {
        setError(
          (payload?.error && ERROR_COPY[payload.error]) ||
            "Gagal terkirim. Coba lagi sebentar lagi.",
        );
        setState("idle");
        return;
      }
      setQueuedNo(typeof payload.no === "number" ? payload.no : null);
      setState("done");
    } catch {
      setError("Koneksi gagal. Coba lagi.");
      setState("idle");
    }
  }

  function reset() {
    autoLink.current = false;
    setName("");
    setYoutube("");
    setFan("");
    setRequestedBy("");
    setSuggests([]);
    setOpen(false);
    setActiveIdx(-1);
    setSearching(false);
    setSearched(false);
    setQueuedNo(null);
    setError(null);
    setState("idle");
  }

  const nameHint = served
    ? `${served.name} sudah ada di indeks — jadi nggak perlu request.`
    : searching
      ? "Nyari channel di YouTube…"
      : open
        ? "Pilih channel-nya dari daftar — link-nya keisi sendiri."
        : searched && suggests.length === 0
          ? "Belum ketemu channel-nya. Tempel link YouTube-nya manual di kolom bawah."
          : "Ketik nama VTuber-nya, lalu pilih channel-nya dari daftar.";

  return (
    <article className="mx-auto max-w-3xl px-5 py-16 sm:px-8 md:py-24">
      <header data-reveal>
        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--accent)]">
          Request
        </p>
        <h1 className="mt-5 font-display text-4xl font-semibold sm:text-5xl">
          Minta dibuatkan halaman
        </h1>
        <p className="mt-6 max-w-[54ch] text-lg leading-relaxed text-[var(--text-muted)]">
          Ada VTuber yang menurutmu layak masuk indeks? Isi formulir di bawah.
          Request-nya dicatat, dan kalau halamannya nanti dibuat, kreditnya
          balik ke kamu.
        </p>
      </header>

      <section className="mt-14" data-reveal>
        {state === "done" ? (
          /* Success replaces the form rather than stacking a banner above it:
             the form's job is finished, and a cleared form under a green box
             invites a second submission. */
          <div className="rounded-3xl border border-[var(--accent)] bg-[color-mix(in_oklab,var(--color-butter)_16%,transparent)] p-6 sm:p-8">
            <CheckCircle size={28} weight="fill" className="text-[var(--accent)]" aria-hidden="true" />
            <h2 className="mt-4 font-display text-2xl font-semibold">Request terkirim</h2>
            <p className="mt-3 leading-relaxed text-[var(--text-muted)]">
              Sudah masuk ke daftar request
              {queuedNo !== null ? (
                <>
                  {" "}
                  dengan <span className="font-mono text-[var(--text)]">nomor {queuedNo}</span>
                </>
              ) : null}
              . Kalau VTuber-nya nanti dibuatkan halamannya, namamu yang request ada
              di situ.
            </p>
            <button
              type="button"
              onClick={reset}
              className="mt-6 inline-flex items-center gap-2 rounded-pill border border-[var(--line)] px-5 py-2.5 text-sm font-semibold transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              Kirim lagi
            </button>
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            noValidate
            className="rounded-3xl border border-[var(--line)] bg-[var(--surface-deep)] p-6 sm:p-8"
          >
            <div className="grid gap-6">
              <div className="relative">
                <label className={LABEL} htmlFor="submit-name">
                  Nama VTuber <span className="text-[var(--accent)]">*</span>
                </label>
                <input
                  id="submit-name"
                  name="name"
                  type="text"
                  autoComplete="off"
                  role="combobox"
                  aria-expanded={open}
                  aria-controls="submit-name-listbox"
                  aria-autocomplete="list"
                  aria-activedescendant={
                    open && activeIdx >= 0 ? `submit-name-opt-${activeIdx}` : undefined
                  }
                  aria-describedby="submit-name-hint"
                  placeholder="Ketik nama channel-nya"
                  value={name}
                  onChange={(event) => onNameChange(event.target.value)}
                  onKeyDown={onNameKeyDown}
                  onBlur={() => {
                    setOpen(false);
                    setActiveIdx(-1);
                  }}
                  className={FIELD}
                />
                <p id="submit-name-hint" className={HINT} aria-live="polite">
                  {nameHint}
                </p>

                {open && suggests.length > 0 && (
                  <ul
                    id="submit-name-listbox"
                    role="listbox"
                    aria-label="Channel YouTube yang cocok"
                    className="absolute left-0 right-0 top-full z-20 mt-1 max-h-72 overflow-y-auto rounded-2xl border border-[var(--line)] bg-[var(--surface)] py-1 shadow-xl"
                  >
                    {suggests.map((suggest, index) => (
                      <li
                        key={suggest.url}
                        id={`submit-name-opt-${index}`}
                        role="option"
                        aria-selected={index === activeIdx}
                        onMouseDown={(event) => {
                          // Keep focus in the field so the pick's blur logic
                          // never races the click that performs it.
                          event.preventDefault();
                        }}
                        onClick={() => choose(suggest)}
                        onMouseEnter={() => setActiveIdx(index)}
                        className={`flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors ${
                          index === activeIdx
                            ? "bg-[color-mix(in_oklab,var(--accent)_12%,transparent)]"
                            : ""
                        }`}
                      >
                        {suggest.avatar ? (
                          <img
                            src={suggest.avatar}
                            alt=""
                            loading="lazy"
                            className="size-9 shrink-0 rounded-full bg-[var(--surface-deep)] object-cover"
                            onError={(event) => {
                              event.currentTarget.style.display = "none";
                            }}
                          />
                        ) : null}
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-[var(--text)]">
                            {suggest.name}
                          </span>
                          {suggest.subs ? (
                            <span className="block truncate text-xs text-[var(--text-muted)]">
                              {suggest.subs}
                            </span>
                          ) : null}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <label className={LABEL} htmlFor="submit-youtube">
                  Youtube Link <span className="text-[var(--accent)]">*</span>
                </label>
                <input
                  id="submit-youtube"
                  name="youtube"
                  type="url"
                  inputMode="url"
                  autoComplete="url"
                  placeholder="https://www.youtube.com/@channel"
                  value={youtube}
                  onChange={(event) => onYoutubeChange(event.target.value)}
                  className={FIELD}
                  aria-describedby="submit-youtube-hint"
                />
                <p id="submit-youtube-hint" className={HINT}>
                  Keisi sendiri kalau nama-nya dipilih dari daftar. Nggak ketemu
                  di daftar? Tempel channel atau video link-nya di sini.
                </p>
              </div>

              <div>
                <label className={LABEL} htmlFor="submit-fan">
                  Nama Fan/Membership
                </label>
                <input
                  id="submit-fan"
                  name="fan"
                  type="text"
                  autoComplete="off"
                  placeholder="Kalau ada — mis. nama member atau fandomnya"
                  value={fan}
                  onChange={(event) => setFan(event.target.value)}
                  className={FIELD}
                />
                <p className={HINT}>Kosongkan kalau nggak ada.</p>
              </div>

              <div>
                <label className={LABEL} htmlFor="submit-requester">
                  Requested by <span className="text-[var(--accent)]">*</span>
                </label>
                <input
                  id="submit-requester"
                  name="requestedBy"
                  type="text"
                  autoComplete="nickname"
                  placeholder="Nama atau handle kamu"
                  value={requestedBy}
                  onChange={(event) => setRequestedBy(event.target.value)}
                  className={FIELD}
                />
              </div>

              {/* Honeypot: off-screen, out of the tab order, invisible to the
                  AT tree. Bots fill every field they are shown. */}
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                defaultValue=""
                className="sr-only"
              />
            </div>

            <div
              className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3"
              aria-live="polite"
            >
              {/* Blocked, so the note sits where the send would have happened:
                  same slot as the error line, same visual family as the success
                  card, and `status` rather than `alert` -- nothing failed. */}
              {served && (
                <div
                  role="status"
                  className="w-full rounded-2xl border border-[var(--accent)] bg-[color-mix(in_oklab,var(--color-butter)_12%,transparent)] p-4 sm:p-5"
                >
                  <p className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
                    <Info size={16} weight="fill" className="text-[var(--accent)]" aria-hidden="true" />
                    {served.name} sudah ada di indeks
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-muted)]">
                    Nggak perlu request lagi — halamannya sudah dilayani di sini.
                    Lihat daftarnya di{" "}
                    <Link
                      to="/kreator"
                      className="font-medium text-[var(--text)] underline-offset-4 transition-colors hover:text-[var(--accent)] hover:underline"
                    >
                      /kreator
                    </Link>
                    .
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={state === "sending" || Boolean(served)}
                className="inline-flex min-h-11 items-center gap-2 rounded-pill bg-[var(--accent)] px-7 py-3 text-sm font-semibold text-[var(--surface)] transition-transform hover:opacity-90 active:translate-y-px disabled:opacity-60"
              >
                {state === "sending" ? (
                  <>
                    <Spinner size={15} className="animate-spin" aria-hidden="true" />
                    Mengirim…
                  </>
                ) : (
                  <>
                    Kirim request
                    <ArrowRight size={15} weight="bold" aria-hidden="true" />
                  </>
                )}
              </button>

              {error && (
                <p className="flex items-center gap-2 text-sm font-medium text-[var(--accent)]">
                  <WarningCircle size={16} weight="fill" aria-hidden="true" />
                  {error}
                </p>
              )}
            </div>
          </form>
        )}
      </section>

      <section className="mt-14 border-t border-[var(--line)] pt-8" data-reveal>
        <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
          Cara kerjanya
        </h2>
        <ol className="mt-4 space-y-2 text-sm leading-relaxed text-[var(--text-muted)]">
          <li>1. Request masuk ke daftar internal, bukan langsung dipublikasikan.</li>
          <li>2. Kalau kriterianya cocok, halaman situsnya dibuatkan.</li>
          <li>
            3. Nama channel, avatar, dan link resminya diambil dari channel
            yang kamu kasih — bukan dari tebak-tebakan.
          </li>
        </ol>
      </section>
    </article>
  );
}
