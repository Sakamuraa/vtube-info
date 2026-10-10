/**
 * GET /api/live
 *
 * Who among the indexed creators is broadcasting right now.
 *
   * Why this is a function and not one fetch per creator from the browser
   * ------------------------------------------------------------------
   * Each creator's own site already answers `/api/content` with a live flag per
   * stream, and that detection is the part worth not rewriting: it reads the
   * thumbnail badge and the viewer row off the channel grid, which is where YouTube
   * actually says it. So this route reuses those endpoints instead of scraping every
   * channel a second time.
 *
 * The browser cannot call them directly. They sit on sibling subdomains and answer
 * without an `Access-Control-Allow-Origin` header, which is correct for their own
   * pages and a wall for a cross-origin fetch. Adding CORS to every one of them to
   * serve one page here is the wrong trade; one function on this side of the wall is
   * the same work in one place.
 *
 * Why nothing is imported from src/
 * ----------------------------------
 * A first version imported `creators` from `src/content.ts`, and it deployed as a
 * 500. Vercel transpiles a function in place rather than bundling it, so a
 * relative import out of `api/` does not survive into the deployed output. Every
 * sibling route here imports nothing for the same reason, and this one now matches
 * them.
 *
 * So the origins are listed below instead. That is deployment configuration --
 * where each fan site is served from -- rather than content, and the page joins
 * these back to `src/content.ts` by slug for the name, avatar and site link, which
 * means a slug that stops matching simply drops out instead of rendering a row
 * with a blank name.
 *
 * Honesty about failure
 * ---------------------
 * An endpoint that times out is reported as unreachable rather than as offline.
 * The response says how many creators were actually reached, and the page renders
 * nothing unless at least one answered -- "we could not tell" must not be drawn as
 * "nobody is streaming", which is a different and wrong statement.
 */

interface LiveRequest {
  method?: string;
}

interface LiveResponse {
  status(code: number): LiveResponse;
  setHeader(name: string, value: string): void;
  json(body: unknown): void;
}

/** One running broadcast, keyed so the page can join it to a creator. */
export interface LiveEntry {
  /** Matches `Creator.slug` in src/content.ts. */
  slug: string;
  title: string;
  /** Null rather than 0 when the instance did not report one. */
  viewers: number | null;
  /** Direct watch link, so a row can skip the detour through the fan site. */
  streamUrl: string;
  /** Their own site, used as the row's fallback link. */
  site: string;
}

/** The shape this route depends on, and only that. */
type StreamEntry = {
    live?: boolean;
    title?: string;
    url?: string;
    /** Needed to confirm a fresh viewer count belongs to this broadcast. */
    videoId?: string;
    viewers?: number | null;
  };

type ContentPayload = {
  streams?: StreamEntry[];
};

/**
 * Where each fan site lives.
 *
 * Kept as an explicit list rather than derived, because a function cannot import
 * from src/ here. The slug is the join key the page uses, so a creator added to
 * src/content.ts without a line here is simply not polled -- it renders as a normal
 * index row and nothing else.
 */
  const ORIGINS: { slug: string; origin: string }[] = [
    { slug: "mizu-hamzazu", origin: "https://mizuhamzazu.vtube-info.xyz" },
    { slug: "pingu-stardine", origin: "https://pingu.vtube-info.xyz" },
    { slug: "sierra-mooniva", origin: "https://sierramooniva.vtube-info.xyz" },
    { slug: "deidey", origin: "https://deidey.vtube-info.xyz" },
    { slug: "kanata-reina", origin: "https://kanatareina.vtube-info.xyz" },
    { slug: "lunie", origin: "https://lunie.vtube-info.xyz" },
  ];

/**
   * Generous, because these endpoints are edge-cached and normally answer in a few
   * hundred milliseconds. Long enough that a cold function is not cut short, short
   * enough that polling all of them in parallel stays inside the platform's own limit.
   */
const TIMEOUT_MS = 5000;

const ACCEPT = { accept: "application/json" };

/** The shape of each fan site's /api/viewers, which carries one number. */
type ViewersPayload = {
  live?: boolean;
  videoId?: string | null;
  viewers?: number | null;
};

/**
 * One creator: their live entry, null if they are simply offline, or the string
 * "unreachable" if their endpoint did not answer. The third state is the reason
 * this returns a union rather than a nullable entry.
 *
 * Two endpoints, in parallel, from the same site.
 *
 * /api/content is authoritative for whether a broadcast is running and what it is
 * called. It is also the expensive one -- three YouTube tabs and a whole archive --
 * so it is cached for tens of seconds at the fan site, which is correct for an
 * archive and wrong for a viewer count.
 *
 * /api/viewers carries one integer and costs one fetch. Reading the count from
 * there rather than from the archive payload is what lets the number move every
 * ten seconds without that costing three times as much per refresh.
 *
 * They run together rather than in sequence because they are independent, and the
 * second is only a refinement: if it fails or is slow the answer is still correct,
 * just with the count from the archive until the next pass.
 */
async function check(
  target: (typeof ORIGINS)[number],
): Promise<LiveEntry | null | "unreachable"> {
  try {
    const [contentRes, viewersRes] = await Promise.all([
      fetch(`${target.origin}/api/content`, {
        headers: ACCEPT,
        signal: AbortSignal.timeout(TIMEOUT_MS),
      }),
      fetch(`${target.origin}/api/viewers`, {
        headers: ACCEPT,
        signal: AbortSignal.timeout(TIMEOUT_MS),
      }),
    ]);
    if (!contentRes.ok) return "unreachable";

    const payload = (await contentRes.json()) as ContentPayload;
    const live = (payload.streams ?? []).find((stream) => stream.live);
    if (!live) return null;

    /*
     * Only trust the fresh count when it is about this broadcast.
     *
     * /api/viewers answers for whatever is running at that site right now. If a
     * stream ended between the two requests, its number belongs to a broadcast
     * that is no longer the one this row is describing -- and a viewer count under
     * the wrong title is worse than one ten seconds out of date. So the ids have to
     * agree before the number is taken.
     */
    let viewers = typeof live.viewers === "number" ? live.viewers : null;
    try {
      if (viewersRes.ok) {
        const fresh = (await viewersRes.json()) as ViewersPayload;
        if (fresh.live && fresh.videoId && fresh.videoId === live.videoId) {
          if (typeof fresh.viewers === "number") viewers = fresh.viewers;
        }
      }
    } catch {
      // The refinement failed; the archive's own count stands.
    }

    return {
      slug: target.slug,
      title: live.title ?? "",
      viewers,
      streamUrl: live.url ?? "",
      site: target.origin,
    };
  } catch {
    // Timeout, DNS, malformed JSON, offline fan site. All the same to a visitor.
    return "unreachable";
  }
}

export default async function handler(_req: LiveRequest, res: LiveResponse) {
    // Parallel rather than sequential: run one after another and the slowest
    // endpoint decides the whole response, multiplied by however many there are.
    // This runs on every visitor's page load.
  const results = await Promise.all(ORIGINS.map(check));

  const live: LiveEntry[] = [];
  let reachable = 0;

  for (const result of results) {
    if (result === "unreachable") continue;
    reachable++;
    if (result) live.push(result);
  }

res.setHeader(
    "Cache-Control",
    /*
     * Ten seconds while somebody is live, thirty when nobody is.
     *
     * This is state-dependent again, which it deliberately was not for a while,
     * and the reason has changed rather than reverted.
     *
     * The page now polls this route every ten seconds while the band is on screen
     * and every sixty when it is not. Each window is sized to the rate the client
     * actually asks at in that state, so a poll always lands on a fresh answer
     * instead of half of them re-reading the same cached copy -- which is what
     * made a ten second poll look like it was moving when it was not.
     *
     * The earlier bug was not the asymmetry, it was the size. A hundred and twenty
     * seconds on the empty answer meant that if Pingu was already live and Sierra
     * started a minute later, the edge served the older answer -- Pingu alone --
     * for up to two minutes. That is the report this all started from: Sierra live
     * on her own site, one row on this one.
     *
     * Thirty seconds on the empty answer is well clear of that. It is also the
     * state where a visitor is least likely to be watching, since there is no band
     * to watch, so the longer window costs nothing anyone can see.
     *
     * swr matches s-maxage rather than exceeding it, so an expired copy cannot
     * outlive its own replacement by much.
     */
    live.length > 0
      ? "public, s-maxage=10, stale-while-revalidate=10"
      : "public, s-maxage=30, stale-while-revalidate=30",
  );

  res.status(200).json({
    checkedAt: new Date().toISOString(),
    live,
    reachable,
    total: ORIGINS.length,
  });
}