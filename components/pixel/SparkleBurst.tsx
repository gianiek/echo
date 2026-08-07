"use client";

import { useEffect, useState } from "react";

type Sparkle = {
  id: number;
  angleDeg: number;
  distance: number;
  color: string;
  delayMs: number;
};

const COLORS = ["var(--accent)", "var(--accent-2)", "var(--mint)"];
const COUNT = 10;
const LIFETIME_MS = 650;

let nextId = 0;

/**
 * A one-shot celebratory burst — not a continuous effect like CursorSparkles' trail.
 * Fire it by incrementing `trigger` (e.g. on a successful save). trigger === 0 means
 * "no burst yet," so mounting the component doesn't fire one immediately.
 */
export default function SparkleBurst({ trigger }: { trigger: number }) {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);

  // Fires a fresh batch whenever the caller bumps `trigger` (e.g. on save) — reacting to
  // an external "fire now" signal, not syncing to props/state that changed on its own,
  // so the set-state-in-effect lint nudge doesn't apply here.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (trigger === 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const batch: Sparkle[] = Array.from({ length: COUNT }, () => ({
      id: nextId++,
      angleDeg: Math.random() * 360,
      distance: 24 + Math.random() * 20,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      delayMs: Math.random() * 100,
    }));
    setSparkles(batch);

    const timeout = setTimeout(() => setSparkles([]), LIFETIME_MS + 150);
    return () => clearTimeout(timeout);
  }, [trigger]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (sparkles.length === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden"
    >
      <div className="absolute top-1/2 left-1/2">
        {sparkles.map((s) => (
          <span
            key={s.id}
            className="sparkle sparkle-burst"
            style={{
              animationDelay: `${s.delayMs}ms`,
              // @ts-expect-error -- custom properties
              "--sparkle-color": s.color,
              "--burst-x": `${Math.cos((s.angleDeg * Math.PI) / 180) * s.distance}px`,
              "--burst-y": `${Math.sin((s.angleDeg * Math.PI) / 180) * s.distance}px`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
