/*
 * GET /api/notify-live?secret=...   (cron target)
 *
 * The one sender. An external cron (Vercel Hobby cron is daily-only) hits this
 * every ~1-2 min. It reads who is live from this portal's own /api/live, and for
 * each creator that just went offline->live, pushes a Web Push notification to
 * everyone subscribed to that creator (api/subscribe.ts). Dead subscriptions
 * (410/404) are pruned. Guarded by CRON_SECRET so only the cron can fire it.
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
    const isLive = Boolean(entry);
    const wasLive = (await redis.get(`live:${slug}`)) === "1";

    // Only the offline->live edge pushes; a stream that stays live does not
    // re-notify, and going offline just resets the flag for next time.
    if (isLive && !wasLive) {
      const n = await pushToSlug(redis, slug, entry!);
      if (n > 0) sent[slug] = n;
    }
    await redis.set(`live:${slug}`, isLive ? "1" : "0");
  }

  res.status(200).json({ ok: true, checkedAt: new Date().toISOString(), sent });
}

/** Push to every subscriber of one slug; prune the dead endpoints. */
async function pushToSlug(redis: Redis, slug: string, entry: LiveEntry): Promise<number> {
  const key = `subs:${slug}`;
  const members = (await redis.smembers(key)) as unknown[];
  if (members.length === 0) return 0;

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
    try {
      await webpush.sendNotification(sub as webpush.PushSubscription, payload);
      count++;
    } catch (err) {
      const code = (err as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) await redis.srem(key, member as never);
    }
  }
  return count;
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
