/**
 * Site content.
 *
 * Everything the pages render comes from here, so the portal, the nav and the
 * footer cannot drift apart, and the creators list is one array rather than
 * several hardcoded cards. Adding a creator means adding one entry.
 */

export type Creator = {
  slug: string;
  name: string;
  /**
   * The character first, then the craft.
   *
   * Not "VTuber · Live 2D · ID/EN" on every row: that says the same thing twice
   * and tells a visitor nothing about who the person is. "Hamster princess" and
   * "Bintang nyasar" are the two things that actually distinguish them, so they
   * lead.
   */
  role: string;
  /** The format line, kept separate so it can sit quieter than the role. */
  format: string;
  /** One line, what they are. No "multi-platform content creator". */
  blurb: string;
  /** Where their own site lives. */
  href: string;
  /**
   * Their og:image, which is their avatar, served from their own site.
   *
   * This is the same file their social card uses, so the picture here and the
   * picture a share shows are the same picture -- there is no second, smaller
   * copy of the avatar to drift out of sync with it.
   */
  avatar: string;
  channels: { label: string; href: string }[];
  /** Their own hashtags, as they write them. */
  tags: string[];
};

export const site = {
  name: "VTube Info",
  tagline: "A small index of VTubers",
  url: "https://vtube-info.xyz",
  description:
    "An independent index of VTubers, the people behind them, and where to find them.",
};

/**
 * The developer.
 *
 * `name` is how he is credited, `handle` is the GitHub account URL. These are
 * deliberately different strings -- Sakamura is the name, Sakamuraa is the
 * username -- and collapsing them into one field is how a byline ends up reading
 * "Sakamuraa" when it should read "Sakamura".
 */
export const developer = {
  name: "Sakamura",
  handle: "Sakamuraa",
  profile: "https://github.com/Sakamuraa",
  /** Shown in the footer, where the name is all that is needed. */
  credit: "Developed by Sakamura",
};

export const navigation = [
  { label: "Beranda", href: "/" },
  { label: "Kreator", href: "/kreator" },
  { label: "Request", href: "/submit" },
  { label: "Tentang", href: "/tentang" },
];

export const creators: Creator[] = [
  {
    slug: "mizu-hamzazu",
    name: "Mizu Hamzazu",
    role: "Hamster princess",
    format: "ID/EN VTuber · Live 2D",
    blurb:
      "Satu putri dari kerajaan Hamzazu. Stream hampir tiap hari, dan arsip meme-nya tidak pernah berhenti tumbuh.",
    href: "https://mizuhamzazu.vtube-info.xyz",
    avatar: "https://mizuhamzazu.vtube-info.xyz/og-image.png",
    channels: [
      { label: "YouTube", href: "https://www.youtube.com/@MizuHamzazu" },
      { label: "X", href: "https://x.com/mizuhamzazu" },
      { label: "Trakteer", href: "https://trakteer.id/MizuHamzazu" },
    ],
    tags: ["#MizuHamzazu", "#Meme"],
  },
  {
    slug: "pingu-stardine",
    name: "Pingu Stardine",
    role: "Bintang nyasar",
    format: "ID/EN VTuber · Live 2D",
    blurb:
      "Bintang nyasar yang jatuh ke bumi, lalu membuka Cat Cafe. Stream, cover, dan debut PV yang terasa seperti gelombang pertama.",
    href: "https://pingu.vtube-info.xyz",
    avatar: "https://pingu.vtube-info.xyz/og-image.png",
    channels: [
      { label: "YouTube", href: "https://www.youtube.com/@pinguvtuber" },
      { label: "X", href: "https://x.com/pingustardine" },
      { label: "Trakteer", href: "https://trakteer.id/pinguvtuber" },
    ],
    tags: ["#PingGambar", "#PingSUS", "#Pingfo"],
  },
  {
    slug: "sierra-mooniva",
    name: "Sierra Mooniva",
    role: "Virtual corporate secretary",
    /*
     * No "Live 2D" here, unlike the two rows above.
     *
     * That format is a claim about a rig, and it is only made where the creator
     * states it. Sierra's channel description and X bio say nothing about how she
     * is animated, so the line carries only what her own tabs show: Indonesian
     * stream titles against an English bio, and an upload history that is half
     * streams and half covers. Guessing "Live 2D" because the neighbours have it
     * is how a row ends up asserting something nobody checked.
     */
    format: "ID/EN VTuber · Stream & cover",
    blurb:
      "Hewwo! Virtual Corporate Slav- Secretary who love playing JRPG is here! Nice to meet you! :3",
    href: "https://sierramooniva.vtube-info.xyz",
    avatar: "https://sierramooniva.vtube-info.xyz/og-image.png",
    channels: [
      { label: "YouTube", href: "https://www.youtube.com/@SierraMooniva" },
      { label: "X", href: "https://x.com/SierraMooniva" },
      /*
       * Her own site, not Trakteer. The other two have a Trakteer; hers is the
       * framer.website link from her X bio, and a Trakteer row would be a guess
       * that renders as a dead link if it is wrong.
       */
      { label: "Website", href: "https://sierramooniva.framer.website" },
    ],
    tags: ["#SierraMooniva", "#SierraonAir", "#MoonivArt", "#Sierramoonclips"],
  },
  {
    slug: "deidey",
    name: "Deidey",
    role: "Isekai rabbit warrior",
    /*
     * "Live 2D" is sourced, unlike Sierra's row above.
     *
     * Her own X bio credits the illustrator as "Illustrator Live 2D", which only
     * makes sense against a Live 2D rig. That is her saying so, not the
     * neighbouring rows being copied across.
     */
    format: "ID/EN VTuber · Live 2D",
    blurb:
      "Isekai Rabbit Warrior. Elite warrior from Praedisium, siap merusak. Punya rutinitas tetap: PvZ2, karaoke, drawings, dan cerita serial.",
    href: "https://deidey.vtube-info.xyz",
    avatar: "https://deidey.vtube-info.xyz/og-image.png",
    channels: [
      { label: "YouTube", href: "https://www.youtube.com/@Deidey" },
      { label: "X", href: "https://x.com/deidey16_" },
      { label: "Shopee", href: "https://shopee.co.id/deideyisekaistore" },
    ],
    tags: ["#Deyillust", "#Deyonair", "#Clipdey", "#Deylist"],
  },
  {
    slug: "kanata-reina",
    name: "Kanata Reina",
    role: "Love witch",
    /*
     * "Live 2D" here, and "ID/EN" alongside it.
     *
     * Her channel description opens "Virtual Youtuber Indonesia" and her own site
     * lists her languages as Indonesian and English, and the rig is what her site
     * states in its own facts grid -- so this row matches what she publishes about
     * herself rather than what a single tab happens to show. It also brings her
     * in line with the rows above, which is what a reader scanning the column
     * expects.
     */
    format: "ID/EN VTuber · Live 2D",
    blurb:
      "Virtual Youtuber Indonesia yang menandai dirinya dengan sebutan love witch. Sesi pendek dengan pajamas night dan ASMR oncam, lalu cover yang hampir selalu berbahasa Inggris.",
    href: "https://kanatareina.vtube-info.xyz",
    avatar: "https://kanatareina.vtube-info.xyz/og-image.png",
    channels: [
      { label: "YouTube", href: "https://www.youtube.com/@KanataReinaCh" },
      { label: "X", href: "https://x.com/Kanata_Reina" },
      { label: "TikTok", href: "https://www.tiktok.com/@kanatareina" },
    ],
    tags: ["#kanatareina", "#ReinaGambar", "#ReinaGaming", "#ReinaKaraoke"],
  },
  {
    slug: "lunie",
    name: "Lunie",
    role: "Moon of Eternal Gryph",
    /*
     * No "Live 2D", and that is the second row in a row to leave it off.
     *
     * Checked rather than copied from the rows above: "Live 2D", "rigging" and
     * "rigged" appear nowhere in her bio, her posts or her video descriptions, and
     * the only "runtime" on her channel page is YouTube's own
     * ShadyCSS.disableRuntime flag. Her own site states the same omission in its
     * own README. The rig is a claim about a person, and it is only made where the
     * person makes it -- Sierra because hers says nothing either, Deidey because
     * hers credits an "Illustrator Live 2D".
     *
     * What is here is what her feed shows: Indonesian stream and Shorts titles
     * against an English bio, and an upload history that is ASMR sessions, covers
     * and debut trailers. "Stream & cover" is Sierra's phrasing because it is the
     * same shape of answer, not because the two rows are similar people.
     */
    format: "ID/EN VTuber · Stream & cover",
    /*
     * Every clause is checkable. The bio is hers verbatim; the join date is off her
     * own /about; the ASMR and cover series are read off her feed titles; and the
     * weekly notice is a real recurring post she titles WEEKLY SCHEDULE and
     * schedules on YouTube. No colour, no personality, nothing about how she looks.
     */
    blurb:
      "The Moon of Eternal Gryph. Bergabung sejak Juni 2023, dengan rutinitas tetap: sesi ASMR oncam, cover yang hampir selalu berbahasa Inggris, dan satu jadwal mingguan yang diumumkan lebih dulu.",
    href: "https://lunie.vtube-info.xyz",
    avatar: "https://lunie.vtube-info.xyz/og-image.png",
    channels: [
      { label: "YouTube", href: "https://www.youtube.com/@YourLuLunie" },
      { label: "X", href: "https://x.com/YourLuLunie" },
      /*
       * Trakteer, not TikTok or Discord. It is the same link the other rows with a
       * Trakteer use, it is on her own channel's Social Media block, and a
       * donation link is the row a visitor is likeliest to want. Her Instagram and
       * TikTok exist and are correct, they just are not what this column is for.
       */
      { label: "Trakteer", href: "https://trakteer.id/YourLuLunie" },
    ],
    /*
     * Two, not the eight her feed actually contains.
     *
     * #CF23, #comifuro, #comifuro23 and #cf23catalogue are convention and
     * doujin-market tags for her con run; #UtaindoRelay, #TOBEHEROX,
     * #LonelyUniverse and #EvenThoughIHadLovedYou are relay and cover tags shared
     * with every other singer taking part. All eight are real, and all eight
     * describe an event rather than her. These two are the ones that point back at
     * her, and the same two her own site shows.
     */
    tags: ["#YourLuLunie", "#ArtLunie"],
  },
  {
    slug: "astelica-kasdea",
    name: "Astelica Kasdea",
    role: "Fallen angel",
    /*
     * "Live 2D" here, and it is the most directly sourced of the rows: her own X
     * bio reads "L2D by @biittertaste & @saikafuri". That is her saying so and
     * naming both illustrators in the same breath, which is the standard the
     * other rows are held to -- Deidey's is the same shape, and the rows without
     * it are the ones where nothing states it.
     */
    format: "ID/EN VTuber · Live 2D",
    /*
     * Every clause traceable. The bio is hers in both places it appears; "fallen
     * angel living in her dreams" is the first line of it. The covers are not
     * assumed from the bio's "I love music, singing" -- her video tab is almost
     * entirely covers, which is what that line turns out to mean in practice. The
     * five tags are hers too, and in her order: she published a post that is
     * a key, labelling each one General / Live / Art / Music / Meme, so this is
     * her taxonomy rather than a selection made here.
     */
    blurb:
      "Fallen angel yang tinggal di dream realm. Stream, cover, dan gambar yang dikumpulkan dari kreator lain lewat #kasdeart.",
    href: "https://kasdea.vtube-info.xyz",
    avatar: "https://kasdea.vtube-info.xyz/og-image.png",
    channels: [
      { label: "YouTube", href: "https://www.youtube.com/@AstelicaKasdea" },
      { label: "X", href: "https://x.com/astelicakasdea" },
    ],
    /*
     * Her own labels, in her own order, taken from the post that defines them.
     * Worth noting against the row above: those four had to be chosen from a
     * timeline full of convention tags, while these five arrived already sorted
     * by the person they describe.
     */
    tags: ["#AstelicaKasdea", "#LicaLive", "#kasdeart", "#utanodea", "#kasdeakocak"],
  },
  {
    slug: "naplive",
    name: "NapLive",
    role: "Streamer & artist",
    /*
     * No "Live 2D": nothing on the channels or the X bio states a rig, and this
     * person is as much an artist as a streamer. The format line carries only
     * what the channels show -- livestreams and art.
     */
    format: "ID · Livestream & art",
    blurb:
      "Tiga channel YouTube — NapKing untuk upload, NapLive untuk livestream, dan Nepnep untuk stream & klip — plus art yang diposting langsung di X.",
    href: "https://naplive.vtube-info.xyz",
    avatar: "https://naplive.vtube-info.xyz/og-image.png",
    channels: [
      { label: "NapLive", href: "https://www.youtube.com/@naplive7" },
      { label: "NapKing", href: "https://www.youtube.com/@napking7" },
      { label: "Nepnep", href: "https://www.youtube.com/@nepnep7" },
      { label: "X", href: "https://x.com/Alfachri9" },
    ],
    tags: ["#NapLive"],
  },
  {
    slug: "zeyayaya",
    name: "Zeyayaya",
    role: "Dream keeper",
    /*
     * No "Live 2D": her own site's facts grid shipped that cell and the comment
     * that replaced it records why it came out -- "Live 2D", "rigging" and
     * "rigged" appear nowhere in her bio, her posts, or her video descriptions.
     * What the same grid does state is her languages cell, "Indonesia dan
     * Inggris", which is where "ID/EN" comes from; "Stream & art" is the two
     * channels' own notes ("Stream & upload" on YouTube, "Update & art" on X).
     */
    format: "ID/EN VTuber · Stream & art",
    /*
     * First clause is her channel description's own line ("Penjaga mimpimu
     * agar tidurmu nyenyak"), Pond of Dream the community it names. Both tags
     * are hers too: #haizeyart is labelled "Art" in her X bio, #merchaizeya is
     * the tag she asks merch buyers to photo-post with.
     */
    blurb:
      "Penjaga mimpimu di Pond of Dream. Stream dan upload di YouTube, art di X lewat #haizeyart, dan merch dengan #merchaizeya.",
    href: "https://zeyayaya.vtube-info.xyz",
    avatar: "https://zeyayaya.vtube-info.xyz/og-image.png",
    channels: [
      { label: "YouTube", href: "https://www.youtube.com/@ZeyaHaize" },
      { label: "X", href: "https://x.com/zeyahaize" },
      /*
       * Trakteer, not Instagram or Pond of Dream. The donation link is the row
       * a visitor is likeliest to want, and it is one of the "link lainnya"
       * YouTube itself renders from her channel's JSON-LD sameAs block -- the
       * same declaration standard as the Instagram and the community invite
       * beside it, which exist and are correct but are not what this column is
       * for.
       */
      { label: "Trakteer", href: "https://trakteer.id/ZeyaHaize" },
    ],
    tags: ["#haizeyart", "#merchaizeya"],
  },
  {
    slug: "gepigepeng",
    name: "Gepii Gepeng",
    role: "Suka yapping",
    /*
     * No "Live 2D": her channel description names the character's credits
     * ("Mama: @lizacchi Papa: @raxgnvindr") but says nothing about a rig, and
     * "Live 2D" appears nowhere her channel, posts, or titles do. "ID" is the
     * locale her grids and titles are in; "Yapping & cover" is what her own
     * description and feed titles call the work -- "Youtuber 1/2 Gepeng yang
     * suka Yapping", plus karaoke and cover uploads.
     */
    format: "ID VTuber · Yapping & cover",
    /*
     * First clause is her channel description's own line ("Youtuber 1/2
     * Gepeng yang suka Yapping💌"). #geppeng is the one tag she names, labelled
     * "Live:" by her. The channel rows are her channel itself plus the two
     * links in its own JSON-LD sameAs block (X, Instagram) -- no tip-jar row,
     * because no donation URL is declared there.
     */
    blurb:
      "Youtuber 1/2 Gepeng yang suka Yapping. Stream, karaoke, dan cover di YouTube, update di X dan Instagram, tag live #geppeng.",
    href: "https://gepigepeng.vtube-info.xyz",
    avatar: "https://gepigepeng.vtube-info.xyz/og-image.png",
    channels: [
      { label: "YouTube", href: "https://www.youtube.com/@GepiiGepeng" },
      { label: "X", href: "https://x.com/gepiigepeng" },
      { label: "Instagram", href: "https://instagram.com/gepiigepeng" },
    ],
    tags: ["#geppeng"],
  },
];

/**
 * Is this request already served?
 *
 * The /submit form reads this: a creator already in the index does not need
 * another request, so the form says so and blocks the send instead of queuing a
 * duplicate row in Sam's sheet.
 *
 * Matched on the YouTube channel URL first -- handles and channel ids, after
 * normalising the shapes people actually paste -- and then on the display name,
 * exact and case-insensitive. Exact on purpose: a fuzzy name match would block
 * requests for people who merely sound similar, and a blocked request for the
 * wrong person is worse than a duplicate row.
 *
 * Video links (watch, shorts, youtu.be) do not match. Resolving a video to its
 * channel needs a network call this page does not make; picks from the dropdown
 * always carry the channel URL, which is the path that matters.
 */
export function findServedCreator(name: string, youtube: string): Creator | null {
  const key = channelKey(youtube);
  if (key) {
    for (const creator of creators) {
      for (const channel of creator.channels) {
        if (channelKey(channel.href) === key) return creator;
      }
    }
  }

  const wanted = name.trim().toLowerCase().replace(/\s+/g, " ");
  if (wanted.length < 2) return null;
  for (const creator of creators) {
    if (creator.name.toLowerCase().replace(/\s+/g, " ") === wanted) return creator;
  }
  return null;
}

/**
 * One comparable key for a YouTube URL, or null if it does not name a channel.
 *
 * `@handle`, `/channel/UC…` and the legacy `/c/` + `/user/` shapes all collapse
 * to one lowercase key, so `youtube.com/@Naplive7/`, `m.youtube.com/@naplive7`
 * and a hand-pasted link with extra path segments compare equal. Video URLs
 * return null -- see findServedCreator above.
 */
function channelKey(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return null;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;

  const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
  if (host === "youtu.be") {
    // A short link is a video, never a channel.
    return null;
  }
  if (host !== "youtube.com" && host !== "m.youtube.com" && host !== "music.youtube.com") {
    return null;
  }

  const path = parsed.pathname;
  if (/^\/(?:shorts|live|embed|v)\//.test(path)) return null;

  const handle = path.match(/^\/@([\w.-]{2,})/);
  if (handle) return `@${handle[1].toLowerCase()}`;

  const channel = path.match(/^\/channel\/([\w-]{2,})/);
  if (channel) return `id:${channel[1].toLowerCase()}`;

  const legacy = path.match(/^\/(?:c|user)\/([\w.-]{2,})/);
  if (legacy) return `@${legacy[1].toLowerCase()}`;

  return null;
}

/**
 * Counts, spelled out in Indonesian.
 *
 * Every count in the copy is written through this rather than typed into a
 * sentence, because a hardcoded "Dua channel" is wrong the moment a third
 * creator is added -- which is the whole point of the array above.
 *
 * Indonesian writes "2 kanal" in running text, so the digit is the natural form;
 * it is only the sentence-initial position that needs a word. Both are provided.
 */
const NUMBER_WORDS = [
  "Nol",
  "Satu",
  "Dua",
  "Tiga",
  "Empat",
  "Lima",
  "Enam",
  "Tujuh",
  "Delapan",
  "Sembilan",
  "Sepuluh",
  "Sebelas",
  "Duabelas",
];

function word(n: number): string {
  return NUMBER_WORDS[n] ?? String(n);
}

/**
 * `channel` is invariable in Indonesian -- "1 channel" and "2 channel" are both
 * correct -- so there is no plural to compute. Only the digit form and the
 * spelled-out form differ, because only the start of a sentence needs a word.
 */
export function creatorCount(): {
  /** "2" -- for mid-sentence. */
  digits: string;
  /** "Dua" -- for the start of a sentence. */
  word: string;
  total: number;
} {
  const total = creators.length;
  return { digits: String(total), word: word(total), total };
}