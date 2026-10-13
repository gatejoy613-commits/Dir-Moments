"use client";

import { useEffect, useRef, useState } from "react";

// A row that scrolls sideways. It swipes and snaps with CSS alone; with JavaScript
// it also gets round previous/next buttons, disabled at either end.
export function Carousel({ label, prev, next, children }: { label: string; prev: string; next: string; children: React.ReactNode }) {
  const track = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [edge, setEdge] = useState({ start: true, end: false });

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    setReady(true);
    const update = () => setEdge({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth > el.scrollWidth - 8 });
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => { el.removeEventListener("scroll", update); window.removeEventListener("resize", update); };
  }, []);

  const go = (dir: number) => {
    const el = track.current;
    if (!el) return;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: smooth ? "smooth" : "auto" });
  };

  return (
    <div className="carousel">
      <div className="track" ref={track} role="region" aria-label={label} tabIndex={0}>{children}</div>
      {ready && !(edge.start && edge.end) && (
        <div className="paddles">
          <button type="button" className="paddle" aria-label={prev} disabled={edge.start} onClick={() => go(-1)}>
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3 5 8l5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <button type="button" className="paddle" aria-label={next} disabled={edge.end} onClick={() => go(1)}>
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="m6 3 5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
      )}
    </div>
  );
}
