/*
 * GET /api/notify-live?secret=...   (cron target)
 *
 * The one sender. An external cron (Vercel Hobby cron is daily-only) hits this
 * every ~1-2 min. It reads who is live from this portal's own /api/live and
 * pushes a Web Push notification to subscribers of each live creator
 * (api/subscribe.ts) -- at most once per subscriber per stream. Dead
 * subscriptions (410/404) are pruned. Guarded by CRON_SECRET so only the cron
 * can fire it.
 *
 * Once per stream, not once per offline->live edge
 * ------------------------------------------------
 * An earlier version kept a live:{slug} flag and sent only on the 0->1
 * transition. That shape is only as stable as the flag, and /api/live reports
 * an endpoint that times out as unreachable -- which is absent from the live
 * array, i.e. offline. One flapping pass flipped the flag to 0, the next pass
 * saw the creator live again, and every subscriber was re-notified for the
 * stream they were already told about.
 *
 * So the record lives against the stream instead: notified:{slug}:{videoId}
 * holds the endpoints that have already been told, each claimed with SADD
 * before its send (atomic, so overlapping cron runs cannot both win) and
 * released if the send fails (so a transient error retries on the next pass
 * instead of silently swallowing the notification). Unreachable passes change
 * nothing -- no flag to reset -- and the keys expire a week after the stream
 * stops being checked.
 */
import { Redis } from "@upstash/redis";
import webpush from "web-push";

interface Req {
  method?: string;
  query?: Record<string, string | string[] | undefined>;
}
interface Res {
  status(code: number): Res;
  setHeader(name: string, value: string): void;
  json(body: unknown): void;
}

const SLUGS = [
  "mizu-hamzazu",
  "pingu-stardine",
  "sierra-mooniva",
  "deidey",
  "kanata-reina",
  "lunie",
  "astelica-kasdea",
  "naplive",
  "zeyayaya",
  "gepigepeng",
  "arushi-caelis",
] as const;

/** Display names for the notification title; api/live sends slugs, not names. */
const NAMES: Record<string, string> = {
  "mizu-hamzazu": "Mizu Hamzazu",
  "pingu-stardine": "Pingu Stardine",
  "sierra-mooniva": "Sierra Mooniva",
  deidey: "Deidey",
  "kanata-reina": "Kanata Reina",
  lunie: "Lunie",
  "astelica-kasdea": "Astelica Kasdea",
  naplive: "NapLive",
  zeyayaya: "Zeyayaya",
  gepigepeng: "Gepii Gepeng",
  "arushi-caelis": "Arushi Caelis",
};

const PORTAL = "https://vtube-info.xyz";

interface LiveEntry {
  slug: string;
  title?: string;
  videoId?: string;
}

function readParam(query: Req["query"], key: string): string | undefined {
  const v = query?.[key];
  return Array.isArray(v) ? v[0] : v;
}

/** Build a Redis client from either Upstash-direct or Vercel-KV env names. */
function makeRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  // Must be the REST endpoint (https://), not the rediss:// TCP string.
  if (!url || !token || !/^https:\/\//i.test(url)) return null;
  try {
    return new Redis({ url, token });
  } catch {
    return null;
  }
}

export default async function handler(req: Req, res: Res) {
  const secret = process.env.CRON_SECRET;
  if (!secret || readParam(req.query, "secret") !== secret) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  const haveUpstash = Boolean(
    (process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL) &&
      (process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN),
  );
  const haveVapid = Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
  const redis = makeRedis();
  if (!redis || !haveVapid) {
    res.status(503).json({ error: "not-configured", haveUpstash, haveVapid });
    return;
  }
  try {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || "mailto:admin@vtube-info.xyz",
      process.env.VAPID_PUBLIC_KEY || "",
      process.env.VAPID_PRIVATE_KEY || "",
    );
  } catch {
    res.status(503).json({ error: "vapid-invalid" });
    return;
  }

  // Who is live now, from this portal's own aggregator (edge-cached).
  const liveMap = new Map<string, LiveEntry>();
  try {
    const r = await fetch(`${PORTAL}/api/live`, { headers: { accept: "application/json" } });
    const payload = (await r.json()) as { live?: LiveEntry[] };
    for (const e of payload.live ?? []) if (e?.slug) liveMap.set(e.slug, e);
  } catch {
    res.status(502).json({ error: "live-unreachable" });
    return;
  }

  const sent: Record<string, number> = {};
  for (const slug of SLUGS) {
    const entry = liveMap.get(slug);
    // Absent means offline or unreachable this pass -- neither clears anything,
    // because the once-per-stream record lives with the stream in
    // notified:{slug}:{videoId} (see the header), not in a flag a failed check
    // could reset. A stream that is still live simply finds every endpoint
    // already claimed and skips them.
    if (!entry) continue;
    const n = await pushToSlug(redis, slug, entry);
    if (n > 0) sent[slug] = n;
  }

  res.status(200).json({ ok: true, checkedAt: new Date().toISOString(), sent });
}

/**
 * Push to the subscribers of one slug that have not been told about this
 * stream yet; prune the dead endpoints.
 *
 * The dedup set is per stream (videoId), so a new broadcast -- a new video id
 * -- notifies again while replays of the same one do not. Each member claims
 * its slot with SADD immediately before sending: SADD is atomic, so two
 * overlapping cron runs cannot both observe "not yet sent" and both fire, and
 * a failure releases the claim so the next pass retries rather than losing
 * the notification to one bad second.
 */
async function pushToSlug(redis: Redis, slug: string, entry: LiveEntry): Promise<number> {
  const key = `subs:${slug}`;
  const members = (await redis.smembers(key)) as unknown[];
  if (members.length === 0) return 0;

  // No video id means the instance did not report one; one shared fallback
  // slot still keeps such a pass to a single send per endpoint.
  const dedupKey = `notified:${slug}:${entry.videoId || "noid"}`;

  const payload = JSON.stringify({
    title: `${NAMES[slug] ?? "Kreator"} lagi live!`,
    body: entry.title || "Nonton sekarang di VTube Info",
    url: entry.videoId ? `${PORTAL}/streams?id=${entry.videoId}` : PORTAL,
    icon: `${PORTAL}/og-image.png`,
  });

  let count = 0;
  for (const member of members) {
    // Upstash may hand back the stored object already parsed, or as a string.
    const sub = typeof member === "string" ? safeParse(member) : member;
    if (!sub || typeof sub !== "object") {
      await redis.srem(key, member as never);
      continue;
    }

    /*
     * Identity inside the dedup set: the push endpoint when the object carries
     * one (it always should), falling back to the stored form so a member that
     * somehow lacks one still compares equal to itself on the next pass --
     * the alternative, skipping dedup, is the every-tick spam this exists to
     * prevent.
     */
    const endpoint = (sub as { endpoint?: unknown }).endpoint;
    const id =
      typeof endpoint === "string" && endpoint
        ? endpoint
        : typeof member === "string"
          ? member
          : JSON.stringify(member);

    const claimed = (await redis.sadd(dedupKey, id)) === 1;
    if (!claimed) continue;

    try {
      await webpush.sendNotification(sub as webpush.PushSubscription, payload);
      count++;
    } catch (err) {
      // Give the slot back: a dead endpoint is removed from the subscriber set
      // below anyway, and a transient error should try again next pass.
      await redis.srem(dedupKey, id);
      const code = (err as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) await redis.srem(key, member as never);
    }
  }

  /*
   * One week from the last pass that saw this stream live -- refreshed on every
   * pass while it runs, so the key outlives any broadcast plus retries and
   * then disappears without a cleanup job.
   */
  await redis.expire(dedupKey, 7 * 24 * 60 * 60);
  return count;
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
