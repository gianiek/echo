import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isSafeEmoji } from "@/lib/validate";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const body = await request.json();

  const data: Record<string, unknown> = {};
  if (typeof body.title === "string") data.title = body.title.trim();
  if (body.emoji !== undefined) {
    if (typeof body.emoji !== "string" || !isSafeEmoji(body.emoji)) {
      return NextResponse.json({ error: "Invalid emoji" }, { status: 400 });
    }
    data.emoji = body.emoji;
  }
  if (body.watchedAt) data.watchedAt = new Date(body.watchedAt);
  if (body.notes !== undefined) {
    data.notes = typeof body.notes === "string" && body.notes.trim() ? body.notes.trim() : null;
  }
  if (body.rating !== undefined) {
    const rating = body.rating === null ? null : Number(body.rating);
    if (rating !== null && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
      return NextResponse.json({ error: "rating must be an integer 1-5, or null" }, { status: 400 });
    }
    data.rating = rating;
  }

  try {
    const movie = await prisma.movie.update({ where: { id }, data });
    return NextResponse.json(movie);
  } catch {
    return NextResponse.json({ error: "Movie not found" }, { status: 404 });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  try {
    await prisma.movie.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Movie not found" }, { status: 404 });
  }
}
