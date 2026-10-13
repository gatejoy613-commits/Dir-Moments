"use client";

import { useEffect, useRef, useState } from "react";

export type Slide = { src: string; srcSet?: string; alt: string; title?: string; text?: string; href?: string; cta?: string };
type Labels = { prev: string; next: string; pause: string; play: string; goTo: string; of: string };

/**
 * Crossfading slides with a slow zoom on each photo. The active dot stretches
 * into a bar that fills over the slide's time; when it fills, the next slide
 * comes in, so pausing the bar (button, keyboard focus inside, or reduced
 * motion) pauses the show. Without JavaScript the first slide shows on its own.
 */
export function Slideshow({ slides, labels, interval = 6000, variant = "hero", label }: {
  slides: Slide[]; labels: Labels; interval?: number; variant?: "hero" | "photos"; label: string;
}) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [ready, setReady] = useState(false);
  const touch = useRef<number | null>(null);
  const n = slides.length;

  useEffect(() => {
    setReady(true);
    // Anyone who has asked for less motion gets a still show they move themselves.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setPlaying(false);
  }, []);

  const go = (i: number) => setIndex(((i % n) + n) % n);

  if (n === 0) return null;
  return (
    <section
      className={`slideshow ${variant}${ready ? " ready" : ""}${playing ? "" : " paused"}`}
      aria-roledescription="carousel" aria-label={label}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(index + 1);
        if (e.key === "ArrowLeft") go(index - 1);
      }}
      onTouchStart={(e) => { touch.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touch.current == null) return;
        const dx = e.changedTouches[0].clientX - touch.current;
        touch.current = null;
        if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
      }}
    >
      <div className="slides" aria-live={playing ? "off" : "polite"}>
        {slides.map((s, i) => {
          const on = i === index;
          return (
            <div key={s.src + i} className={`slide${on ? " on" : ""}${i % 2 ? " alt" : ""}`}
              role="group" aria-roledescription="slide" aria-label={`${i + 1} ${labels.of} ${n}`}
              aria-hidden={!on} inert={!on}>
              <img src={s.src} srcSet={s.srcSet} sizes="100vw" alt={s.alt}
                loading={i === 0 ? "eager" : "lazy"} decoding="async" fetchPriority={i === 0 ? "high" : "low"} />
              {(s.title || s.text) && (
                <div className="cap">
                  {s.title && <p className="cap-title">{s.title}</p>}
                  {s.text && <p className="cap-text">{s.text}</p>}
                  {s.href && s.cta && <a className="btn primary" href={s.href}>{s.cta}</a>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {n > 1 && ready && (
        <>
          <button type="button" className="ss-arrow prev" aria-label={labels.prev} onClick={() => go(index - 1)}>
            <svg width="18" height="18" viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3 5 8l5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <button type="button" className="ss-arrow next" aria-label={labels.next} onClick={() => go(index + 1)}>
            <svg width="18" height="18" viewBox="0 0 16 16" aria-hidden="true"><path d="m6 3 5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <div className="ss-controls">
            <div className="dots">
              {slides.map((s, i) => (
                <button key={i} type="button" className={`dot${i === index ? " on" : ""}`}
                  aria-label={`${labels.goTo} ${i + 1}${s.title ? `: ${s.title}` : ""}`} aria-current={i === index ? "true" : undefined}
                  onClick={() => go(i)}>
                  <span className="pip">
                    {/* The fill's animationend is the timer: it advances the show. */}
                    {i === index && <span className="fill" style={{ animationDuration: `${interval}ms` }} onAnimationEnd={() => go(index + 1)} />}
                  </span>
                </button>
              ))}
            </div>
            <button type="button" className="ss-play" aria-label={playing ? labels.pause : labels.play} onClick={() => setPlaying(!playing)}>
              {playing
                ? <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><rect x="3" y="2" width="3" height="10" rx="1" fill="currentColor" /><rect x="8" y="2" width="3" height="10" rx="1" fill="currentColor" /></svg>
                : <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M4 2.5v9a.5.5 0 0 0 .77.42l7-4.5a.5.5 0 0 0 0-.84l-7-4.5A.5.5 0 0 0 4 2.5z" fill="currentColor" /></svg>}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
