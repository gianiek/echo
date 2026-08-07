"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { EmojiClickData } from "emoji-picker-react";
import PixelDialog from "@/components/pixel/PixelDialog";
import PixelButton from "@/components/pixel/PixelButton";
import PixelRating from "@/components/pixel/PixelRating";
import { PixelInput, PixelTextarea } from "@/components/pixel/PixelField";
import { BOOK_EMOJI_QUICK_PICKS } from "@/lib/categories";
import type { BookDTO } from "@/lib/types";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

function toDatetimeLocalValue(date: Date): string {
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: (book: BookDTO) => void;
  onDeleted?: (id: string) => void;
  editing?: BookDTO | null;
};

export default function BookDialog({ open, onClose, onSaved, onDeleted, editing }: Props) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [emoji, setEmoji] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [readAtLocal, setReadAtLocal] = useState(() => toDatetimeLocalValue(new Date()));
  const [rating, setRating] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!open) return;
    if (editing) {
      setTitle(editing.title);
      setAuthor(editing.author ?? "");
      setEmoji(editing.emoji);
      setReadAtLocal(toDatetimeLocalValue(new Date(editing.readAt)));
      setRating(editing.rating);
      setNotes(editing.notes ?? "");
    } else {
      setTitle("");
      setAuthor("");
      setEmoji("");
      setReadAtLocal(toDatetimeLocalValue(new Date()));
      setRating(null);
      setNotes("");
    }
    setShowEmojiPicker(false);
    setFormError(null);
  }, [open, editing]);
  /* eslint-enable react-hooks/set-state-in-effect */

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!title.trim() || !emoji) {
      setFormError("Give it a title and an emoji first.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        author: author.trim() || null,
        emoji,
        readAt: new Date(readAtLocal).toISOString(),
        rating,
        notes: notes.trim() || null,
      };

      const res = await fetch(editing ? `/api/books/${editing.id}` : "/api/books", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setFormError(data.error ?? "Couldn't save that book.");
        return;
      }

      const saved: BookDTO = await res.json();
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
      const res = await fetch(`/api/books/${editing.id}`, { method: "DELETE" });
      if (res.ok) {
        onDeleted?.(editing.id);
        onClose();
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <PixelDialog open={open} onClose={onClose} title={editing ? "EDIT BOOK" : "NEW BOOK"}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <PixelInput
          id="bk-title"
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="what did you read?"
          required
        />

        <PixelInput
          id="bk-author"
          label="Author (optional)"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
        />

        <div className="pixel-field">
          <label>Emoji</label>
          <div className="chip-row">
            {BOOK_EMOJI_QUICK_PICKS.map((e) => (
              <button
                type="button"
                key={e}
                onClick={() => setEmoji(e)}
                className={`chip ${emoji === e ? "is-active" : ""}`}
                aria-label={`Use ${e}`}
              >
                {e}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setShowEmojiPicker((v) => !v)}
              className={`chip ${emoji && !BOOK_EMOJI_QUICK_PICKS.includes(emoji) ? "is-active" : ""}`}
              aria-label="More emoji"
            >
              {emoji && !BOOK_EMOJI_QUICK_PICKS.includes(emoji) ? emoji : "…"}
            </button>
          </div>
          {showEmojiPicker ? (
            <div className="mt-2">
              <EmojiPicker
                onEmojiClick={(data: EmojiClickData) => {
                  setEmoji(data.emoji);
                  setShowEmojiPicker(false);
                }}
                width="100%"
                height={300}
              />
            </div>
          ) : null}
        </div>

        <PixelInput
          id="bk-when"
          label="Read"
          type="datetime-local"
          value={readAtLocal}
          onChange={(e) => setReadAtLocal(e.target.value)}
          required
        />

        <PixelRating label="Rating (optional)" value={rating} onChange={setRating} />

        <PixelTextarea
          id="bk-notes"
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
            {deleting ? "Deleting…" : "Delete this book"}
          </PixelButton>
        ) : null}
      </form>
    </PixelDialog>
  );
}
