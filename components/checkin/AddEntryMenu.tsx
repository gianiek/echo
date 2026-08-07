"use client";

import PixelDialog from "@/components/pixel/PixelDialog";

export type EntryType = "checkin" | "movie" | "book" | "walk";

const OPTIONS: { type: EntryType; emoji: string; label: string }[] = [
  { type: "checkin", emoji: "📍", label: "Check-in" },
  { type: "movie", emoji: "🎬", label: "Movie" },
  { type: "book", emoji: "📖", label: "Book" },
  { type: "walk", emoji: "🚶", label: "Walk" },
];

export default function AddEntryMenu({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (type: EntryType) => void;
}) {
  return (
    <PixelDialog open={open} onClose={onClose} title="LOG SOMETHING">
      <div className="grid grid-cols-2 gap-2">
        {OPTIONS.map((opt) => (
          <button
            key={opt.type}
            type="button"
            onClick={() => onPick(opt.type)}
            className="pixel-btn flex flex-col items-center gap-2 py-4 text-sm"
          >
            <span className="icon-badge text-base">{opt.emoji}</span>
            {opt.label}
          </button>
        ))}
      </div>
    </PixelDialog>
  );
}
