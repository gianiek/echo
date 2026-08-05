import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeCheckIn } from "@/lib/checkins";

export async function GET() {
  const checkIns = await prisma.checkIn.findMany({
    orderBy: { timestamp: "desc" },
  });
  return NextResponse.json(checkIns.map(serializeCheckIn));
}

export async function POST(request: Request) {
  const body = await request.json();

  const placeName = typeof body.placeName === "string" ? body.placeName.trim() : "";
  const lat = Number(body.lat);
  const lng = Number(body.lng);
  const emoji = typeof body.emoji === "string" ? body.emoji : "";

  if (!placeName || !Number.isFinite(lat) || !Number.isFinite(lng) || !emoji) {
    return NextResponse.json(
      { error: "placeName, lat, lng, and emoji are required" },
      { status: 400 }
    );
  }

  const timestamp = body.timestamp ? new Date(body.timestamp) : new Date();
  if (Number.isNaN(timestamp.getTime())) {
    return NextResponse.json({ error: "Invalid timestamp" }, { status: 400 });
  }

  const amountSpentRaw = body.amountSpent;
  const amountSpent =
    amountSpentRaw === null || amountSpentRaw === undefined || amountSpentRaw === ""
      ? null
      : Number(amountSpentRaw);
  if (amountSpent !== null && !Number.isFinite(amountSpent)) {
    return NextResponse.json({ error: "Invalid amountSpent" }, { status: 400 });
  }

  const spendCategory =
    amountSpent && amountSpent > 0 && typeof body.spendCategory === "string"
      ? body.spendCategory
      : null;

  const checkIn = await prisma.checkIn.create({
    data: {
      placeName,
      lat,
      lng,
      emoji,
      timestamp,
      amountSpent,
      spendCategory,
      isWorkout: Boolean(body.isWorkout),
      notes: typeof body.notes === "string" && body.notes.trim() ? body.notes.trim() : null,
    },
  });

  return NextResponse.json(serializeCheckIn(checkIn), { status: 201 });
}
