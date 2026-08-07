"use client";

import { format, startOfDay } from "date-fns";

type Point = { date: string; value: number };

type Props = {
  /** Sparse — only days that actually have a value. Missing days become gaps, not interpolation. */
  points: Point[];
  min: number;
  max: number;
  days?: number;
  /** Formats a value for the hover tooltip and the min/max axis labels (e.g. mood emoji, "7:30 AM"). */
  formatValue?: (value: number) => string;
  color?: string;
};

const WIDTH = 300;
const HEIGHT = 90;
const PAD_X = 12;
const PAD_Y = 14;

export default function PixelLineChart({
  points,
  min,
  max,
  days = 30,
  formatValue = (v) => String(v),
  color = "var(--accent)",
}: Props) {
  const today = startOfDay(new Date());
  const valueByDay = new Map(points.map((p) => [format(new Date(p.date), "yyyy-MM-dd"), p.value]));

  const dayList = Array.from({ length: days }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (days - 1 - i));
    return d;
  });

  const stepX = days > 1 ? (WIDTH - PAD_X * 2) / (days - 1) : 0;
  const scaleY = (v: number) => {
    if (max === min) return HEIGHT / 2;
    const clamped = Math.max(min, Math.min(max, v));
    return HEIGHT - PAD_Y - ((clamped - min) / (max - min)) * (HEIGHT - PAD_Y * 2);
  };

  const plotted = dayList.map((d, i) => {
    const key = format(d, "yyyy-MM-dd");
    const value = valueByDay.get(key);
    if (value === undefined) return null;
    return { x: PAD_X + i * stepX, y: scaleY(value), value, date: d };
  });

  // Consecutive non-null points become one polyline each — a gap day starts a new run,
  // which is what actually draws the visual break instead of interpolating across it.
  const runs: { x: number; y: number }[][] = [];
  let current: { x: number; y: number }[] = [];
  for (const p of plotted) {
    if (p) {
      current.push({ x: p.x, y: p.y });
    } else if (current.length) {
      runs.push(current);
      current = [];
    }
  }
  if (current.length) runs.push(current);

  const hasAnyData = plotted.some(Boolean);

  return (
    <div className="pixel-box-sm p-2">
      {hasAnyData ? (
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full"
          style={{ shapeRendering: "crispEdges" }}
        >
          <text x={2} y={PAD_Y} fontSize="8" fill="var(--ink-soft)" fontFamily="var(--font-body)">
            {formatValue(max)}
          </text>
          <text
            x={2}
            y={HEIGHT - PAD_Y + 3}
            fontSize="8"
            fill="var(--ink-soft)"
            fontFamily="var(--font-body)"
          >
            {formatValue(min)}
          </text>
          {runs.map((run, i) => (
            <polyline
              key={i}
              points={run.map((p) => `${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke={color}
              strokeWidth={2}
            />
          ))}
          {plotted.map((p, i) =>
            p ? (
              <rect key={i} x={p.x - 2} y={p.y - 2} width={4} height={4} fill={color}>
                <title>
                  {format(p.date, "MMM d")}: {formatValue(p.value)}
                </title>
              </rect>
            ) : null
          )}
        </svg>
      ) : (
        <p className="p-2 text-center text-[0.625rem] text-ink-soft">
          Nothing logged in the last {days} days yet.
        </p>
      )}
    </div>
  );
}
