import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getWalkingRoute } from "@/lib/routing";

export async function GET() {
  const walks = await prisma.walk.findMany({ orderBy: { timestamp: "desc" } });
  return NextResponse.json(walks);
}

export async function POST(request: Request) {
  const body = await request.json();

  const startPlaceName = typeof body.startPlaceName === "string" ? body.startPlaceName.trim() : "";
  const endPlaceName = typeof body.endPlaceName === "string" ? body.endPlaceName.trim() : "";
  const startLat = Number(body.startLat);
  const startLng = Number(body.startLng);
  const endLat = Number(body.endLat);
  const endLng = Number(body.endLng);

  if (
    !startPlaceName ||
    !endPlaceName ||
    ![startLat, startLng, endLat, endLng].every(Number.isFinite)
  ) {
    return NextResponse.json(
      { error: "startPlaceName, endPlaceName, and both sets of coordinates are required" },
      { status: 400 }
    );
  }

  const timestamp = body.timestamp ? new Date(body.timestamp) : new Date();
  if (Number.isNaN(timestamp.getTime())) {
    return NextResponse.json({ error: "Invalid timestamp" }, { status: 400 });
  }

  let walkingRoute;
  try {
    walkingRoute = await getWalkingRoute(
      { lat: startLat, lng: startLng },
      { lat: endLat, lng: endLng }
    );
  } catch {
    return NextResponse.json(
      { error: "Couldn't find a walking route between those two points" },
      { status: 422 }
    );
  }

  const walk = await prisma.walk.create({
    data: {
      startPlaceName,
      startLat,
      startLng,
      endPlaceName,
      endLat,
      endLng,
      route: walkingRoute.route,
      distanceMeters: walkingRoute.distanceMeters,
      durationSeconds: walkingRoute.durationSeconds,
      timestamp,
      notes: typeof body.notes === "string" && body.notes.trim() ? body.notes.trim() : null,
    },
  });

  return NextResponse.json(walk, { status: 201 });
}
