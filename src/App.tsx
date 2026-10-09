import { useEffect, useRef } from "react";
import { Route, Routes, useLocation } from "react-router-dom";

import { Footer } from "./components/Footer";
import { Home } from "./components/Home";
import { Kreator } from "./components/Kreator";
import { Nav } from "./components/Nav";
import { Tentang } from "./components/Tentang";
import { mountPageMotion } from "./motion";

/**
 * Mounts the page motion scope for the current route.
 *
 * Keyed on the pathname so a route change tears the old scope down and builds a
 * new one: the previous page's elements are unmounted, and its scope's revert()
 * strips the inline styles it left on them. Without the revert, the next page
 * inherits opacity 0 and nothing ever appears.
 */
function MotionRoot({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    return mountPageMotion(node);
    // pathname is the dependency on purpose: a new route is a new set of
    // elements and a new scope.
  }, [pathname]);

  return <div ref={ref}>{children}</div>;
}

export default function App() {
  return (
    <>
      {/* Skip link: the nav is the first thing in the tab order on every page. */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-pill focus:bg-[var(--accent)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-[var(--surface)]"
      >
        Lewati ke konten
      </a>

      <Nav />

      <main id="main" className="min-h-[70dvh]">
        <MotionRoot>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/kreator" element={<Kreator />} />
            <Route path="/tentang" element={<Tentang />} />
          </Routes>
        </MotionRoot>
      </main>

      <Footer />
    </>
  );
}