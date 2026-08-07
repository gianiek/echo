"use client";

import { useEffect, useRef } from "react";
import { format, isSameDay, startOfDay } from "date-fns";

type DayCell = { date: Date; count: number; isFuture: boolean };

const WEEK_COUNT = 53;

function dayKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

function buildWeeks(dates: string[]): DayCell[][] {
  const countsByDay = new Map<string, number>();
  for (const iso of dates) {
    const key = dayKey(new Date(iso));
    countsByDay.set(key, (countsByDay.get(key) ?? 0) + 1);
  }

  const today = startOfDay(new Date());
  const currentWeekStart = new Date(today);
  currentWeekStart.setDate(currentWeekStart.getDate() - today.getDay());
  const gridStart = new Date(currentWeekStart);
  gridStart.setDate(gridStart.getDate() - (WEEK_COUNT - 1) * 7);

  const weeks: DayCell[][] = [];
  for (let w = 0; w < WEEK_COUNT; w++) {
    const week: DayCell[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(gridStart);
      date.setDate(date.getDate() + w * 7 + d);
      week.push({
        date,
        count: countsByDay.get(dayKey(date)) ?? 0,
        isFuture: date > today,
      });
    }
    weeks.push(week);
  }
  return weeks;
}

function tier(count: number): 0 | 1 | 2 | 3 {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  return 3;
}

function monthLabel(weeks: DayCell[][], weekIndex: number): string {
  const thisMonth = weeks[weekIndex][0].date.getMonth();
  if (weekIndex === 0) return format(weeks[0][0].date, "MMM");
  const prevMonth = weeks[weekIndex - 1][0].date.getMonth();
  return thisMonth !== prevMonth ? format(weeks[weekIndex][0].date, "MMM") : "";
}

type Props = {
  /** ISO date strings — one entry per occurrence, duplicates on the same day stack the tier. */
  dates: string[];
  /** Singular/plural noun for the hover tooltip, e.g. "entry"/"entries" or "movie"/"movies". */
  unitLabel?: string;
  unitLabelPlural?: string;
};

export default function ActivityHeatmap({
  dates,
  unitLabel = "entry",
  unitLabelPlural = "entries",
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const weeks = buildWeeks(dates);
  const today = new Date();

  // Show the current week by default — scrolling to the oldest data first would bury
  // "today," the part someone opening the page actually wants to see.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, []);

  return (
    <div className="pixel-box-sm overflow-x-auto p-2" ref={scrollRef}>
      <div className="inline-flex flex-col gap-1">
        <div className="flex gap-[2px]">
          {weeks.map((week, i) => (
            <div key={i} className="w-[10px] shrink-0 text-[0.5rem] text-ink-soft">
              {monthLabel(weeks, i)}
            </div>
          ))}
        </div>
        <div className="flex gap-[2px]">
          {weeks.map((week, i) => (
            <div key={i} className="flex shrink-0 flex-col gap-[2px]">
              {week.map((cell, j) => {
                const todayActive = cell.count > 0 && isSameDay(cell.date, today);
                return (
                  <div
                    key={j}
                    className={[
                      "heatmap-cell",
                      `heatmap-cell--${tier(cell.count)}`,
                      cell.isFuture ? "heatmap-cell--future" : "",
                      todayActive ? "heatmap-cell--today-active" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    title={
                      cell.isFuture
                        ? undefined
                        : `${format(cell.date, "MMM d, yyyy")}: ${cell.count} ${cell.count === 1 ? unitLabel : unitLabelPlural}`
                    }
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 flex items-center gap-1.5 text-[0.5625rem] text-ink-soft">
        <span>Less</span>
        <span className="heatmap-cell heatmap-cell--0" />
        <span className="heatmap-cell heatmap-cell--1" />
        <span className="heatmap-cell heatmap-cell--2" />
        <span className="heatmap-cell heatmap-cell--3" />
        <span>More</span>
      </div>
    </div>
  );
}
