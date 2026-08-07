import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const books = await prisma.book.findMany({ orderBy: { readAt: "desc" } });
  return NextResponse.json(books);
}

export async function POST(request: Request) {
  const body = await request.json();

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const emoji = typeof body.emoji === "string" ? body.emoji : "";
  if (!title || !emoji) {
    return NextResponse.json({ error: "title and emoji are required" }, { status: 400 });
  }

  const readAt = body.readAt ? new Date(body.readAt) : new Date();
  if (Number.isNaN(readAt.getTime())) {
    return NextResponse.json({ error: "Invalid readAt" }, { status: 400 });
  }

  const rating =
    body.rating === null || body.rating === undefined ? null : Number(body.rating);
  if (rating !== null && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
    return NextResponse.json({ error: "rating must be an integer 1-5, or null" }, { status: 400 });
  }

  const book = await prisma.book.create({
    data: {
      title,
      author: typeof body.author === "string" && body.author.trim() ? body.author.trim() : null,
      emoji,
      readAt,
      rating,
      notes: typeof body.notes === "string" && body.notes.trim() ? body.notes.trim() : null,
    },
  });

  return NextResponse.json(book, { status: 201 });
}
