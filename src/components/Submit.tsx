/**
 * Request a VTuber.
 *
 * A visitor fills four fields; the row lands in Sam's Google Sheet through
 * /api/submit (which talks to an Apps Script the sheet owns -- see that file).
 * The sheet's own "No." column is assigned by the script on append, so this
 * form never asks a visitor to invent a number.
 *
 * The YouTube field is the one piece of plumbing: paste a link and the name
 * field fills itself from the channel behind that link (GET /api/submit?
 * resolve=). It only ever fills a name the visitor has not typed -- once the
 * field is hand-edited the fetch stays out of it, and clearing it re-arms the
 * autofill. When the lookup fails the form is simply the manual form it was
 * before, with no error shown for something the visitor did not do wrong.
 *
 * `data-reveal` is read by src/motion.ts.
 */
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowRight, CheckCircle, Spinner, WarningCircle } from "@phosphor-icons/react";

type SendState = "idle" | "sending" | "done";

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

  const [resolving, setResolving] = useState(false);
  const [resolved, setResolved] = useState(false);

  // Whether the visitor has typed in the name field by hand. The autofill
  // writes only while this is false, so it can never clobber a real answer.
  const nameTouched = useRef(false);
  // What autofill last wrote, so a newer lookup may replace its own value
  // (and only its own) when the link changes.
  const autoName = useRef<string | null>(null);
  // The current name, mirrored into a ref from an effect so the lookup below
  // can read it without listing it as a dependency -- listing it would restart
  // the debounce on every keystroke, and on the autofill's own write.
  const nameRef = useRef(name);
  useEffect(() => {
    nameRef.current = name;
  }, [name]);

  /*
   * Debounced name lookup. 700ms of quiet on the field is the trigger, one
   * request per pause rather than one per keystroke, and each new run aborts
   * the previous one so a slow answer can never land after a newer one and
   * write a stale name.
   */
  useEffect(() => {
    const link = youtube.trim();
    if (link.length < 8) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setResolving(true);
      let fetched = "";
      try {
        const endpoint = `/api/submit?resolve=${encodeURIComponent(link)}`;
        const response = await fetch(endpoint, {
          signal: controller.signal,
          headers: { accept: "application/json" },
        });
        const payload = (response.ok
          ? await response.json()
          : null) as { name?: string | null } | null;
        fetched = typeof payload?.name === "string" ? payload.name.trim() : "";
      } catch {
        // Offline, aborted, or a failed lookup: the manual form stands.
        fetched = "";
      }

      const current = nameRef.current;
      const writable =
        fetched.length > 0 &&
        !nameTouched.current &&
        (current === "" || current === autoName.current);
      if (writable) {
        setName(fetched);
        autoName.current = fetched;
      }
      setResolved(writable);
      setResolving(false);
    }, 700);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [youtube]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === "sending") return;

    setError(null);
    if (!name.trim() || !youtube.trim() || !requestedBy.trim()) {
      setError(
        !name.trim()
          ? ERROR_COPY["name-required"]
          : !youtube.trim()
            ? "Link YouTube-nya belum diisi."
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
    nameTouched.current = false;
    autoName.current = null;
    setName("");
    setYoutube("");
    setFan("");
    setRequestedBy("");
    setResolved(false);
    setQueuedNo(null);
    setError(null);
    setState("idle");
  }

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
              <div>
                <label className={LABEL} htmlFor="submit-youtube">
                  Link YouTube <span className="text-[var(--accent)]">*</span>
                </label>
                <input
                  id="submit-youtube"
                  name="youtube"
                  type="url"
                  inputMode="url"
                  autoComplete="url"
                  placeholder="https://www.youtube.com/@channel"
                  value={youtube}
                  onChange={(event) => {
                    setYoutube(event.target.value);
                    // Clearing the link clears the lookup's own status too,
                    // from the event rather than from the effect.
                    if (event.target.value.trim().length < 8) {
                      setResolving(false);
                      setResolved(false);
                    }
                  }}
                  className={FIELD}
                  aria-describedby="submit-youtube-hint"
                />
                <p id="submit-youtube-hint" className={HINT} aria-live="polite">
                  {resolving
                    ? "Mengambil nama channel dari link…"
                    : resolved
                      ? "Nama di bawah keisi otomatis dari channel. Ubah kalau keliru."
                      : "Channel atau video bebas — nama VTuber-nya keisi otomatis kalau bisa."}
                </p>
              </div>

              <div>
                <label className={LABEL} htmlFor="submit-name">
                  Nama VTuber <span className="text-[var(--accent)]">*</span>
                </label>
                <input
                  id="submit-name"
                  name="name"
                  type="text"
                  autoComplete="off"
                  placeholder="Nama channel atau karakternya"
                  value={name}
                  onChange={(event) => {
                    // An empty field re-arms the autofill; anything else the
                    // visitor types is theirs and is left alone.
                    nameTouched.current = event.target.value.trim().length > 0;
                    setName(event.target.value);
                  }}
                  className={FIELD}
                />
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
              <button
                type="submit"
                disabled={state === "sending"}
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
