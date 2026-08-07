"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import PixelButton from "@/components/pixel/PixelButton";

const DAY_MS = 24 * 60 * 60 * 1000;
const PLAY_TICK_MS = 200;

type Props = {
  minTime: number;
  maxTime: number;
  value: number;
  onChange: (value: number) => void;
};

export default function TimelineSlider({ minTime, maxTime, value, onChange }: Props) {
  const [playing, setPlaying] = useState(false);

  // Self-rescheduling: each tick advances `value` by a day, which re-runs this effect
  // with the new value already in scope, so it schedules the next tick from there —
  // avoids a stale closure without needing a ref.
  useEffect(() => {
    if (!playing) return;
    const next = value + DAY_MS;
    const timeout = setTimeout(() => {
      if (next >= maxTime) {
        onChange(maxTime);
        setPlaying(false);
      } else {
        onChange(next);
      }
    }, PLAY_TICK_MS);
    return () => clearTimeout(timeout);
  }, [playing, value, maxTime, onChange]);

  if (minTime >= maxTime) return null;

  return (
    <div className="pixel-box-sm mb-3 flex items-center gap-2 p-2.5">
      <PixelButton
        type="button"
        onClick={() => {
          if (!playing && value >= maxTime) onChange(minTime);
          setPlaying((p) => !p);
        }}
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? "⏸" : "▶"}
      </PixelButton>
      <input
        type="range"
        min={minTime}
        max={maxTime}
        step={DAY_MS}
        value={value}
        onChange={(e) => {
          setPlaying(false);
          onChange(Number(e.target.value));
        }}
        className="pixel-range flex-1"
        aria-label="Timeline"
      />
      <span className="w-[74px] shrink-0 text-right text-[0.625rem] text-ink-soft">
        {value >= maxTime ? "now" : format(new Date(value), "MMM d, yyyy")}
      </span>
    </div>
  );
}
