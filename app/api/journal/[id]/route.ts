import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { JOURNAL_CATEGORIES } from "@/lib/categories";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const body = await request.json();

  const data: Record<string, unknown> = {};
  if (typeof body.note === "string") data.note = body.note.trim();
  if (body.category !== undefined) {
    if (!Object.prototype.hasOwnProperty.call(JOURNAL_CATEGORIES, body.category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }
    data.category = body.category;
  }
  if (body.date) data.date = new Date(body.date);

  try {
    const entry = await prisma.journalEntry.update({ where: { id }, data });
    return NextResponse.json(entry);
  } catch {
    return NextResponse.json({ error: "Journal entry not found" }, { status: 404 });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  try {
    await prisma.journalEntry.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Journal entry not found" }, { status: 404 });
  }
}
