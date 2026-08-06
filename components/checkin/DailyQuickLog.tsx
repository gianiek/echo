"use client";

import { useEffect, useState } from "react";
import { PixelCheckbox } from "@/components/pixel/PixelField";
import { localDayISO } from "@/lib/dates";

type DinnerType = "made" | "purchased" | null;

export default function DailyQuickLog() {
  const [dinnerType, setDinnerType] = useState<DinnerType>(null);
  const [didNotLeaveHouse, setDidNotLeaveHouse] = useState(false);
  const [mood, setMood] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/daily?date=${encodeURIComponent(localDayISO())}`)
      .then((res) => res.json())
      .then((data) => {
        setDinnerType(data.today?.dinnerType ?? null);
        setDidNotLeaveHouse(data.today?.didNotLeaveHouse ?? false);
        setMood(data.today?.mood ?? null);
      });
  }, []);

  async function save(patch: Record<string, unknown>) {
    setSaving(true);
    try {
      await fetch("/api/daily", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: localDayISO(), ...patch }),
      });
    } finally {
      setSaving(false);
    }
  }

  function chooseDinner(next: DinnerType) {
    setDinnerType(next);
    save({ dinnerType: next });
  }

  function toggleHome(checked: boolean) {
    setDidNotLeaveHouse(checked);
    save({ didNotLeaveHouse: checked });
  }

  function chooseMood(level: number) {
    const next = mood === level ? null : level;
    setMood(next);
    save({ mood: next });
  }

  return (
    <div className="pixel-box-sm mb-3 flex flex-col gap-3 p-3">
      <div>
        <p className="mb-2 text-[0.625rem] tracking-wide text-ink-soft uppercase">
          Tonight&apos;s dinner
        </p>
        <div className="chip-row">
          <button
            type="button"
            onClick={() => chooseDinner("made")}
            disabled={saving}
            className={`pixel-btn ${dinnerType === "made" ? "pixel-btn--accent" : ""}`}
          >
            <span className="icon-badge">🍳</span>Made
          </button>
          <button
            type="button"
            onClick={() => chooseDinner("purchased")}
            disabled={saving}
            className={`pixel-btn ${dinnerType === "purchased" ? "pixel-btn--accent" : ""}`}
          >
            <span className="icon-badge">🛍️</span>Purchased
          </button>
        </div>
      </div>

      <PixelCheckbox
        id="didnt-leave-house"
        label="Didn't leave the house today"
        checked={didNotLeaveHouse}
        onChange={(e) => toggleHome(e.target.checked)}
      />

      <div>
        <p className="mb-2 text-[0.625rem] tracking-wide text-ink-soft uppercase">
          Mood today
        </p>
        <div className="chip-row">
          {[1, 2, 3, 4, 5].map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => chooseMood(level)}
              disabled={saving}
              className={`chip ${mood === level ? "is-active" : ""}`}
              aria-label={`Mood ${level} of 5`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
