# VTube Info

An independent index of VTuber Indonesian channels. Each creator has their own
site; this one links to them.

Live at [vtube-info.xyz](https://vtube-info.xyz).

## What is here

Three routes, served as a static SPA:

| Route      | Page                                                      |
| ---------- | --------------------------------------------------------- |
| `/`        | Masthead, and the creator list as ruled rows               |
| `/kreator` | The same creators, as cards with avatars and channel links |
| `/tentang` | Who built it, and what it is built with                    |

## Stack

Versions as installed. If one drifts from `package.json`, `package.json` wins.

- **React 19** — routing and components
- **TypeScript** — strict, no implicit `any`
- **Vite 8** — build and bundling
- **Tailwind CSS 4** — colour tokens and layout
- **anime.js 4** — every animation on the site

## Adding a creator

Everything about them lives in `src/content.ts`. One entry is the whole job:

```ts
{
  slug: "namakamu",
  name: "Nama Kamu",
  role: "Siapa dia",              // leads; the character, not the format
  format: "ID/EN VTuber · Live 2D", // trails, quieter
  blurb: "Satu baris.",
  href: "https://namakamu.vtube-info.xyz",
  avatar: "https://namakamu.vtube-info.xyz/og-image.png",
  channels: [{ label: "YouTube", href: "https://..." }],
  tags: ["#Tag"],
}
```

Every count in the copy is derived from the array length through
`creatorCount()`, so the sentences in `/kreator` and on the home page update
themselves. Nothing in the markup hardcodes a number.

## Motion

`src/motion.ts` owns all of it, built on anime.js v4:

- **`createScope({ mediaQueries })`** is the responsive layer. Breakpoints are
  declared once as named queries; when one changes, the scope reverts and
  re-runs its constructor with the new `self.matches`. Animations are authored
  once and rebuilt per breakpoint rather than duplicated per breakpoint.
- **`splitText`** breaks the headline into words. `accessible: true` leaves a
  real text node behind, so the heading is not read out one span at a time.
- **`stagger()`** with `from` and `jitter` for the lists. Even spacing is the
  most recognisable motion template there is.
- **`onScroll({ sync: true })`** links each reveal's progress to the element's
  position in the viewport. This is a scrubbed tween, not a trigger that fired
  once.

Under `prefers-reduced-motion` nothing animates in: elements are forced to their
resting state and the page is simply present. The scope is reverted on unmount,
which is what stops a route change from leaving the next page at `opacity: 0`.

## Design

Three colours, used as given:

| Role   | Hex       |
| ------ | --------- |
| Base   | `#F2B880` |
| Shadow | `#C48459` |
| Accent | `#FFF2AC` |

Neutrals are peach-tinted rather than grey — a grey under a peach page reads as
dirt. Both light and dark ship; in dark the peach becomes the ground and the
accent becomes the text colour, because a base that reads as a surface in light is
a surface you cannot put text on.

Type: **Cormorant Garamond** for display, **Outfit** for body. Both self-hosted
via `@fontsource-variable`, so no render-blocking request to a font CDN.

## Commands

```bash
npm install
npm run dev       # Vite dev server
npm run build     # typecheck, then build to dist/
npm run preview   # serve dist/
npm run lint      # oxlint
```

## Notes

Fan pages, not official pages. Artwork and material on each creator's site belong
to that creator; official channel links are in every row.