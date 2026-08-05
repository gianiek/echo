"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import PixelBar from "@/components/pixel/PixelBar";

type StatsResponse = {
  totalSpent: number;
  placesVisited: number;
  workoutsDone: number;
  noSpendDays: { total: number; streak: number };
  bars: { segments: number; spent: number; places: number; workouts: number; noSpend: number };
};

type DinnerResponse = {
  counts: { made: number; purchased: number };
  percentages: { made: number; purchased: number };
  total: number;
};

export default function StatsPage() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [dinner, setDinner] = useState<DinnerResponse | null>(null);

  useEffect(() => {
    fetch("/api/stats").then((res) => res.json()).then(setStats);
    fetch("/api/dinner").then((res) => res.json()).then(setDinner);
  }, []);

  if (!stats) {
    return <p className="text-xs text-ink-soft">loading…</p>;
  }

  return (
    <div>
      <p className="mb-3 text-[0.6875rem] tracking-wide text-ink-soft uppercase">
        Your stats
      </p>

      <div className="grid grid-cols-2 gap-2.5">
        <Link href="/budget" className="pixel-box-sm relative block p-3">
          <span className="absolute top-2 right-2.5 text-accent" aria-hidden="true">
            ›
          </span>
          <div className="font-display text-lg">${stats.totalSpent.toFixed(0)}</div>
          <div className="mt-1.5 mb-2 text-[0.5625rem] tracking-wide text-ink-soft uppercase">
            $ Spent
          </div>
          <PixelBar variant="segments" segments={stats.bars.segments} filled={stats.bars.spent} />
          <p className="mt-1.5 text-[0.625rem] text-ink-soft">tap for breakdown</p>
        </Link>

        <div className="pixel-box-sm p-3">
          <div className="font-display text-lg">{stats.placesVisited}</div>
          <div className="mt-1.5 mb-2 text-[0.5625rem] tracking-wide text-ink-soft uppercase">
            Places Visited
          </div>
          <PixelBar
            variant="segments"
            segments={stats.bars.segments}
            filled={stats.bars.places}
            color="var(--accent-2)"
          />
        </div>

        <div className="pixel-box-sm p-3">
          <div className="font-display text-lg">{stats.workoutsDone}</div>
          <div className="mt-1.5 mb-2 text-[0.5625rem] tracking-wide text-ink-soft uppercase">
            Workouts Done
          </div>
          <PixelBar
            variant="segments"
            segments={stats.bars.segments}
            filled={stats.bars.workouts}
            color="var(--accent-2)"
          />
        </div>

        <div className="pixel-box-sm p-3">
          <div className="font-display text-lg">{stats.noSpendDays.total}</div>
          <div className="mt-1.5 mb-2 text-[0.5625rem] tracking-wide text-ink-soft uppercase">
            No-Spend Days
          </div>
          {stats.noSpendDays.streak > 0 ? (
            <span className="mb-2 inline-flex items-center gap-1 border-2 border-mint bg-mint-bg px-1.5 py-0.5 text-[0.625rem] font-bold text-mint">
              🔥 {stats.noSpendDays.streak}-day streak
            </span>
          ) : null}
          <PixelBar
            variant="segments"
            segments={stats.bars.segments}
            filled={stats.bars.noSpend}
            color="var(--mint)"
          />
        </div>
      </div>

      <p className="mt-5 mb-2 text-[0.6875rem] tracking-wide text-ink-soft uppercase">
        Dinner
      </p>
      {dinner && dinner.total > 0 ? (
        <div className="pixel-box-sm flex flex-col gap-3 p-3">
          <div>
            <div className="mb-1 flex items-center justify-between text-[0.6875rem]">
              <span>🍳 Made</span>
              <span className="text-ink-soft">
                {dinner.percentages.made}% ({dinner.counts.made})
              </span>
            </div>
            <PixelBar variant="percent" percent={dinner.percentages.made} color="var(--accent)" />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between text-[0.6875rem]">
              <span>🛍️ Purchased</span>
              <span className="text-ink-soft">
                {dinner.percentages.purchased}% ({dinner.counts.purchased})
              </span>
            </div>
            <PixelBar
              variant="percent"
              percent={dinner.percentages.purchased}
              color="var(--accent-2)"
            />
          </div>
        </div>
      ) : (
        <p className="text-xs text-ink-soft">
          No dinners logged yet — set tonight&apos;s on the Log tab.
        </p>
      )}
    </div>
  );
}
