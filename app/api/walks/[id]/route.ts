import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getWalkingRoute } from "@/lib/routing";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const body = await request.json();

  const existing = await prisma.walk.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Walk not found" }, { status: 404 });
  }

  const data: Record<string, unknown> = {};
  if (typeof body.startPlaceName === "string") data.startPlaceName = body.startPlaceName.trim();
  if (typeof body.endPlaceName === "string") data.endPlaceName = body.endPlaceName.trim();
  if (body.timestamp) data.timestamp = new Date(body.timestamp);
  if (body.notes !== undefined) {
    data.notes = typeof body.notes === "string" && body.notes.trim() ? body.notes.trim() : null;
  }

  const startLat = body.startLat !== undefined ? Number(body.startLat) : existing.startLat;
  const startLng = body.startLng !== undefined ? Number(body.startLng) : existing.startLng;
  const endLat = body.endLat !== undefined ? Number(body.endLat) : existing.endLat;
  const endLng = body.endLng !== undefined ? Number(body.endLng) : existing.endLng;
  const coordsChanged =
    startLat !== existing.startLat ||
    startLng !== existing.startLng ||
    endLat !== existing.endLat ||
    endLng !== existing.endLng;

  if (coordsChanged) {
    try {
      const walkingRoute = await getWalkingRoute({ lat: startLat, lng: startLng }, { lat: endLat, lng: endLng });
      data.startLat = startLat;
      data.startLng = startLng;
      data.endLat = endLat;
      data.endLng = endLng;
      data.route = walkingRoute.route;
      data.distanceMeters = walkingRoute.distanceMeters;
      data.durationSeconds = walkingRoute.durationSeconds;
    } catch {
      return NextResponse.json(
        { error: "Couldn't find a walking route between those two points" },
        { status: 422 }
      );
    }
  }

  const walk = await prisma.walk.update({ where: { id }, data });
  return NextResponse.json(walk);
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  try {
    await prisma.walk.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Walk not found" }, { status: 404 });
  }
}
