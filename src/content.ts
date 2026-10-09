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
];

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