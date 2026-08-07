"use client";

import { useEffect, useState } from "react";
import JournalDialog from "@/components/checkin/JournalDialog";
import JournalHeatmap from "@/components/journal/JournalHeatmap";
import PixelButton from "@/components/pixel/PixelButton";
import { groupByDay, formatShortDate } from "@/lib/dates";
import { computeJournalStreak } from "@/lib/journal";
import { JOURNAL_CATEGORIES } from "@/lib/categories";
import type { JournalEntryDTO } from "@/lib/types";

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntryDTO[] | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<JournalEntryDTO | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/journal")
      .then((res) => res.json())
      .then(setEntries);
  }, []);

  function upsert(entry: JournalEntryDTO) {
    setEntries((current) => {
      if (!current) return [entry];
      const exists = current.some((e) => e.id === entry.id);
      return exists ? current.map((e) => (e.id === entry.id ? entry : e)) : [entry, ...current];
    });
  }

  function remove(id: string) {
    setEntries((current) => current?.filter((e) => e.id !== id) ?? current);
  }

  const { streak, totalDays } = computeJournalStreak(entries ?? []);
  const filtered = activeFilter
    ? (entries ?? []).filter((e) => e.category === activeFilter)
    : (entries ?? []);
  const groups = entries ? groupByDay(filtered.map((e) => ({ ...e, timestamp: e.date }))) : [];

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div>
          {totalDays > 0 ? (
            <span className="inline-flex items-center gap-1 border-2 border-mint bg-mint-bg px-1.5 py-0.5 text-[0.625rem] font-bold text-mint">
              🔥 {streak}-day streak
            </span>
          ) : (
            <p className="text-[0.6875rem] text-ink-soft">no entries yet</p>
          )}
          {totalDays > 0 ? (
            <p className="mt-1 text-[0.5625rem] text-ink-soft">{totalDays} days journaled</p>
          ) : null}
        </div>
        <PixelButton
          variant="accent"
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          + Journal
        </PixelButton>
      </div>

      {entries === null ? (
        <p className="text-xs text-ink-soft">loading…</p>
      ) : (
        <>
          <JournalHeatmap entries={entries} />

          <div className="chip-row my-3">
            {Object.entries(JOURNAL_CATEGORIES).map(([emoji, label]) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setActiveFilter((current) => (current === emoji ? null : emoji))}
                className={`chip ${activeFilter === emoji ? "is-active" : ""}`}
                aria-label={`Filter: ${label}`}
                title={label}
              >
                {emoji}
              </button>
            ))}
          </div>

          {groups.length === 0 ? (
            <p className="text-xs text-ink-soft">
              {activeFilter
                ? "Nothing in that category yet."
                : 'Nothing logged yet — hit "+ Journal" to write your first entry.'}
            </p>
          ) : (
            groups.map((group) => (
              <div key={group.dayKey}>
                <p className="day-header">{group.label}</p>
                {group.items.map((entry) => (
                  <div
                    key={entry.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setEditing(entry);
                      setDialogOpen(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        setEditing(entry);
                        setDialogOpen(true);
                      }
                    }}
                    className="flex cursor-pointer items-start gap-2 border-b-2 border-dashed border-panel-2 py-2"
                  >
                    <span className="icon-badge">{entry.category}</span>
                    <p className="flex-1 text-[0.6875rem] leading-snug">{entry.note}</p>
                    <time className="shrink-0 text-[0.5625rem] text-ink-soft">
                      {formatShortDate(entry.date)}
                    </time>
                  </div>
                ))}
              </div>
            ))
          )}
        </>
      )}

      <JournalDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={upsert}
        onDeleted={remove}
        editing={editing}
      />
    </div>
  );
}
