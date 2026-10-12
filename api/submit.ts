/**
 * VTuber page requests.
 *
 *   GET  /api/submit?q=<search terms>  -> YouTube channels matching the name
 *   POST /api/submit                   -> forward one request into Sam's sheet
 *
 * The page at /submit is a form; this is its back end. Submissions end up as
 * rows in a Google Sheet, which is done through an Apps Script web app the
 * sheet owns (env SUBMIT_WEBHOOK) -- the Sheets API itself cannot be appended
 * to anonymously, so the script is the auth boundary. When that env is missing
 * the endpoint says so instead of pretending the row was written.
 *
 * The search half exists so a typed name can offer the channel it belongs to:
 * YouTube's results page with the channel filter applied (sp=EgIQAg==) comes
 * back as channelRenderer nodes, which are walked out into name/link/avatar.
 * When no channel matches the query the list is simply empty and the visitor
 * pastes a link by hand -- no guessing, no second request per keystroke.
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

/** How many channels one query may return, and how long the page may be. */
const SUGGEST_CAP = 8;

type Suggest = { name: string; url: string; avatar?: string; subs?: string };

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

/** Pull a display string out of YouTube's {simpleText} / {runs:[...]} shapes. */
function plainText(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (!value || typeof value !== "object") return "";
  const v = value as { simpleText?: unknown; runs?: unknown };
  if (typeof v.simpleText === "string") return v.simpleText.trim();
  if (Array.isArray(v.runs)) {
    return v.runs
      .map((run) => {
        const text = (run as { text?: unknown }).text;
        return typeof text === "string" ? text : "";
      })
      .join("")
      .trim();
  }
  return "";
}

/** Last thumbnail in the row, with //yt3... given its missing scheme. */
function avatarOf(value: unknown): string | undefined {
  if (!value || typeof value !== "object") return undefined;
  const thumbs = (value as { thumbnails?: unknown }).thumbnails;
  if (!Array.isArray(thumbs) || thumbs.length === 0) return undefined;
  const last = thumbs[thumbs.length - 1] as { url?: unknown };
  if (typeof last.url !== "string") return undefined;
  return last.url.startsWith("//") ? `https:${last.url}` : last.url;
}

/**
 * Extract the `ytInitialData = {...};` JSON blob from a results page.
 *
 * Brace-matched by hand rather than with a regex: the payload is ~700KB and
 * its strings are free to contain "};" -- a non-greedy match would cut it
 * short on the first one.
 */
function extractInitialData(html: string): Record<string, unknown> | null {
  const spaced = html.indexOf("ytInitialData = ");
  const at = spaced >= 0 ? spaced : html.indexOf("ytInitialData=");
  if (at < 0) return null;
  const start = html.indexOf("{", at);
  if (start < 0) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < html.length; i++) {
    const char = html[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') inString = true;
    else if (char === "{") depth++;
    else if (char === "}" && --depth === 0) {
      try {
        const parsed: unknown = JSON.parse(html.slice(start, i + 1));
        return parsed && typeof parsed === "object"
          ? (parsed as Record<string, unknown>)
          : null;
      } catch {
        return null;
      }
    }
  }
  return null;
}

/** Walk the page JSON and lift every channel hit, in the order they appear. */
function collectChannels(
  node: unknown,
  out: Suggest[],
  seen: Set<string>,
): void {
  if (out.length >= SUGGEST_CAP) return;
  if (Array.isArray(node)) {
    for (const item of node) collectChannels(item, out, seen);
    return;
  }
  if (!node || typeof node !== "object") return;
  const obj = node as Record<string, unknown>;

  const renderer = obj.channelRenderer;
  if (renderer && typeof renderer === "object") {
    const cr = renderer as Record<string, unknown>;
    const channelId = typeof cr.channelId === "string" ? cr.channelId : "";
    const name = plainText(cr.title);
    if (channelId && name && !seen.has(channelId)) {
      seen.add(channelId);
      const nav = cr.navigationEndpoint as
        | { browseEndpoint?: { canonicalBaseUrl?: unknown } }
        | undefined;
      const base = nav?.browseEndpoint?.canonicalBaseUrl;
      out.push({
        name,
        url:
          typeof base === "string" && base.startsWith("/")
            ? `https://www.youtube.com${base}`
            : `https://www.youtube.com/channel/${channelId}`,
        avatar: avatarOf(cr.thumbnail),
        subs: plainText(cr.subscriberCountText) || undefined,
      });
    }
    if (out.length >= SUGGEST_CAP) return;
  }

  for (const value of Object.values(obj)) collectChannels(value, out, seen);
}

/**
 * Channels whose name matches the query, best first.
 *
 * The sp parameter is YouTube's own "channel" filter chip, so the page comes
 * back as channels only -- asking for videos would make the list depend on
 * who uploaded what, which is not the question the form is asking.
 */
async function searchChannels(query: string): Promise<Suggest[]> {
  try {
    const endpoint =
      "https://www.youtube.com/results?search_query=" +
      encodeURIComponent(query) +
      "&sp=" +
      encodeURIComponent("EgIQAg==");
    const response = await fetch(endpoint, {
      headers: {
        "user-agent": UA,
        "accept-language": "id-ID,id;q=0.9",
        accept: "text/html",
      },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return [];
    const html = await response.text();
    const data = extractInitialData(html);
    if (!data) return [];
    const out: Suggest[] = [];
    collectChannels(data, out, new Set());
    return out;
  } catch {
    return [];
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
    const raw = req.query?.q;
    const query = text(Array.isArray(raw) ? raw[0] : raw, 60);
    // Under two characters the search is noise and YouTube treats it as a
    // browsing prompt, so the list stays empty and no request is made.
    const results = query.length >= 2 ? await searchChannels(query) : [];
    res.setHeader("Cache-Control", "public, s-maxage=120, stale-while-revalidate=300");
    res.status(200).json({ ok: true, results });
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
