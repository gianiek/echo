import { NextResponse } from "next/server";
import { parseGoogleMapsUrl, isShortGoogleMapsUrl } from "@/lib/maps";

export async function POST(request: Request) {
  const body = await request.json();
  const url = typeof body.url === "string" ? body.url.trim() : "";

  if (!url) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  let resolvedUrl = url;

  if (isShortGoogleMapsUrl(url)) {
    try {
      const res = await fetch(url, { redirect: "follow" });
      resolvedUrl = res.url || url;
    } catch {
      return NextResponse.json(
        { error: "Couldn't resolve that link" },
        { status: 422 }
      );
    }
  }

  const coords = parseGoogleMapsUrl(resolvedUrl);
  if (!coords) {
    return NextResponse.json(
      { error: "Couldn't find coordinates in that link" },
      { status: 422 }
    );
  }

  const placeMatch = resolvedUrl.match(/\/maps\/place\/([^/@]+)/);
  const placeName = placeMatch
    ? decodeURIComponent(placeMatch[1].replace(/\+/g, " "))
    : null;

  return NextResponse.json({ ...coords, placeName });
}
