/**
 * Who is live, read once per poll from /api/live.
 *
 * Polling rather than a push channel: there is nothing to subscribe to on the
 * other side, and the answer is a boolean per creator that changes when a stream
 * starts or ends. Sixty seconds is short enough that somebody opening the page
 * during a stream sees it, and long enough that the edge cache on the route
 * absorbs most of the traffic.
 *
 * The last good answer is kept on failure rather than cleared. A stream that was
 * live thirty seconds ago and could not be re-checked has not been proven to have
 * ended, so blanking the row would trade a possibly-stale claim for a certainly
 * wrong one.
 *
 * Paused while the tab is hidden, and re-checked the moment it comes back: a
 * background tab should cost nothing, and the moment someone returns is exactly
 * when a status change matters.
 */
import { useEffect, useState } from "react";

export type LiveEntry = {
  slug: string;
  name: string;
  avatar: string;
  href: string;
  title: string;
  viewers: number | null;
  streamUrl: string;
};

type Payload = {
  live?: LiveEntry[];
  /** How many creators answered, out of the total. */
  reachable?: number;
  total?: number;
};

export type LiveState = {
  live: LiveEntry[];
  /**
   * True only once at least one endpoint has answered. The home page stays silent
   * before that rather than claiming nobody is streaming.
   */
  settled: boolean;
  loading: boolean;
};

const POLL_MS = 60_000;

const INITIAL: LiveState = { live: [], settled: false, loading: true };

export function useLive(): LiveState {
  const [state, setState] = useState<LiveState>(INITIAL);

  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function load() {
      try {
        const res = await fetch("/api/live", {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`api returned ${res.status}`);

        const payload = (await res.json()) as Payload;
        setState({
          live: Array.isArray(payload.live) ? payload.live : [],
          // Nothing reachable means nothing was learned, so the section stays
          // hidden rather than reporting an empty room it did not verify.
          settled: (payload.reachable ?? 0) > 0,
          loading: false,
        });
      } catch {
        if (controller.signal.aborted) return;
        // Keep whatever was already on screen. Only the very first failure has
        // nothing to keep, which is what leaves `settled` false and the row hidden.
        setState((prev) => (prev.loading ? { ...prev, loading: false } : prev));
      }

      if (!controller.signal.aborted) timer = setTimeout(load, POLL_MS);
    }

    void load();

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        if (timer) clearTimeout(timer);
        void load();
      } else if (timer) {
        clearTimeout(timer);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      if (timer) clearTimeout(timer);
      controller.abort();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return state;
}