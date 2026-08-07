import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isSafeEmoji } from "@/lib/validate";

export async function GET() {
  const movies = await prisma.movie.findMany({ orderBy: { watchedAt: "desc" } });
  return NextResponse.json(movies);
}

export async function POST(request: Request) {
  const body = await request.json();

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const emoji = typeof body.emoji === "string" ? body.emoji : "";
  if (!title || !emoji) {
    return NextResponse.json({ error: "title and emoji are required" }, { status: 400 });
  }
  if (!isSafeEmoji(emoji)) {
    return NextResponse.json({ error: "Invalid emoji" }, { status: 400 });
  }

  const watchedAt = body.watchedAt ? new Date(body.watchedAt) : new Date();
  if (Number.isNaN(watchedAt.getTime())) {
    return NextResponse.json({ error: "Invalid watchedAt" }, { status: 400 });
  }

  const rating =
    body.rating === null || body.rating === undefined ? null : Number(body.rating);
  if (rating !== null && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
    return NextResponse.json({ error: "rating must be an integer 1-5, or null" }, { status: 400 });
  }

  const movie = await prisma.movie.create({
    data: {
      title,
      emoji,
      watchedAt,
      rating,
      notes: typeof body.notes === "string" && body.notes.trim() ? body.notes.trim() : null,
    },
  });

  return NextResponse.json(movie, { status: 201 });
}
