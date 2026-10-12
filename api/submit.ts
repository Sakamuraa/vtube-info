/**
 * VTuber page requests.
 *
 *   GET  /api/submit?resolve=<youtube-url>  -> channel name behind the link
 *   POST /api/submit                        -> forward one request into Sam's sheet
 *
 * The page at /submit is a form; this is its back end. Submissions end up as
 * rows in a Google Sheet, which is done through an Apps Script web app the
 * sheet owns (env SUBMIT_WEBHOOK) -- the Sheets API itself cannot be appended
 * to anonymously, so the script is the auth boundary. When that env is missing
 * the endpoint says so instead of pretending the row was written.
 *
 * The resolve half exists so a pasted link can fill "Nama VTuber" itself:
 * a video link goes through YouTube's public oEmbed (author_name is the
 * channel), a channel link is read off the channel page's own metadata.
 * Both are best-effort -- a failure returns name:null and the visitor types
 * the name, which is the pre-auto-fill behaviour anyway.
 *
 * Every helper lives in this file on purpose: Vercel transpiles a function in
 * place, and a relative import out of api/ does not reach the deployed output.
 */
interface Req {
  method?: string;
  query?: Record<string, string | string[] | undefined>;
  body?: unknown;
  headers?: Record<string, string | undefined>;
}
interface Res {
  status(code: number): Res;
  setHeader(name: string, value: string): void;
  json(body: unknown): void;
  end(): void;
}

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

/** Field caps, so a posted row can never be a paragraph pasted into one cell. */
const LIMITS = { name: 120, youtube: 300, fan: 80, requestedBy: 80 } as const;

type Target =
  | { kind: "video"; id: string }
  | { kind: "channel"; url: string };

/**
 * Classify a YouTube URL, or null if it is not one.
 *
 * Accepts the shapes people actually paste: watch, youtu.be, shorts, live,
 * embed, @handle, /channel/, /c/, /user/. Playlists resolve to null on
 * purpose -- a playlist URL names a list, not a person, and guessing the
 * owner from it would be a name the requester never typed.
 */
function parseYouTube(raw: string): Target | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;

  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  if (host === "youtu.be") {
    const id = url.pathname.slice(1);
    return /^[A-Za-z0-9_-]{6,}$/.test(id) ? { kind: "video", id } : null;
  }
  if (host !== "youtube.com" && host !== "m.youtube.com" && host !== "music.youtube.com") {
    return null;
  }

  const v = url.searchParams.get("v");
  if (v && /^[A-Za-z0-9_-]{6,}$/.test(v)) return { kind: "video", id: v };

  const path = url.pathname;
  const clip = path.match(/^\/(?:shorts|live|embed|v)\/([A-Za-z0-9_-]{6,})/);
  if (clip) return { kind: "video", id: clip[1] };

  if (/^\/@[\w.-]{2,}$/.test(path) || /^\/channel\/[\w-]{2,}$/.test(path)) {
    return { kind: "channel", url: `https://www.youtube.com${path}` };
  }
  const legacy = path.match(/^\/(?:c|user)\/[\w.-]{2,}/);
  if (legacy) return { kind: "channel", url: `https://www.youtube.com${legacy[0]}` };

  return null;
}

/** Decode a JSON string body's escapes without letting bad input throw. */
function unescapeJsonString(raw: string): string {
  try {
    const decoded: unknown = JSON.parse(`"${raw}"`);
    return typeof decoded === "string" ? decoded : raw;
  } catch {
    return raw;
  }
}

async function resolveName(
  raw: string,
): Promise<{ name: string | null; channelUrl?: string }> {
  const target = parseYouTube(raw);
  if (!target) return { name: null };

  try {
    if (target.kind === "video") {
      const watch = `https://www.youtube.com/watch?v=${target.id}`;
      const endpoint =
        "https://www.youtube.com/oembed?url=" +
        encodeURIComponent(watch) +
        "&format=json";
      const response = await fetch(endpoint, {
        headers: { accept: "application/json" },
        signal: AbortSignal.timeout(8_000),
      });
      if (response.ok) {
        const payload = (await response.json()) as {
          author_name?: unknown;
          author_url?: unknown;
        };
        if (typeof payload.author_name === "string" && payload.author_name) {
          return {
            name: payload.author_name,
            channelUrl:
              typeof payload.author_url === "string" ? payload.author_url : undefined,
          };
        }
      }
      return { name: null };
    }

    const response = await fetch(target.url, {
      headers: {
        "user-agent": UA,
        "accept-language": "id-ID,id;q=0.9",
        accept: "text/html",
      },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return { name: null };
    const html = await response.text();

    const meta = html.match(/"channelMetadataRenderer":\{"title":"((?:[^"\\]|\\.)*)"/);
    if (meta) return { name: unescapeJsonString(meta[1]), channelUrl: target.url };

    // Fallback: og:title renders as "<Name> - YouTube".
    const og = html.match(/<meta property="og:title" content="([^"<]+?) - YouTube"/);
    if (og) return { name: og[1], channelUrl: target.url };

    return { name: null };
  } catch {
    return { name: null };
  }
}

function text(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

function safeParse(body: unknown): unknown {
  if (typeof body !== "string") return body;
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

export default async function handler(req: Req, res: Res) {
  // Same-origin only: the form lives on this portal, so there is no CORS
  // surface to open. (The fan sites never post requests.)
  if (req.method === "GET") {
    const raw = req.query?.resolve;
    const url = Array.isArray(raw) ? raw[0] : raw;
    const result = await resolveName(url ?? "");
    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=900");
    res.status(200).json({ ok: true, ...result });
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "method-not-allowed" });
    return;
  }

  const payload = safeParse(req.body);
  const body = (payload ?? {}) as Record<string, unknown>;

  const name = text(body.name, LIMITS.name);
  const youtube = text(body.youtube, LIMITS.youtube);
  const fan = text(body.fan, LIMITS.fan);
  const requestedBy = text(body.requestedBy, LIMITS.requestedBy);
  // Honeypot. A human never sees this field, so anything that fills it is a
  // bot -- answer with success anyway so the bot learns nothing.
  const trap = text(body.website, 40);
  if (trap) {
    res.status(200).json({ ok: true, no: null });
    return;
  }

  if (name.length < 2) {
    res.status(400).json({ error: "name-required" });
    return;
  }
  if (!parseYouTube(youtube)) {
    res.status(400).json({ error: "youtube-invalid" });
    return;
  }
  if (requestedBy.length < 2) {
    res.status(400).json({ error: "requested-by-required" });
    return;
  }

  const webhook = process.env.SUBMIT_WEBHOOK;
  if (!webhook || !/^https:\/\/script\.google\.com\/macros\//.test(webhook)) {
    res.status(503).json({ error: "webhook-unconfigured" });
    return;
  }

  try {
    const response = await fetch(webhook, {
      method: "POST",
      headers: { "content-type": "application/json" },
      // Apps Script reads the raw body, not a parsed one.
      body: JSON.stringify({ name, youtube, fan, requestedBy }),
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) {
      res.status(502).json({ error: "sheet-unreachable" });
      return;
    }
    // The script replies {ok, no}. Anything unparseable still means the row
    // was appended (a 200 from /exec is the append), so the number is optional.
    let no: number | null = null;
    try {
      const reply = (await response.json()) as { no?: unknown };
      if (typeof reply.no === "number") no = reply.no;
    } catch {
      /* keep no:null */
    }
    res.status(200).json({ ok: true, no });
  } catch {
    res.status(502).json({ error: "sheet-unreachable" });
  }
}
