export type WalkingRoute = {
  route: [number, number][]; // [lat, lng] pairs, ready for Leaflet
  distanceMeters: number;
  durationSeconds: number;
};

/** Calls OpenRouteService server-side (the API key must never reach the client). */
export async function getWalkingRoute(
  start: { lat: number; lng: number },
  end: { lat: number; lng: number }
): Promise<WalkingRoute> {
  const apiKey = process.env.ORS_API_KEY;
  if (!apiKey) {
    throw new Error("ORS_API_KEY is not configured");
  }

  const res = await fetch("https://api.openrouteservice.org/v2/directions/foot-walking/geojson", {
    method: "POST",
    headers: {
      Authorization: apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      coordinates: [
        [start.lng, start.lat],
        [end.lng, end.lat],
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenRouteService request failed: ${res.status}`);
  }

  const data = await res.json();
  const feature = data.features?.[0];
  if (!feature) {
    throw new Error("No walking route found between those two points");
  }

  return {
    route: feature.geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng]),
    distanceMeters: feature.properties.summary.distance,
    durationSeconds: feature.properties.summary.duration,
  };
}
