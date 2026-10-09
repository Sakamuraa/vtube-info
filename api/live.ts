/**
 * GET /api/live
 *
 * Who among the indexed creators is broadcasting right now.
 *
 * Why this is a function and not five fetches from the browser
 * ----------------------------------------------------------
 * Each creator's own site already answers `/api/content` with a live flag per
 * stream, and that detection is the part worth not rewriting: it reads the
 * thumbnail badge and the viewer row off the channel grid, which is where
 * YouTube actually says it. So this route reuses those endpoints instead of
 * scraping five channels a second time.
 *
 * The browser cannot call them directly. They sit on sibling subdomains and
 * answer without an `Access-Control-Allow-Origin` header, which is correct for
 * their own pages and a wall for a cross-origin fetch. Adding CORS to five
 * separate sites to serve one page here is the wrong trade; one function on this
 * side of the wall is the same work in one place.
 *
 * Honesty about failure
 * ---------------------
 * An endpoint that times out is reported as unreachable rather than as offline.
 * The response says how many creators were actually reached, and the page renders
 * nothing unless at least one answered -- "we could not tell" must not be drawn
 * as "nobody is streaming", which is a different and wrong statement.
 *
 * Cache
 * -----
 * Short while someone is live, since that is a claim about right now, and longer
 * when the answer is a room with nobody in it. A stale "live" badge is the one
 * answer here that actively misleads.
 */

import { creators } from "../src/content.ts";

interface LiveRequest {
  method?: string;
}

interface LiveResponse {
  status(code: number): LiveResponse;
  setHeader(name: string, value: string): void;
  json(body: unknown): void;
}

/** One running broadcast, flattened to what a row on the home page needs. */
export interface LiveEntry {
  slug: string;
  name: string;
  /** Their og:image, the same picture the index row uses. */
  avatar: string;
  /** Their own site, where the full broadcast lives. */
  href: string;
  title: string;
  /** Null rather than 0 when the instance did not report one. */
  viewers: number | null;
  /** Direct watch link, so the row can skip the detour through the fan site. */
  streamUrl: string;
}

/** The shape this route depends on, and only that. */
type StreamEntry = {
  live?: boolean;
  title?: string;
  url?: string;
  viewers?: number | null;
};

type ContentPayload = {
  streams?: StreamEntry[];
};

/**
 * Generous, because these endpoints are edge-cached and normally answer in a few
 * hundred milliseconds. Long enough that a cold function is not cut short, short
 * enough that five of them in parallel stay inside the platform's own limit.
 */
const TIMEOUT_MS = 5000;

const ACCEPT = { accept: "application/json" };

/**
 * One creator: their live entry, null if they are simply offline, or the string
 * "unreachable" if their endpoint did not answer. The third state is the reason
 * this returns a union rather than a nullable entry.
 */
async function check(
  creator: (typeof creators)[number],
): Promise<LiveEntry | null | "unreachable"> {
  try {
    const res = await fetch(`${creator.href}/api/content`, {
      headers: ACCEPT,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return "unreachable";

    const payload = (await res.json()) as ContentPayload;
    const live = (payload.streams ?? []).find((stream) => stream.live);
    if (!live) return null;

    return {
      slug: creator.slug,
      name: creator.name,
      avatar: creator.avatar,
      href: creator.href,
      title: live.title ?? "",
      viewers: typeof live.viewers === "number" ? live.viewers : null,
      streamUrl: live.url ?? "",
    };
  } catch {
    // Timeout, DNS, malformed JSON, offline fan site. All the same to a visitor.
    return "unreachable";
  }
}

export default async function handler(_req: LiveRequest, res: LiveResponse) {
  // Parallel rather than sequential: five sequential timeouts would be five times
  // the slowest one, and this runs on every visitor's page load.
  const results = await Promise.all(creators.map(check));

  const live: LiveEntry[] = [];
  let reachable = 0;

  for (const result of results) {
    if (result === "unreachable") continue;
    reachable++;
    if (result) live.push(result);
  }

  res.setHeader(
    "Cache-Control",
    live.length > 0
      ? "public, s-maxage=20, stale-while-revalidate=45"
      : reachable > 0
        ? "public, s-maxage=120, stale-while-revalidate=300"
        : // Nothing answered at all. Ask again soon rather than caching a blank
          // room as though it were a fact.
          "public, s-maxage=30",
  );

  res.status(200).json({
    checkedAt: new Date().toISOString(),
    live,
    reachable,
    total: creators.length,
  });
}