/**
 * The sticky top bar.
 *
 * Real links, one line at desktop, and the theme toggle on the end. Height is
 * capped deliberately: a bar that eats a fifth of the viewport pushes the hero
 * below the fold on a laptop, which is the opposite of what a landing wants.
 */
import { Moon, Sun } from "@phosphor-icons/react";
import { Link, useLocation } from "react-router-dom";

import { navigation, site } from "../content";
import { useTheme } from "../useTheme";

export function Nav() {
  const { pathname } = useLocation();
  const [theme, toggleTheme] = useTheme();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[color-mix(in_oklab,var(--surface)_88%,transparent)] backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-5 sm:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/logo.jpg" alt="" className="size-8 rounded-lg object-cover" />
          <span className="font-display text-lg font-semibold tracking-tight">
            {site.name}
          </span>
        </Link>

        <nav aria-label="Bagian halaman" className="flex items-center gap-6 text-sm">
          {navigation.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                aria-current={active ? "page" : undefined}
                className={`transition-colors hover:text-[var(--accent)] ${
                  active ? "text-[var(--accent)]" : "text-[var(--text-muted)]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === "light" ? "Mode gelap" : "Mode terang"}
          className="-translate-y-px rounded-pill p-2 text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-deep)] hover:text-[var(--accent)] active:scale-95"
        >
          {theme === "light" ? (
            <Moon size={18} weight="fill" aria-hidden="true" />
          ) : (
            <Sun size={18} weight="fill" aria-hidden="true" />
          )}
        </button>
      </div>
    </header>
  );
}