import { useEffect, useRef, useState } from "react";

const ROLL_MS = 440;

/**
 * A number that slides when it changes.
 *
 * Up when the count rises, down when it falls, so the direction of the change is
 * readable without reading the digits. The old value leaves the way the new one
 * arrived, which is what makes the pair read as one number rolling rather than two
 * numbers cross-fading.
 *
 * Why a rolling pair rather than a counting animation
 * ---------------------------------------------------
 * Animating from old to new would sweep through every intermediate value, so a
 * jump of 12 to 340 would count up through every number in between. A viewer count
 * does not grow one viewer at a time; YouTube re-reports the figure and it lands
 * wherever it lands. Rolling the two real values says exactly what happened.
 *
 * Below the threshold nothing moves. A count shifting by one or two every ten
 * seconds is a twitching number, which is worse than a number that only moves when
 * the move is worth seeing.
 *
 * Keyframes rather than transitions
 * ---------------------------------
 * An element that mounts already carrying its end state has nothing to transition
 * from. The outgoing number would sit at its final offset from the first frame and
 * simply vanish, which is what a first attempt at this did -- measured, and it
 * never moved. An animation runs from its first keyframe on mount, which is what a
 * swap needs. The four keyframes are in index.css next to the other keyframes on
 * the site.
 *
 * No animation library
 * --------------------
 * The six fan sites roll this with framer-motion's AnimatePresence. This site does
 * not have it, and adding it for one component is not worth a dependency and a
 * peer range to reason about. Reduced motion is handled by removing the animation
 * through Tailwind's motion-reduce variant rather than by detecting it here, so a
 * reader who asked for stillness gets none of the movement.
 *
 * Accessibility
 * -------------
 * The moving digits are aria-hidden and a single sr-only span carries the value.
 * Two numbers are genuinely in the DOM mid-roll, and a screen reader walking that
 * DOM would read both -- or worse, read them in whatever order the swap landed in.
 */
export function LiveNumber({
  value,
  format = (n: number) => String(n),
  /** Changes smaller than this do not animate. */
  threshold = 3,
}: {
  value: number;
  format?: (n: number) => string;
  threshold?: number;
}) {
  const [settled, setSettled] = useState<number>(value);
  const [roll, setRoll] = useState<{ from: number; rising: boolean } | null>(null);
  const previous = useRef<number>(value);

  useEffect(() => {
    const from = previous.current;
    previous.current = value;
    // The first render is not a change, so nothing should move.
    if (from === value) return;

    if (Math.abs(value - from) < threshold) {
      setSettled(value);
      return;
    }

    const rising = value > from;
    setSettled(value);
    setRoll({ from, rising });

    const done = setTimeout(() => setRoll(null), ROLL_MS);
    return () => clearTimeout(done);
  }, [value, threshold]);

  const ease = "cubic-bezier(0.16, 1, 0.3, 1)";

  return (
    <span className="inline-flex items-baseline">
      {/*
        Both numbers sit in the same grid cell, so they overlap and nothing below
        them moves. The travel is a fixed 1.6em rather than a percentage: the
        element is one line tall, so even 110% of it is about fifteen pixels, which
        is too small to read as movement. A line and a half is enough for the
        direction to be legible at a glance and no more.
      */}
      <span
        data-live-number
        aria-hidden="true"
        className="inline-grid [grid-template-columns:1fr] overflow-hidden align-baseline [font-variant-numeric:tabular-nums]"
      >
        {roll && (
          <span
            className="col-start-1 row-start-1 motion-reduce:animate-none"
            style={{
              animationName: roll.rising ? "live-number-out-up" : "live-number-out-down",
              animationDuration: `${ROLL_MS}ms`,
              animationTimingFunction: ease,
              animationFillMode: "forwards",
            }}
          >
            {format(roll.from)}
          </span>
        )}

        <span
          className="col-start-1 row-start-1 motion-reduce:animate-none"
          style={
            roll
              ? {
                  animationName: roll.rising ? "live-number-in-up" : "live-number-in-down",
                  animationDuration: `${ROLL_MS}ms`,
                  animationTimingFunction: ease,
                  animationFillMode: "forwards",
                }
              : undefined
          }
        >
          {format(settled)}
        </span>
      </span>

      <span className="sr-only">{format(value)}</span>
    </span>
  );
}