import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import type { Plugin } from "vite";

/**
 * Start the critical webfont downloads alongside the HTML.
 *
 * A font referenced only from CSS is not discovered until the stylesheet has
 * been parsed and its @font-face rules read, which leaves the request sitting
 * behind the document. The faces here are font-display: swap, so the browser
 * paints the fallback for the whole of that window and then swaps -- and that
 * swap is the flash Sam sees on a hard refresh, where the cache is bypassed and
 * the fetch always happens again. Preloading moves the request up to the <link>,
 * so it runs in parallel with the document rather than after it.
 *
 * Only the latin subsets are preloaded. Fontsource emits one @font-face per
 * unicode-range, so the same stylesheet references latin-ext, math and symbols
 * files this page never paints -- preloading those would spend connections on
 * bytes that are only downloaded if some glyph happens to need them.
 *
 * And only the faces the site chrome actually sets. The specimen route declares
 * four more sans faces purely so they can be compared on /tipe; a bare subset
 * filter would hoist those onto every page load to serve one route.
 *
 * crossorigin is not optional. Fonts are always fetched in CORS mode, so a
 * preload without it does not match the later request and the browser downloads
 * every face twice.
 */
const PRELOADABLE = /^\/assets\/(jost|azeret-mono)-latin-wght-(?:normal|italic)-[^/]+\.woff2$/;

function preloadLatinFonts(): Plugin {
  return {
    name: "preload-latin-fonts",
    enforce: "post",
    generateBundle(_options, bundle) {
      const urls = new Set<string>();

      for (const file of Object.values(bundle)) {
        if (file.type !== "asset" || !file.fileName.endsWith(".css")) continue;
        for (const match of file.source.toString().matchAll(/url\(([^)]+\.woff2)\)/g)) {
          const url = match[1].replace(/^["']|["']$/g, "");
          // The hash sits between the style name and the extension, so this has
          // to allow for it: -latin-wght-normal-XXXX.woff2, never -latin-wght-normal.woff2.
          if (PRELOADABLE.test(url)) urls.add(url);
        }
      }

      if (urls.size === 0) return;

      const tags = [...urls]
        .sort()
        .map((url) => `<link rel="preload" href="${url}" as="font" type="font/woff2" crossorigin />`)
        .join("\n    ");

      for (const file of Object.values(bundle)) {
        if (file.type !== "asset" || !file.fileName.endsWith(".html")) continue;
        const html = file.source.toString();
        if (!html.includes("</head>")) continue;
        file.source = html.replace("</head>", `    ${tags}\n  </head>`);
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), preloadLatinFonts()],
});