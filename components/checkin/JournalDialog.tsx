"use client";

import { useEffect, useState } from "react";
import PixelDialog from "@/components/pixel/PixelDialog";
import PixelButton from "@/components/pixel/PixelButton";
import SparkleBurst from "@/components/pixel/SparkleBurst";
import { PixelTextarea } from "@/components/pixel/PixelField";
import { JOURNAL_CATEGORIES } from "@/lib/categories";
import type { JournalEntryDTO } from "@/lib/types";

function toDateInputValue(date: Date): string {
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 10);
}

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: (entry: JournalEntryDTO) => void;
  onDeleted?: (id: string) => void;
  editing?: JournalEntryDTO | null;
};

export default function JournalDialog({ open, onClose, onSaved, onDeleted, editing }: Props) {
  const [note, setNote] = useState("");
  const [category, setCategory] = useState<string>("✨");
  const [dateLocal, setDateLocal] = useState(() => toDateInputValue(new Date()));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [burstTrigger, setBurstTrigger] = useState(0);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!open) return;
    if (editing) {
      setNote(editing.note);
      setCategory(editing.category);
      setDateLocal(toDateInputValue(new Date(editing.date)));
    } else {
      setNote("");
      setCategory("✨");
      setDateLocal(toDateInputValue(new Date()));
    }
    setFormError(null);
  }, [open, editing]);
  /* eslint-enable react-hooks/set-state-in-effect */

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!note.trim()) {
      setFormError("Write a little something first.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        note: note.trim(),
        category,
        date: new Date(dateLocal).toISOString(),
      };

      const res = await fetch(editing ? `/api/journal/${editing.id}` : "/api/journal", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setFormError(data.error ?? "Couldn't save that entry.");
        return;
      }

      const saved: JournalEntryDTO = await res.json();
      onSaved(saved);
      setBurstTrigger((n) => n + 1);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!editing) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/journal/${editing.id}`, { method: "DELETE" });
      if (res.ok) {
        onDeleted?.(editing.id);
        onClose();
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <PixelDialog
        open={open}
        onClose={onClose}
        title={editing ? "EDIT ENTRY" : "NEW JOURNAL ENTRY"}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <PixelTextarea
            id="jr-note"
            label="What happened?"
            rows={4}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="what did you get up to?"
            required
          />

          <div className="pixel-field">
            <label>Category</label>
            <div className="chip-row">
              {Object.entries(JOURNAL_CATEGORIES).map(([emoji, label]) => (
                <button
                  type="button"
                  key={emoji}
                  onClick={() => setCategory(emoji)}
                  className={`chip ${category === emoji ? "is-active" : ""}`}
                  aria-label={label}
                  title={label}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="pixel-field">
            <label htmlFor="jr-date">Date</label>
            <input
              id="jr-date"
              type="date"
              className="pixel-input"
              value={dateLocal}
              onChange={(e) => setDateLocal(e.target.value)}
              required
            />
          </div>

          {formError ? (
            <p className="text-xs text-accent" role="alert">
              {formError}
            </p>
          ) : null}

          <div className="flex gap-2">
            <PixelButton type="submit" variant="accent" className="flex-1" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </PixelButton>
            <PixelButton type="button" className="flex-1" onClick={onClose}>
              Cancel
            </PixelButton>
          </div>
          {editing ? (
            <PixelButton type="button" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete this entry"}
            </PixelButton>
          ) : null}
        </form>
      </PixelDialog>
      <SparkleBurst trigger={burstTrigger} />
    </>
  );
}
