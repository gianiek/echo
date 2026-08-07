"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { EmojiClickData } from "emoji-picker-react";
import PixelDialog from "@/components/pixel/PixelDialog";
import PixelButton from "@/components/pixel/PixelButton";
import { PixelInput, PixelTextarea, PixelCheckbox } from "@/components/pixel/PixelField";
import LocationField from "@/components/checkin/LocationField";
import { useLocationPicker, type Location } from "@/components/checkin/useLocationPicker";
import { PIN_EMOJI_QUICK_PICKS, SPEND_CATEGORIES } from "@/lib/categories";
import type { CheckInDTO } from "@/lib/types";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

function toDatetimeLocalValue(date: Date): string {
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: (checkIn: CheckInDTO) => void;
  onDeleted?: (id: string) => void;
  editing?: CheckInDTO | null;
  /** Pre-fill a location, e.g. from tapping the map. */
  initialLocation?: Location | null;
};

export default function CheckInDialog({
  open,
  onClose,
  onSaved,
  onDeleted,
  editing,
  initialLocation,
}: Props) {
  const {
    placeText,
    location,
    suggestions,
    searching,
    linkStatus,
    reset: resetLocation,
    setFromTap,
    handlePlaceChange,
    selectSuggestion,
  } = useLocationPicker();

  const [pinEmoji, setPinEmoji] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [timestampLocal, setTimestampLocal] = useState(() => toDatetimeLocalValue(new Date()));
  const [amountText, setAmountText] = useState("");
  const [spendCategory, setSpendCategory] = useState<string | null>(null);
  const [isWorkout, setIsWorkout] = useState(false);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Resets the whole form whenever the dialog opens for a different target (create vs.
  // edit vs. a fresh tap-to-pin location) — a controlled "reset on open" sync, not a
  // response to external data, so the set-state-in-effect lint nudge doesn't apply here.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!open) return;

    if (editing) {
      resetLocation({ placeName: editing.placeName, lat: editing.lat, lng: editing.lng });
      setPinEmoji(editing.emoji);
      setTimestampLocal(toDatetimeLocalValue(new Date(editing.timestamp)));
      setAmountText(editing.amountSpent != null ? String(editing.amountSpent) : "");
      setSpendCategory(editing.spendCategory);
      setIsWorkout(editing.isWorkout);
      setNotes(editing.notes ?? "");
    } else {
      resetLocation();
      if (initialLocation) {
        setFromTap(initialLocation);
      }
      setPinEmoji("");
      setTimestampLocal(toDatetimeLocalValue(new Date()));
      setAmountText("");
      setSpendCategory(null);
      setIsWorkout(false);
      setNotes("");
    }
    setShowEmojiPicker(false);
    setFormError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing, initialLocation]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const amount = amountText.trim() === "" ? null : Number(amountText);
  const showCategoryPicker = amount !== null && amount > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!placeText.trim() || !location || !pinEmoji) {
      setFormError("Pick a place and an emoji first.");
      return;
    }
    if (amountText.trim() !== "" && !Number.isFinite(amount)) {
      setFormError("That $ amount doesn't look right.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        placeName: placeText.trim(),
        lat: location.lat,
        lng: location.lng,
        emoji: pinEmoji,
        timestamp: new Date(timestampLocal).toISOString(),
        amountSpent: amount,
        spendCategory: showCategoryPicker ? spendCategory : null,
        isWorkout,
        notes: notes.trim() || null,
      };

      const res = await fetch(
        editing ? `/api/checkins/${editing.id}` : "/api/checkins",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setFormError(data.error ?? "Couldn't save that check-in.");
        return;
      }

      const saved: CheckInDTO = await res.json();
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
      const res = await fetch(`/api/checkins/${editing.id}`, { method: "DELETE" });
      if (res.ok) {
        onDeleted?.(editing.id);
        onClose();
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <PixelDialog open={open} onClose={onClose} title={editing ? "EDIT CHECK-IN" : "NEW CHECK-IN"}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <LocationField
          id="ci-place"
          label="Place"
          placeText={placeText}
          onPlaceChange={handlePlaceChange}
          suggestions={suggestions}
          onSelectSuggestion={selectSuggestion}
          searching={searching}
          linkStatus={linkStatus}
          located={!!location}
        />

        <div className="pixel-field">
          <label>Pin emoji</label>
          <div className="chip-row">
            {PIN_EMOJI_QUICK_PICKS.map((emoji) => (
              <button
                type="button"
                key={emoji}
                onClick={() => setPinEmoji(emoji)}
                className={`chip ${pinEmoji === emoji ? "is-active" : ""}`}
                aria-label={`Use ${emoji}`}
              >
                {emoji}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setShowEmojiPicker((v) => !v)}
              className={`chip ${pinEmoji && !PIN_EMOJI_QUICK_PICKS.includes(pinEmoji) ? "is-active" : ""}`}
              aria-label="More emoji"
            >
              {pinEmoji && !PIN_EMOJI_QUICK_PICKS.includes(pinEmoji) ? pinEmoji : "…"}
            </button>
          </div>
          {showEmojiPicker ? (
            <div className="mt-2">
              <EmojiPicker
                onEmojiClick={(data: EmojiClickData) => {
                  setPinEmoji(data.emoji);
                  setShowEmojiPicker(false);
                }}
                width="100%"
                height={300}
              />
            </div>
          ) : null}
        </div>

        <PixelInput
          id="ci-when"
          label="When"
          type="datetime-local"
          value={timestampLocal}
          onChange={(e) => setTimestampLocal(e.target.value)}
          required
        />

        <div className="pixel-field">
          <label htmlFor="ci-amount">$ spent (optional)</label>
          <input
            id="ci-amount"
            className="pixel-input"
            inputMode="decimal"
            value={amountText}
            onChange={(e) => setAmountText(e.target.value)}
            placeholder="0.00"
          />
          {showCategoryPicker ? (
            <>
              <p className="mt-1.5 text-[0.625rem] text-ink-soft">category</p>
              <div className="chip-row mt-1">
                {Object.keys(SPEND_CATEGORIES).map((emoji) => (
                  <button
                    type="button"
                    key={emoji}
                    onClick={() => setSpendCategory(emoji)}
                    className={`chip ${spendCategory === emoji ? "is-active" : ""}`}
                    aria-label={SPEND_CATEGORIES[emoji]}
                    title={SPEND_CATEGORIES[emoji]}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </>
          ) : null}
        </div>

        <PixelCheckbox
          id="ci-workout"
          label="This was a workout"
          checked={isWorkout}
          onChange={(e) => setIsWorkout(e.target.checked)}
        />

        <PixelTextarea
          id="ci-notes"
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
            {deleting ? "Deleting…" : "Delete this check-in"}
          </PixelButton>
        ) : null}
      </form>
    </PixelDialog>
  );
}
