/**
 * The sticky top bar.
 *
 * Two layouts, one bar. Desktop is the wordmark, the links inline, and the theme
 * toggle on the end. Below md the links move into a disclosure panel, because a
 * 65px bar with three links, a wordmark and a toggle does not fit a 360px screen
 * as three things you can actually hit.
 *
 * The tap targets are the part that was quietly broken. The inline links were
 * bare text with no padding, so each measured 54x20 -- a fifth of the 44px
 * minimum, on the one surface people touch most. Nothing overflowed at any width
 * and there was no mobile menu at all, so the layout "fit" while being unusable:
 * the numbers were identical at 360, 390, 768 and 1280, which is what a header
 * with no responsive behaviour looks like when you measure it.
 *
 * The panel closes on Escape, on choosing a destination, and on a click outside,
 * because a menu that stays open after you have used it is the other half of the
 * same problem. Focus moves into the panel when it opens and returns to the button
 * when it closes, so a keyboard user is never left somewhere they did not choose.
 */
import { useEffect, useRef, useState } from "react";
import { List, Moon, Sun, X } from "@phosphor-icons/react";
import { Link, useLocation } from "react-router-dom";

import { navigation, site } from "../content";
import { useTheme } from "../useTheme";

export function Nav() {
  const { pathname } = useLocation();
  const [theme, toggleTheme] = useTheme();
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Navigating is the point of the menu, so a chosen destination closes it.
  //
  // Adjusted during render rather than in an effect: comparing the previous path
  // against the current one and resettting in the same pass is the pattern React
  // documents for "reset state when a value changes", and it closes the panel in
  // the same commit as the route change. An effect would leave it open for one
  // frame, and calling setState synchronously inside an effect is a second render
  // for something already known during this one.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  // Escape closes, and hands focus back to the button that opened the panel.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      toggleRef.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // The page behind should not scroll away under an open panel.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[color-mix(in_oklab,var(--surface)_88%,transparent)] backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-5 sm:px-8">
        <Link to="/" className="flex min-h-11 items-center gap-2.5">
          <img src="/logo.jpg" alt="" className="size-8 rounded-lg object-cover" />
          <span className="font-display text-lg font-semibold tracking-tight">
            {site.name}
          </span>
        </Link>

        {/* Inline links, desktop only. Hidden rather than wrapped: at this width a
            second row would push the hero down and re-introduce the tall-bar
            problem the height cap exists to avoid. */}
        <nav aria-label="Bagian halaman" className="hidden items-center gap-1 text-sm md:flex">
          {navigation.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex min-h-11 items-center rounded-pill px-4 transition-colors hover:text-[var(--accent)] ${
                  active ? "text-[var(--accent)]" : "text-[var(--text-muted)]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "light" ? "Mode gelap" : "Mode terang"}
            className="-translate-y-px grid size-11 place-items-center rounded-pill text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-deep)] hover:text-[var(--accent)] active:scale-95"
          >
            {theme === "light" ? (
              <Moon size={18} weight="fill" aria-hidden="true" />
            ) : (
              <Sun size={18} weight="fill" aria-hidden="true" />
            )}
          </button>

          {/* The disclosure. md:hidden because the inline nav takes over there. */}
          <button
            ref={toggleRef}
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? "Tutup menu" : "Buka menu"}
            aria-expanded={open}
            aria-controls="nav-mobile"
            className="-translate-y-px grid size-11 place-items-center rounded-pill text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-deep)] hover:text-[var(--accent)] active:scale-95 md:hidden"
          >
            {open ? (
              <X size={20} weight="bold" aria-hidden="true" />
            ) : (
              <List size={20} weight="bold" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/*
        The panel. Rendered only while open rather than hidden with CSS, so its
        links are out of the tab order when it is closed -- a hidden panel that
        still holds focusable children is focusable by keyboard, which is the
        other way this kind of menu goes wrong.
      */}
      {open && (
        <>
          <div
            className="fixed inset-0 top-16 z-30 bg-[color-mix(in_oklab,var(--color-ink)_45%,transparent)] md:hidden"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <nav
            id="nav-mobile"
            aria-label="Bagian halaman"
            className="fixed inset-x-0 top-16 z-40 border-b border-[var(--line)] bg-[var(--surface)] px-5 pb-4 pt-2 shadow-lg md:hidden"
          >
            <ul className="flex flex-col">
              {navigation.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href} className="border-b border-[var(--line)] last:border-b-0">
                    <Link
                      to={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`flex min-h-14 items-center text-lg transition-colors hover:text-[var(--accent)] ${
                        active ? "text-[var(--accent)]" : "text-[var(--text)]"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </>
      )}
    </header>
  );
}