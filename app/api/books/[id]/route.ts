import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const body = await request.json();

  const data: Record<string, unknown> = {};
  if (typeof body.title === "string") data.title = body.title.trim();
  if (body.author !== undefined) {
    data.author = typeof body.author === "string" && body.author.trim() ? body.author.trim() : null;
  }
  if (typeof body.emoji === "string") data.emoji = body.emoji;
  if (body.readAt) data.readAt = new Date(body.readAt);
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
    const book = await prisma.book.update({ where: { id }, data });
    return NextResponse.json(book);
  } catch {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  try {
    await prisma.book.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }
}
