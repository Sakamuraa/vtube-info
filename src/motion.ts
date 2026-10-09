/**
 * Page motion, built on anime.js v4.
 *
 * Earlier passes hand-rolled staggering with CSS transitions plus an
 * IntersectionObserver, and drove a Three.js scene from a bespoke rAF loop. Both
 * are gone. anime.js already does all of this and it was sitting in package.json
 * unused. What is used here, and why each:
 *
 * `createScope({ mediaQueries })` is the responsive layer. A scope declares named
 * media queries and passes the current match state to its constructor as
 * `self.matches`. When a query's state changes the scope reverts and re-runs its
 * constructor, so animations are authored once and re-authored per breakpoint
 * instead of duplicated per breakpoint. That is what "responsive animation" means
 * here: not a media query in CSS, but animation parameters that change and get
 * rebuilt.
 *
 * `splitText` breaks the headline into words so it can be animated as words
 * rather than as one block, and `accessible: true` leaves a real text node behind
 * for screen readers -- a headline split into spans and read span by span is
 * unreadable, and this is the flag that prevents it.
 *
 * `stagger()` takes more than a number: `from` anchors the wave, `jitter` breaks
 * the regularity that makes a stagger look mechanical, and `grid`/`axis` order by
 * position on a 2D field.
 *
 * `onScroll({ sync: true })` ties an animation's progress to an element's position
 * in the viewport. This replaced the IntersectionObserver: it is not a "fire once"
 * trigger bolted beside a tween, it is the tween itself, scrubbed by scroll
 * position, with enter/leave thresholds.
 *
 * Scope ownership: one scope per route, reverted on unmount. revert() unwinds
 * every animation the scope created and strips the inline styles it applied,
 * which is why a route change does not leave the next page holding opacity 0.
 */

import {
  createScope,
  animate,
  createTimeline,
  onScroll,
  stagger,
  utils,
  type Scope,
} from "animejs";
import { splitText } from "animejs/text";

/**
 * Named breakpoints.
 *
 * The same widths Tailwind uses, so the JS and the CSS agree about what "small"
 * means. If they drift, an animation rebuilds at a width where the layout has not
 * actually changed.
 *
 * `reduceMotion` belongs here rather than being read once at mount: it can change
 * while the page is open, and the scope should rebuild when it does.
 */
const MEDIA_QUERIES = {
  reduceMotion: "(prefers-reduced-motion: reduce)",
  isSmall: "(max-width: 767px)",
  isMedium: "(min-width: 768px) and (max-width: 1023px)",
  isLarge: "(min-width: 1024px)",
  isCoarse: "(pointer: coarse)",
};

/** Everything the entrance animations touch, so reduced motion can reset it. */
const ANIMATED = [
  "[data-hero-masthead]",
  "[data-hero-line]",
  "[data-hero-title]",
  "[data-hero-foot]",
  "[data-reveal]",
  "[data-stagger] > *",
  "[data-index-row]",
  "[data-index-arrow]",
].join(", ");

/**
 * The masthead entrance.
 *
 * A timeline rather than four separate animations, because it is a sequence and
 * should read as one: the masthead's rule draws, the kicker lands, the headline
 * arrives word by word, then the foot. The words use a grid-free stagger with a
 * small jitter, because a perfectly even word cascade is the most recognisable
 * motion template there is.
 */
function mastheadSequence(isSmall: boolean) {
  const title = document.querySelector<HTMLElement>("[data-hero-title]");

  if (title) {
    const split = splitText(title, {
      words: true,
      // Keeps the headline as real text for assistive tech. Without this the
      // visible words are spans and the heading reads out one fragment at a time.
      accessible: true,
    });

    animate(split.words, {
      opacity: [0, 1],
      // 0.5em rather than a fixed px: the headline is clamp-sized, so a px offset
      // that looks right at 7rem is invisible at 2.75rem.
      translateY: ["0.5em", "0"],
      filter: ["blur(8px)", "blur(0px)"],
      duration: 1050,
      delay: stagger(isSmall ? 55 : 75, {
        start: 220,
        from: "first",
        jitter: isSmall ? 0 : 30,
      }),
    });
  }

  animate("[data-hero-line]", {
    opacity: [0, 1],
    translateY: [10, 0],
    duration: 800,
    delay: 120,
  });

  animate("[data-hero-foot]", {
    opacity: [0, 1],
    translateY: [16, 0],
    duration: 900,
    // Starts after the headline has mostly landed, so the foot does not arrive
    // underneath a still-moving headline.
    delay: 620,
  });

  // The rules above and below the masthead draw themselves in. Cheap, and it is
  // what makes the section read as a masthead rather than a padded block.
  animate("[data-hero-masthead]", {
    borderTopWidth: ["0px", "1px"],
    duration: 900,
    ease: "outQuart",
  });
}

/**
 * Scroll-linked reveals.
 *
 * Each target gets its own ScrollObserver synced to its own animation, so the
 * tween's progress is the element's position in the viewport rather than a boolean
 * that fired once. `enter: '15%'` means nothing has begun until the element is a
 * sixth of the way into the viewport, which stops sections snapping in while they
 * are still below the fold.
 */
function scrollReveals(host: HTMLElement, isSmall: boolean, isLarge: boolean) {
  for (const el of host.querySelectorAll<HTMLElement>("[data-reveal]")) {
    animate(el, {
      opacity: [0, 1],
      translateY: [24, 0],
      duration: 1000,
      delay: stagger(isSmall ? 70 : 110, { start: 60 }),
    });

    onScroll({
      target: el,
      enter: "15%",
      // Leaving resets it, entering replays it. Scrolling back up does not
      // restart sections already read, because `repeat` stays false.
      leave: "bottom-=8%",
      sync: true,
      repeat: false,
    });
  }

  for (const group of host.querySelectorAll<HTMLElement>("[data-stagger]")) {
    const items = [...group.children];
    if (items.length === 0) continue;

    animate(items, {
      opacity: [0, 1],
      translateY: [20, 0],
      duration: 900,
      delay: stagger(isSmall ? 60 : 90, {
        start: 80,
        from: "first",
        // The difference between "arrived" and "deployed". Large enough to feel,
        // small enough not to read as random.
        jitter: isLarge ? 45 : 0,
      }),
    });

    onScroll({ target: group, enter: "12%", leave: "bottom-=8%", sync: true });
  }

  /*
   * The index rows.
   *
   * The page's only real content list, so they get directional treatment: the
   * wave enters from the first row, and each row's arrow trails its own row so the
   * eye is led across rather than dropped into the middle of the list.
   */
  const rows = host.querySelectorAll<HTMLElement>("[data-index-row]");
  if (rows.length > 0) {
    animate(rows, {
      opacity: [0, 1],
      translateX: [-26, 0],
      duration: 950,
      delay: stagger(140, { start: 120, from: "first" }),
    });
    onScroll({
      target: rows[0].parentElement ?? rows[0],
      enter: "15%",
      leave: "bottom-=6%",
      sync: true,
    });
  }

  const arrows = host.querySelectorAll<HTMLElement>("[data-index-arrow]");
  if (arrows.length > 0) {
    animate(arrows, {
      opacity: [0, 1],
      translateX: [-12, 0],
      duration: 700,
      delay: stagger(140, { start: 260, from: "first" }),
    });
    onScroll({
      target: arrows[0].closest("li") ?? arrows[0],
      enter: "15%",
      leave: "bottom-=6%",
      sync: true,
    });
  }
}

/**
 * A slow highlight sweep across the index rows.
 *
 * Not a scroll effect -- a loop. It exists so the page has one perpetual motion
 * and it is the only one, which is what keeps a page with a lot of entrance
 * animation from feeling like a screensaver.
 */
function idleLoop() {
  const rows = document.querySelectorAll<HTMLElement>("[data-index-row] a");
  if (rows.length === 0) return;

  createTimeline({ loop: true })
    .add(
      rows,
      {
        // A background-position sweep along the row, so the rule under the name
        // travels. Transform-only, so it stays on the compositor.
        backgroundPositionX: ["0%", "100%"],
        duration: 2600,
      },
      stagger(160, { from: "first" }),
    )
    .add(rows, { backgroundPositionX: "-100%", duration: 2600 }, 3400);
}

/**
 * Mount page motion for the current route. Returns the cleanup to run on unmount.
 */
export function mountPageMotion(host: HTMLElement): () => void {
  const scope: Scope = createScope({
    root: host,
    mediaQueries: MEDIA_QUERIES,
    defaults: { ease: "outExpo" },
  });

  scope.add((self) => {
    if (!self) return;
    const { reduceMotion, isSmall, isLarge } = self.matches;

    if (reduceMotion) {
      /*
       * Reduced motion is not "shorter animations", it is no entrance animations
       * at all. Everything is forced to its resting state and nothing below runs,
       * so the page is simply present rather than animated into existence.
       */
      utils.set(ANIMATED, {
        opacity: 1,
        translateY: 0,
        translateX: 0,
        translateZ: 0,
        scaleY: 1,
        scaleX: 1,
        filter: "none",
        backgroundPositionX: "0%",
      });
      // The headline still has to be split before it can be reset, or the reset
      // silently matches nothing.
      const title = host.querySelector<HTMLElement>("[data-hero-title]");
      if (title) splitText(title, { words: true, accessible: true });
      return;
    }

    mastheadSequence(isSmall);
    scrollReveals(host, isSmall, isLarge);
    idleLoop();
  });

  return () => scope.revert();
}