import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeCheckIn } from "@/lib/checkins";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const body = await request.json();

  const data: Record<string, unknown> = {};

  if (typeof body.placeName === "string") data.placeName = body.placeName.trim();
  if (body.lat !== undefined) data.lat = Number(body.lat);
  if (body.lng !== undefined) data.lng = Number(body.lng);
  if (typeof body.emoji === "string") data.emoji = body.emoji;
  if (body.timestamp) data.timestamp = new Date(body.timestamp);
  if (body.isWorkout !== undefined) data.isWorkout = Boolean(body.isWorkout);
  if (body.notes !== undefined) {
    data.notes = typeof body.notes === "string" && body.notes.trim() ? body.notes.trim() : null;
  }

  if (body.amountSpent !== undefined) {
    const amountSpent =
      body.amountSpent === null || body.amountSpent === ""
        ? null
        : Number(body.amountSpent);
    if (amountSpent !== null && !Number.isFinite(amountSpent)) {
      return NextResponse.json({ error: "Invalid amountSpent" }, { status: 400 });
    }
    data.amountSpent = amountSpent;
    data.spendCategory =
      amountSpent && amountSpent > 0 && typeof body.spendCategory === "string"
        ? body.spendCategory
        : null;
  } else if (body.spendCategory !== undefined) {
    data.spendCategory = typeof body.spendCategory === "string" ? body.spendCategory : null;
  }

  try {
    const checkIn = await prisma.checkIn.update({ where: { id }, data });
    return NextResponse.json(serializeCheckIn(checkIn));
  } catch {
    return NextResponse.json({ error: "Check-in not found" }, { status: 404 });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  try {
    await prisma.checkIn.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Check-in not found" }, { status: 404 });
  }
}
