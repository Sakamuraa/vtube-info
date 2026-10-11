import { Link } from "react-router-dom";

import { developer, site } from "../content";

export function Footer() {
  return (
    <footer className="border-t border-[var(--line)] py-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 text-sm text-[var(--text-muted)] sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p>
          {/* text-lg, set explicitly: this inherits text-sm from the row above,
              and 14px is below where a Didone's thin strokes stay solid. It also
              puts the wordmark at the same size as the one in the nav, which is
              where a repeated mark is expected to match. */}
          <span className="font-display text-lg font-semibold text-[var(--text)]">
            {site.name}
          </span>
          <span className="mx-2 text-[var(--line)]">·</span>
          {site.tagline}
        </p>

        <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {/* The credit is a name, not an account: "Developed by Sakamura". The
              GitHub handle is one click away in About, where it belongs to. */}
          <span>{developer.credit}</span>
          <span aria-hidden="true" className="text-[var(--line)]">
            ·
          </span>
          <Link
            to="/tentang"
            className="underline underline-offset-4 transition-colors hover:text-[var(--accent)]"
          >
            Tentang
          </Link>
        </p>
      </div>
    </footer>
  );
}