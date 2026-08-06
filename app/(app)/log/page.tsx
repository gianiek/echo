"use client";

import { useEffect, useState } from "react";
import CheckInDialog from "@/components/checkin/CheckInDialog";
import DailyQuickLog from "@/components/checkin/DailyQuickLog";
import PixelButton from "@/components/pixel/PixelButton";
import { groupByDay, formatTime } from "@/lib/dates";
import type { CheckInDTO } from "@/lib/types";

export default function LogPage() {
  const [checkIns, setCheckIns] = useState<CheckInDTO[] | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CheckInDTO | null>(null);

  useEffect(() => {
    fetch("/api/checkins")
      .then((res) => res.json())
      .then(setCheckIns);
  }, []);

  function upsert(checkIn: CheckInDTO) {
    setCheckIns((current) => {
      if (!current) return [checkIn];
      const exists = current.some((c) => c.id === checkIn.id);
      const next = exists
        ? current.map((c) => (c.id === checkIn.id ? checkIn : c))
        : [checkIn, ...current];
      return next.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
    });
  }

  function remove(id: string) {
    setCheckIns((current) => current?.filter((c) => c.id !== id) ?? current);
  }

  const groups = checkIns ? groupByDay(checkIns) : [];

  return (
    <div>
      <DailyQuickLog />
      <div className="mb-3 flex items-center justify-between">
        <p className="section-heading text-[0.6875rem] tracking-wide text-ink-soft uppercase">
          Timeline
        </p>
        <PixelButton
          variant="accent"
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          + Check In
        </PixelButton>
      </div>

      {checkIns === null ? (
        <p className="text-xs text-ink-soft">loading…</p>
      ) : groups.length === 0 ? (
        <p className="text-xs text-ink-soft">
          Nothing logged yet — hit &quot;+ Check In&quot; to add your first stop.
        </p>
      ) : (
        groups.map((group) => (
          <div key={group.dayKey}>
            <p className="day-header">{group.label}</p>
            {group.items.map((item) => (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                className="log-row"
                onClick={() => {
                  setEditing(item);
                  setDialogOpen(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setEditing(item);
                    setDialogOpen(true);
                  }
                }}
              >
                <time>{formatTime(item.timestamp)}</time>
                <span>{item.emoji}</span>
                <span className="truncate">{item.placeName}</span>
                <span className={`amt ${item.isWorkout ? "workout" : ""}`}>
                  {item.isWorkout
                    ? "workout"
                    : item.amountSpent != null
                      ? `$${item.amountSpent.toFixed(2)}`
                      : "—"}
                </span>
                <a
                  href={item.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="maps-link"
                  onClick={(e) => e.stopPropagation()}
                >
                  ↗ Maps
                </a>
              </div>
            ))}
          </div>
        ))
      )}

      <CheckInDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={upsert}
        onDeleted={remove}
        editing={editing}
      />
    </div>
  );
}
