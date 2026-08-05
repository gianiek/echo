import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const settings = await prisma.settings.findUnique({ where: { id: 1 } });
  return NextResponse.json({ trackerName: settings?.trackerName ?? "" });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const trackerName =
    typeof body.trackerName === "string" ? body.trackerName.trim() : "";

  const settings = await prisma.settings.upsert({
    where: { id: 1 },
    update: { trackerName },
    create: { id: 1, trackerName },
  });

  return NextResponse.json({ trackerName: settings.trackerName });
}
