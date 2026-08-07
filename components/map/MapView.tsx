"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { startOfDay } from "date-fns";
import { formatShortDate, formatTime } from "@/lib/dates";
import type { MapCheckIn, WalkDTO } from "@/lib/types";

const DEFAULT_CENTER: [number, number] = [40.7128, -74.006]; // NYC fallback
const DEFAULT_ZOOM = 11;
const RECENT_WINDOW_DAYS = 30;

type BoundsPoint = { lat: number; lng: number; timestamp: string };

function fitToPoints(map: L.Map, points: BoundsPoint[]) {
  if (points.length === 1) {
    map.setView([points[0].lat, points[0].lng], 14);
    return;
  }
  const bounds = L.latLngBounds(points.map((c) => [c.lat, c.lng]));
  map.fitBounds(bounds, { padding: [40, 40] });
}

function createEmojiIcon(emoji: string, timeLabel: string) {
  return L.divIcon({
    html: `<div class="pin-wrap"><div class="pin">${emoji}</div><time>${timeLabel}</time></div>`,
    className: "",
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -18],
  });
}

/**
 * Defaults to the cluster of recent activity rather than fitting every point ever logged —
 * an all-time bounding box gets dominated by old, far-flung clusters and stops feeling like
 * "here's what's going on now." "Fit All" (below) is the explicit opt-in to see everything.
 */
function FitToCheckIns({ points }: { points: BoundsPoint[] }) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => map.setView([pos.coords.latitude, pos.coords.longitude], 13),
          () => map.setView(DEFAULT_CENTER, DEFAULT_ZOOM),
          { timeout: 4000 }
        );
      } else {
        map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
      }
      return;
    }

    const cutoff = Date.now() - RECENT_WINDOW_DAYS * 24 * 60 * 60 * 1000;
    const recent = points.filter((c) => new Date(c.timestamp).getTime() >= cutoff);

    if (recent.length > 0) {
      fitToPoints(map, recent);
      return;
    }

    // Nothing in the recent window (e.g. revisiting after a long gap) — fall back to
    // the single most recent point rather than the full all-time bounds.
    const mostRecent = [...points].sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))[0];
    map.setView([mostRecent.lat, mostRecent.lng], 13);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points.length]);

  return null;
}

function FitAllControl({ points }: { points: BoundsPoint[] }) {
  const map = useMap();
  if (points.length < 2) return null;

  return (
    <button
      type="button"
      onClick={() => fitToPoints(map, points)}
      className="pixel-btn absolute top-2 right-2 z-[1000] text-[0.625rem]"
    >
      🔭 Fit All
    </button>
  );
}

function ClickToAdd({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

type Props = {
  checkIns: MapCheckIn[];
  walks?: WalkDTO[];
  onMapClick?: (lat: number, lng: number) => void;
  onMarkerClick?: (checkIn: MapCheckIn) => void;
};

export default function MapView({ checkIns, walks = [], onMapClick, onMarkerClick }: Props) {
  // Leaflet touches window/document at import time, so this only ever renders after
  // mount (the component is already loaded via next/dynamic with ssr:false) — a one-time
  // client-mount guard, not syncing to external data, so the lint nudge doesn't apply.
  const [ready, setReady] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setReady(true), []);

  const dayLines = useMemo(() => {
    const byDay = new Map<string, MapCheckIn[]>();
    for (const c of checkIns) {
      const key = startOfDay(new Date(c.timestamp)).toISOString();
      const bucket = byDay.get(key) ?? [];
      bucket.push(c);
      byDay.set(key, bucket);
    }
    return Array.from(byDay.values())
      .map((items) => [...items].sort((a, b) => (a.timestamp < b.timestamp ? -1 : 1)))
      .filter((items) => items.length >= 2)
      .map((items) => items.map((c) => [c.lat, c.lng] as [number, number]));
  }, [checkIns]);

  // Walk start/end points count toward "what's recent" the same as check-ins do.
  const boundsPoints = useMemo<BoundsPoint[]>(
    () => [
      ...checkIns,
      ...walks.flatMap((w) => [
        { lat: w.startLat, lng: w.startLng, timestamp: w.timestamp },
        { lat: w.endLat, lng: w.endLng, timestamp: w.timestamp },
      ]),
    ],
    [checkIns, walks]
  );

  if (!ready) return null;

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      <FitToCheckIns points={boundsPoints} />
      <FitAllControl points={boundsPoints} />
      {onMapClick ? <ClickToAdd onMapClick={onMapClick} /> : null}

      {dayLines.map((points, i) => (
        <Polyline
          key={`day-${i}`}
          positions={points}
          pathOptions={{ color: "#2b1233", weight: 2, dashArray: "5 5", opacity: 0.6 }}
        />
      ))}

      {walks.map((walk) => (
        <Polyline
          key={`walk-${walk.id}`}
          positions={walk.route}
          pathOptions={{
            color: "#1fae83",
            weight: 3,
            dashArray: "6 6",
            className: "walk-route-path",
          }}
        />
      ))}

      {walks.map((walk) => (
        <Marker
          key={`walk-start-${walk.id}`}
          position={[walk.startLat, walk.startLng]}
          icon={createEmojiIcon("🚶", formatTime(walk.timestamp))}
        >
          <Popup>
            <div className="min-w-[160px] font-body text-xs">
              <p className="font-bold">🚶 {walk.startPlaceName} → {walk.endPlaceName}</p>
              <p className="text-ink-soft">
                {formatShortDate(walk.timestamp)} · {(walk.distanceMeters / 1609.34).toFixed(1)} mi
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
      {walks.map((walk) => (
        <Marker
          key={`walk-end-${walk.id}`}
          position={[walk.endLat, walk.endLng]}
          icon={createEmojiIcon("🏁", formatTime(walk.timestamp))}
        >
          <Popup>
            <div className="min-w-[160px] font-body text-xs">
              <p className="font-bold">🏁 {walk.endPlaceName}</p>
              <p className="text-ink-soft">walked from {walk.startPlaceName}</p>
            </div>
          </Popup>
        </Marker>
      ))}

      {checkIns.map((checkIn) => (
        <Marker
          key={checkIn.id}
          position={[checkIn.lat, checkIn.lng]}
          icon={createEmojiIcon(checkIn.emoji, formatTime(checkIn.timestamp))}
          eventHandlers={onMarkerClick ? { click: () => onMarkerClick(checkIn) } : undefined}
        >
          <Popup>
            <div className="min-w-[160px] font-body text-xs">
              <p className="font-bold">{checkIn.emoji} {checkIn.placeName}</p>
              <p className="text-ink-soft">
                {formatShortDate(checkIn.timestamp)} · {formatTime(checkIn.timestamp)}
              </p>
              {checkIn.amountSpent != null ? (
                <p>${checkIn.amountSpent.toFixed(2)}</p>
              ) : null}
              <a
                href={checkIn.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="maps-link"
              >
                ↗ Maps
              </a>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
