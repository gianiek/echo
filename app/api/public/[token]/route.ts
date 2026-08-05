import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializePublicCheckIn } from "@/lib/checkins";

type RouteContext = { params: Promise<{ token: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const { token } = await params;

  const settings = await prisma.settings.findUnique({ where: { shareToken: token } });
  if (!settings) {
    return NextResponse.json({ error: "Invalid share link" }, { status: 404 });
  }

  const checkIns = await prisma.checkIn.findMany({ orderBy: { timestamp: "desc" } });

  return NextResponse.json({
    trackerName: settings.trackerName,
    checkIns: checkIns.map(serializePublicCheckIn),
  });
}
