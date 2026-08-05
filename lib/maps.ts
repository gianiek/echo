export function googleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

const COORD_PATTERNS = [
  /@(-?\d+\.\d+),(-?\d+\.\d+)/, // .../place/Name/@lat,lng,zoom
  /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/, // ?q=lat,lng
  /[?&]query=(-?\d+\.\d+),(-?\d+\.\d+)/, // ?query=lat,lng
];

/** Parses lat/lng out of a full (non-shortened) Google Maps URL. */
export function parseGoogleMapsUrl(
  url: string
): { lat: number; lng: number } | null {
  for (const pattern of COORD_PATTERNS) {
    const match = url.match(pattern);
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return { lat, lng };
      }
    }
  }
  return null;
}

export function isGoogleMapsUrl(value: string): boolean {
  return /^https?:\/\/(www\.)?(google\.[a-z.]+\/maps|maps\.app\.goo\.gl)/i.test(
    value.trim()
  );
}

export function isShortGoogleMapsUrl(value: string): boolean {
  return /^https?:\/\/maps\.app\.goo\.gl\//i.test(value.trim());
}
