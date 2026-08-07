import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { googleMapsUrl } from "@/lib/maps";

export type TimelineEntry = {
  id: string;
  type: "checkin" | "movie" | "book" | "walk";
  timestamp: string;
  emoji: string;
  title: string;
  meta: string;
  googleMapsUrl?: string;
  rating?: number | null;
};

export async function GET() {
  const [checkIns, movies, books, walks] = await Promise.all([
    prisma.checkIn.findMany(),
    prisma.movie.findMany(),
    prisma.book.findMany(),
    prisma.walk.findMany(),
  ]);

  const entries: TimelineEntry[] = [
    ...checkIns.map((c): TimelineEntry => ({
      id: c.id,
      type: "checkin",
      timestamp: c.timestamp.toISOString(),
      emoji: c.emoji,
      title: c.placeName,
      meta: c.isWorkout
        ? "workout"
        : c.amountSpent != null
          ? `$${c.amountSpent.toFixed(2)}`
          : "—",
      googleMapsUrl: googleMapsUrl(c.lat, c.lng),
    })),
    ...movies.map((m): TimelineEntry => ({
      id: m.id,
      type: "movie",
      timestamp: m.watchedAt.toISOString(),
      emoji: m.emoji,
      title: m.title,
      meta: m.rating ? `${m.rating}/5` : "unrated",
      rating: m.rating,
    })),
    ...books.map((b): TimelineEntry => ({
      id: b.id,
      type: "book",
      timestamp: b.readAt.toISOString(),
      emoji: b.emoji,
      title: b.author ? `${b.title} — ${b.author}` : b.title,
      meta: b.rating ? `${b.rating}/5` : "unrated",
      rating: b.rating,
    })),
    ...walks.map((w): TimelineEntry => ({
      id: w.id,
      type: "walk",
      timestamp: w.timestamp.toISOString(),
      emoji: "🚶",
      title: `${w.startPlaceName} → ${w.endPlaceName}`,
      meta: `${(w.distanceMeters / 1609.34).toFixed(1)} mi`,
      googleMapsUrl: googleMapsUrl(w.startLat, w.startLng),
    })),
  ];

  entries.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));

  return NextResponse.json(entries);
}
