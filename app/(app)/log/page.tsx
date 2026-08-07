"use client";

import { useEffect, useState } from "react";
import CheckInDialog from "@/components/checkin/CheckInDialog";
import MovieDialog from "@/components/checkin/MovieDialog";
import BookDialog from "@/components/checkin/BookDialog";
import WalkDialog from "@/components/checkin/WalkDialog";
import AddEntryMenu, { type EntryType } from "@/components/checkin/AddEntryMenu";
import DailyQuickLog from "@/components/checkin/DailyQuickLog";
import PixelButton from "@/components/pixel/PixelButton";
import { groupByDay, formatTime } from "@/lib/dates";
import type { CheckInDTO, MovieDTO, BookDTO, WalkDTO } from "@/lib/types";

type FeedItem =
  | { type: "checkin"; id: string; timestamp: string; data: CheckInDTO }
  | { type: "movie"; id: string; timestamp: string; data: MovieDTO }
  | { type: "book"; id: string; timestamp: string; data: BookDTO }
  | { type: "walk"; id: string; timestamp: string; data: WalkDTO };

function toFeedItems(
  checkIns: CheckInDTO[],
  movies: MovieDTO[],
  books: BookDTO[],
  walks: WalkDTO[]
): FeedItem[] {
  return [
    ...checkIns.map((c): FeedItem => ({ type: "checkin", id: c.id, timestamp: c.timestamp, data: c })),
    ...movies.map((m): FeedItem => ({ type: "movie", id: m.id, timestamp: m.watchedAt, data: m })),
    ...books.map((b): FeedItem => ({ type: "book", id: b.id, timestamp: b.readAt, data: b })),
    ...walks.map((w): FeedItem => ({ type: "walk", id: w.id, timestamp: w.timestamp, data: w })),
  ];
}

export default function LogPage() {
  const [checkIns, setCheckIns] = useState<CheckInDTO[] | null>(null);
  const [movies, setMovies] = useState<MovieDTO[]>([]);
  const [books, setBooks] = useState<BookDTO[]>([]);
  const [walks, setWalks] = useState<WalkDTO[]>([]);

  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [checkInDialogOpen, setCheckInDialogOpen] = useState(false);
  const [movieDialogOpen, setMovieDialogOpen] = useState(false);
  const [bookDialogOpen, setBookDialogOpen] = useState(false);
  const [walkDialogOpen, setWalkDialogOpen] = useState(false);
  const [editingCheckIn, setEditingCheckIn] = useState<CheckInDTO | null>(null);
  const [editingMovie, setEditingMovie] = useState<MovieDTO | null>(null);
  const [editingBook, setEditingBook] = useState<BookDTO | null>(null);
  const [editingWalk, setEditingWalk] = useState<WalkDTO | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/checkins").then((res) => res.json()),
      fetch("/api/movies").then((res) => res.json()),
      fetch("/api/books").then((res) => res.json()),
      fetch("/api/walks").then((res) => res.json()),
    ]).then(([c, m, b, w]) => {
      setCheckIns(c);
      setMovies(m);
      setBooks(b);
      setWalks(w);
    });
  }, []);

  function openNew(type: EntryType) {
    setAddMenuOpen(false);
    if (type === "checkin") {
      setEditingCheckIn(null);
      setCheckInDialogOpen(true);
    } else if (type === "movie") {
      setEditingMovie(null);
      setMovieDialogOpen(true);
    } else if (type === "book") {
      setEditingBook(null);
      setBookDialogOpen(true);
    } else if (type === "walk") {
      setEditingWalk(null);
      setWalkDialogOpen(true);
    }
  }

  function openRow(item: FeedItem) {
    if (item.type === "checkin") {
      setEditingCheckIn(item.data);
      setCheckInDialogOpen(true);
    } else if (item.type === "movie") {
      setEditingMovie(item.data);
      setMovieDialogOpen(true);
    } else if (item.type === "book") {
      setEditingBook(item.data);
      setBookDialogOpen(true);
    } else if (item.type === "walk") {
      setEditingWalk(item.data);
      setWalkDialogOpen(true);
    }
  }

  const feed = checkIns === null ? null : toFeedItems(checkIns, movies, books, walks);
  const groups = feed ? groupByDay(feed) : [];

  return (
    <div>
      <DailyQuickLog />
      <div className="mb-3 flex items-center justify-between">
        <p className="section-heading text-[0.6875rem] tracking-wide text-ink-soft uppercase">
          Timeline
        </p>
        <PixelButton variant="accent" onClick={() => setAddMenuOpen(true)}>
          + Log
        </PixelButton>
      </div>

      {feed === null ? (
        <p className="text-xs text-ink-soft">loading…</p>
      ) : groups.length === 0 ? (
        <p className="text-xs text-ink-soft">
          Nothing logged yet — hit &quot;+ Log&quot; to add your first thing.
        </p>
      ) : (
        groups.map((group) => (
          <div key={group.dayKey}>
            <p className="day-header">{group.label}</p>
            {group.items.map((item) => {
              const emoji = item.type === "walk" ? "🚶" : item.data.emoji;
              const title =
                item.type === "checkin"
                  ? item.data.placeName
                  : item.type === "movie"
                    ? item.data.title
                    : item.type === "book"
                      ? item.data.author
                        ? `${item.data.title} — ${item.data.author}`
                        : item.data.title
                      : `${item.data.startPlaceName} → ${item.data.endPlaceName}`;
              const meta =
                item.type === "checkin"
                  ? item.data.isWorkout
                    ? "workout"
                    : item.data.amountSpent != null
                      ? `$${item.data.amountSpent.toFixed(2)}`
                      : "—"
                  : item.type === "walk"
                    ? `${(item.data.distanceMeters / 1609.34).toFixed(1)} mi`
                    : item.data.rating
                      ? `${item.data.rating}/5`
                      : "unrated";
              const mapsUrl =
                item.type === "checkin"
                  ? item.data.googleMapsUrl
                  : item.type === "walk"
                    ? `https://www.google.com/maps/search/?api=1&query=${item.data.startLat},${item.data.startLng}`
                    : null;

              return (
                <div
                  key={`${item.type}-${item.id}`}
                  role="button"
                  tabIndex={0}
                  className="log-row"
                  onClick={() => openRow(item)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") openRow(item);
                  }}
                >
                  <time>{formatTime(item.timestamp)}</time>
                  <span>{emoji}</span>
                  <span className="truncate">{title}</span>
                  <span className={`amt ${item.type === "checkin" && item.data.isWorkout ? "workout" : ""}`}>
                    {meta}
                  </span>
                  {mapsUrl ? (
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="maps-link"
                      onClick={(e) => e.stopPropagation()}
                    >
                      ↗ Maps
                    </a>
                  ) : (
                    <span />
                  )}
                </div>
              );
            })}
          </div>
        ))
      )}

      <AddEntryMenu open={addMenuOpen} onClose={() => setAddMenuOpen(false)} onPick={openNew} />

      <CheckInDialog
        open={checkInDialogOpen}
        onClose={() => setCheckInDialogOpen(false)}
        onSaved={(c) =>
          setCheckIns((current) => {
            if (!current) return [c];
            const exists = current.some((x) => x.id === c.id);
            return exists ? current.map((x) => (x.id === c.id ? c : x)) : [c, ...current];
          })
        }
        onDeleted={(id) => setCheckIns((current) => current?.filter((x) => x.id !== id) ?? current)}
        editing={editingCheckIn}
      />

      <MovieDialog
        open={movieDialogOpen}
        onClose={() => setMovieDialogOpen(false)}
        onSaved={(m) =>
          setMovies((current) => {
            const exists = current.some((x) => x.id === m.id);
            return exists ? current.map((x) => (x.id === m.id ? m : x)) : [m, ...current];
          })
        }
        onDeleted={(id) => setMovies((current) => current.filter((x) => x.id !== id))}
        editing={editingMovie}
      />

      <BookDialog
        open={bookDialogOpen}
        onClose={() => setBookDialogOpen(false)}
        onSaved={(b) =>
          setBooks((current) => {
            const exists = current.some((x) => x.id === b.id);
            return exists ? current.map((x) => (x.id === b.id ? b : x)) : [b, ...current];
          })
        }
        onDeleted={(id) => setBooks((current) => current.filter((x) => x.id !== id))}
        editing={editingBook}
      />

      <WalkDialog
        open={walkDialogOpen}
        onClose={() => setWalkDialogOpen(false)}
        onSaved={(w) =>
          setWalks((current) => {
            const exists = current.some((x) => x.id === w.id);
            return exists ? current.map((x) => (x.id === w.id ? w : x)) : [w, ...current];
          })
        }
        onDeleted={(id) => setWalks((current) => current.filter((x) => x.id !== id))}
        editing={editingWalk}
      />
    </div>
  );
}
