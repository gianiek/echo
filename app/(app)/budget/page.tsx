"use client";

import { useEffect, useState } from "react";
import PixelBar from "@/components/pixel/PixelBar";
import { formatShortDate } from "@/lib/dates";
import type { CheckInDTO } from "@/lib/types";

type Category = {
  emoji: string;
  label: string;
  total: number;
  count: number;
  percent: number;
  items: CheckInDTO[];
};

type BudgetResponse = {
  total: number;
  categories: Category[];
};

const BAR_COLORS = ["var(--accent)", "var(--accent-2)"];

export default function BudgetPage() {
  const [budget, setBudget] = useState<BudgetResponse | null>(null);

  useEffect(() => {
    fetch("/api/budget").then((res) => res.json()).then(setBudget);
  }, []);

  if (!budget) {
    return <p className="text-xs text-ink-soft">loading…</p>;
  }

  if (budget.categories.length === 0) {
    return (
      <p className="text-xs text-ink-soft">
        No categorized spending yet — add a $ amount and pick a category on a check-in.
      </p>
    );
  }

  return (
    <div>
      <p className="mb-3 text-[0.6875rem] text-ink-soft">
        <b className="font-display text-sm text-ink">${budget.total.toFixed(0)}</b> spent this
        period, across {budget.categories.length} categor
        {budget.categories.length === 1 ? "y" : "ies"}
      </p>

      {budget.categories.map((cat, i) => (
        <details key={cat.emoji} className="mb-3">
          <summary className="grid cursor-pointer grid-cols-[22px_1fr_auto] items-center gap-2 py-0.5 text-xs marker:content-none [&::-webkit-details-marker]:hidden">
            <span>{cat.emoji}</span>
            <span>{cat.label}</span>
            <span className="text-ink-soft tabular-nums">${cat.total.toFixed(0)}</span>
          </summary>
          <div className="mt-1.5">
            <PixelBar variant="percent" percent={cat.percent} color={BAR_COLORS[i % 2]} />
          </div>
          <p className="mt-1 text-[0.5625rem] text-ink-soft">{cat.percent}% of total spend</p>
          <div className="mt-2 border-2 border-dashed border-ink-soft bg-panel-2 p-2 text-[0.625rem] text-ink-soft">
            {cat.items.map((item) => (
              <div key={item.id} className="flex justify-between py-0.5">
                <span>
                  {formatShortDate(item.timestamp)} · {item.placeName}
                </span>
                <span className="text-ink">${(item.amountSpent ?? 0).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}
