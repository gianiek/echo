import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { JOURNAL_CATEGORIES } from "@/lib/categories";

export async function GET() {
  const entries = await prisma.journalEntry.findMany({ orderBy: { date: "desc" } });
  return NextResponse.json(entries);
}

export async function POST(request: Request) {
  const body = await request.json();

  const note = typeof body.note === "string" ? body.note.trim() : "";
  const category = typeof body.category === "string" ? body.category : "";
  if (!note) {
    return NextResponse.json({ error: "note is required" }, { status: 400 });
  }
  if (!Object.prototype.hasOwnProperty.call(JOURNAL_CATEGORIES, category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  const date = body.date ? new Date(body.date) : new Date();
  if (Number.isNaN(date.getTime())) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const entry = await prisma.journalEntry.create({
    data: { note, category, date },
  });

  return NextResponse.json(entry, { status: 201 });
}
