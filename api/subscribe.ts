/*
 * POST /api/subscribe  (and OPTIONS preflight)
 *
 * Stores a Web Push subscription against a creator slug so the notify-live cron
 * can reach it when that creator goes live. Called cross-origin from each fan
 * site (`*.vtube-info.xyz`), so it answers CORS.
 *
 * One VAPID keypair and one store live here on the portal; the fan sites only
 * hold the public key and a button. See api/notify-live.ts for the sender.
 */
import { Redis } from "@upstash/redis";

interface Req {
  method?: string;
  body?: unknown;
  headers?: Record<string, string | undefined>;
}
interface Res {
  status(code: number): Res;
  setHeader(name: string, value: string): void;
  json(body: unknown): void;
  end(): void;
}

/** The creators this portal indexes; a subscription for anything else is dropped. */
const SLUGS = new Set([
  "mizu-hamzazu",
  "pingu-stardine",
  "sierra-mooniva",
  "deidey",
  "kanata-reina",
  "lunie",
  "astelica-kasdea",
  "naplive",
]);

function cors(res: Res, origin: string | undefined) {
  const ok = typeof origin === "string" && /^https:\/\/([a-z0-9-]+\.)?vtube-info\.xyz$/.test(origin);
  res.setHeader("Access-Control-Allow-Origin", ok ? origin : "https://vtube-info.xyz");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "content-type");
  res.setHeader("Vary", "Origin");
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
  cors(res, req.headers?.origin);
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  if (req.method !== "POST") {
    res.status(405).json({ error: "method-not-allowed" });
    return;
  }

  const raw = typeof req.body === "string" ? safeParse(req.body) : req.body;
  const body = (raw ?? {}) as { subscription?: unknown; slug?: unknown };
  const slug = typeof body.slug === "string" ? body.slug : "";
  const sub = body.subscription;

  if (!SLUGS.has(slug) || !sub || typeof sub !== "object" || !("endpoint" in sub)) {
    res.status(400).json({ error: "bad-request" });
    return;
  }

  const redis = makeRedis();
  if (!redis) {
    res.status(503).json({ error: "store-unavailable" });
    return;
  }
  try {
    await redis.sadd(`subs:${slug}`, sub as never);
    res.status(200).json({ ok: true });
  } catch {
    res.status(503).json({ error: "store-error" });
  }
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
