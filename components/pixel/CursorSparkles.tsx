"use client";

import { useEffect, useRef, useState } from "react";

type Sparkle = {
  id: number;
  x: number;
  y: number;
  color: string;
  rotation: number;
};

const COLORS = ["var(--accent)", "var(--accent-2)", "var(--mint)"];
const MAX_SPARKLES = 24;
const MIN_SPAWN_DISTANCE = 24;
const LIFETIME_MS = 700;

let nextId = 0;

export default function CursorSparkles() {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const lastSpawn = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    if (reduceMotion || !finePointer) return;

    function handlePointerMove(event: PointerEvent) {
      if (event.pointerType !== "mouse") return;

      const dx = event.clientX - lastSpawn.current.x;
      const dy = event.clientY - lastSpawn.current.y;
      if (Math.hypot(dx, dy) < MIN_SPAWN_DISTANCE) return;
      lastSpawn.current = { x: event.clientX, y: event.clientY };

      const sparkle: Sparkle = {
        id: nextId++,
        x: event.clientX,
        y: event.clientY,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rotation: Math.random() * 40 - 20,
      };

      setSparkles((current) => {
        const next = [...current, sparkle];
        return next.length > MAX_SPARKLES ? next.slice(-MAX_SPARKLES) : next;
      });

      window.setTimeout(() => {
        setSparkles((current) => current.filter((s) => s.id !== sparkle.id));
      }, LIFETIME_MS);
    }

    window.addEventListener("pointermove", handlePointerMove);
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, []);

  if (sparkles.length === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden"
    >
      {sparkles.map((s) => (
        <span
          key={s.id}
          className="sparkle"
          style={{
            left: s.x,
            top: s.y,
            // @ts-expect-error -- custom property
            "--sparkle-color": s.color,
            "--sparkle-rotate": `${s.rotation}deg`,
          }}
        />
      ))}
      <style jsx global>{`
        .sparkle {
          position: absolute;
          width: 2px;
          height: 2px;
          background: transparent;
          box-shadow:
            0 0 0 0 transparent,
            0 -4px 0 0 var(--sparkle-color),
            0 4px 0 0 var(--sparkle-color),
            -4px 0 0 0 var(--sparkle-color),
            4px 0 0 0 var(--sparkle-color),
            0 0 0 0 var(--sparkle-color);
          transform: translate(-50%, -50%) rotate(var(--sparkle-rotate))
            scale(1);
          animation: sparkle-twinkle 700ms ease-out forwards;
        }

        @keyframes sparkle-twinkle {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) rotate(var(--sparkle-rotate))
              scale(0.4);
          }
          25% {
            opacity: 1;
            transform: translate(-50%, -50%) rotate(var(--sparkle-rotate))
              scale(1.3);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, calc(-50% - 14px))
              rotate(var(--sparkle-rotate)) scale(0.6);
          }
        }
      `}</style>
    </div>
  );
}
