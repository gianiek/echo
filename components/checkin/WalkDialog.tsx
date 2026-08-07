"use client";

import { useEffect, useState } from "react";
import PixelDialog from "@/components/pixel/PixelDialog";
import PixelButton from "@/components/pixel/PixelButton";
import { PixelInput, PixelTextarea } from "@/components/pixel/PixelField";
import LocationField from "@/components/checkin/LocationField";
import { useLocationPicker } from "@/components/checkin/useLocationPicker";
import type { WalkDTO } from "@/lib/types";

function toDatetimeLocalValue(date: Date): string {
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: (walk: WalkDTO) => void;
  onDeleted?: (id: string) => void;
  editing?: WalkDTO | null;
};

export default function WalkDialog({ open, onClose, onSaved, onDeleted, editing }: Props) {
  const start = useLocationPicker();
  const end = useLocationPicker();
  const [timestampLocal, setTimestampLocal] = useState(() => toDatetimeLocalValue(new Date()));
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!open) return;
    if (editing) {
      start.reset({
        placeName: editing.startPlaceName,
        lat: editing.startLat,
        lng: editing.startLng,
      });
      end.reset({ placeName: editing.endPlaceName, lat: editing.endLat, lng: editing.endLng });
      setTimestampLocal(toDatetimeLocalValue(new Date(editing.timestamp)));
      setNotes(editing.notes ?? "");
    } else {
      start.reset();
      end.reset();
      setTimestampLocal(toDatetimeLocalValue(new Date()));
      setNotes("");
    }
    setFormError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);
  /* eslint-enable react-hooks/set-state-in-effect */

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!start.placeText.trim() || !start.location || !end.placeText.trim() || !end.location) {
      setFormError("Pick a start and an end point first.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        startPlaceName: start.placeText.trim(),
        startLat: start.location.lat,
        startLng: start.location.lng,
        endPlaceName: end.placeText.trim(),
        endLat: end.location.lat,
        endLng: end.location.lng,
        timestamp: new Date(timestampLocal).toISOString(),
        notes: notes.trim() || null,
      };

      const res = await fetch(editing ? `/api/walks/${editing.id}` : "/api/walks", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setFormError(data.error ?? "Couldn't save that walk.");
        return;
      }

      const saved: WalkDTO = await res.json();
      onSaved(saved);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!editing) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/walks/${editing.id}`, { method: "DELETE" });
      if (res.ok) {
        onDeleted?.(editing.id);
        onClose();
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <PixelDialog open={open} onClose={onClose} title={editing ? "EDIT WALK" : "NEW WALK"}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <LocationField
          id="wk-start"
          label="Start"
          placeText={start.placeText}
          onPlaceChange={start.handlePlaceChange}
          suggestions={start.suggestions}
          onSelectSuggestion={start.selectSuggestion}
          searching={start.searching}
          linkStatus={start.linkStatus}
          located={!!start.location}
        />

        <LocationField
          id="wk-end"
          label="End"
          placeText={end.placeText}
          onPlaceChange={end.handlePlaceChange}
          suggestions={end.suggestions}
          onSelectSuggestion={end.selectSuggestion}
          searching={end.searching}
          linkStatus={end.linkStatus}
          located={!!end.location}
        />

        <p className="text-[0.625rem] text-ink-soft">
          the route between them is drawn automatically when you save
        </p>

        <PixelInput
          id="wk-when"
          label="When"
          type="datetime-local"
          value={timestampLocal}
          onChange={(e) => setTimestampLocal(e.target.value)}
          required
        />

        <PixelTextarea
          id="wk-notes"
          label="Note (optional)"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="anything worth remembering..."
        />

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
            {deleting ? "Deleting…" : "Delete this walk"}
          </PixelButton>
        ) : null}
      </form>
    </PixelDialog>
  );
}
