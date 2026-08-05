"use client";

import { useEffect, useState } from "react";
import { localDayISO } from "@/lib/dates";

export default function DinnerQuickLog() {
  const [type, setType] = useState<"made" | "purchased" | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/dinner?date=${encodeURIComponent(localDayISO())}`)
      .then((res) => res.json())
      .then((data) => setType(data.today?.type ?? null));
  }, []);

  async function choose(next: "made" | "purchased") {
    setSaving(true);
    setType(next);
    try {
      await fetch("/api/dinner", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: localDayISO(), type: next }),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="pixel-box-sm mb-3 p-3">
      <p className="mb-2 text-[0.625rem] tracking-wide text-ink-soft uppercase">
        Tonight's dinner
      </p>
      <div className="chip-row">
        <button
          type="button"
          onClick={() => choose("made")}
          disabled={saving}
          className={`pixel-btn ${type === "made" ? "pixel-btn--accent" : ""}`}
        >
          🍳 Made
        </button>
        <button
          type="button"
          onClick={() => choose("purchased")}
          disabled={saving}
          className={`pixel-btn ${type === "purchased" ? "pixel-btn--accent" : ""}`}
        >
          🛍️ Purchased
        </button>
      </div>
    </div>
  );
}
