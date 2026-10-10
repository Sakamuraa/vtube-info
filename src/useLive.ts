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
import { useEffect, useRef, useState } from "react";

export type LiveEntry = {
  /** Join key. Matches Creator.slug in content.ts. */
  slug: string;
  title: string;
  viewers: number | null;
  streamUrl: string;
  /** Their own site, used when the stream link is missing. */
  site: string;
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

  /**
   * Ten seconds while the band is on screen.
   *
   * This is the rate the route's own cache window is sized for while somebody is
   * live, so a poll lands on a fresh answer rather than re-reading the same cached
   * copy -- which is what would make a fast poll look busy while the number stood
   * still.
   *
   * The idle rate stays at sixty seconds on purpose. The band must not poll hard
   * waiting for somebody to go live: that is the state where nothing is happening
   * and nobody is watching a number. But it cannot stop polling either, or a
   * stream that starts while the tab sits open would never appear until a reload,
   * which defeats the point of having the band at all.
   */
  const POLL_MS_LIVE = 10_000;

const INITIAL: LiveState = { live: [], settled: false, loading: true };

export function useLive(): LiveState {
  const [state, setState] = useState<LiveState>(INITIAL);

  /*
   * Whether the last response found somebody live, in a ref rather than state.
   *
   * It decides the next poll interval and nothing renders from it, so a ref is
   * right: putting it in state would re-run the effect on every change and tear
   * down the timer it is meant to be scheduling.
   */
  const nextLiveRef = useRef(false);

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
        const next = Array.isArray(payload.live) ? payload.live : [];
        setState({
          live: next,
          // Nothing reachable means nothing was learned, so the section stays
          // hidden rather than reporting an empty room it did not verify.
          settled: (payload.reachable ?? 0) > 0,
          loading: false,
        });

        /*
         * Schedule against the state that was just learned, read from the response
         * rather than from state.
         *
         * Reading `state.live` here would close over whatever the render that
         * created this closure captured, which on the very first pass is the empty
         * initial array -- so the page would start on the sixty second cadence and
         * only speed up after a second request, and a viewer arriving mid-stream
         * would sit on a stale number for a minute.
         */
        nextLiveRef.current = next.length > 0;
      } catch {
        if (controller.signal.aborted) return;
        // Keep whatever was already on screen. Only the very first failure has
        // nothing to keep, which is what leaves `settled` false and the row hidden.
        setState((prev) => (prev.loading ? { ...prev, loading: false } : prev));
      }

      if (!controller.signal.aborted) {
        timer = setTimeout(load, nextLiveRef.current ? POLL_MS_LIVE : POLL_MS);
      }
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