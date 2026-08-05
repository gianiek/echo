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
import { formatTime } from "@/lib/dates";
import type { MapCheckIn } from "@/lib/types";

const DEFAULT_CENTER: [number, number] = [40.7128, -74.006]; // NYC fallback
const DEFAULT_ZOOM = 11;

function createEmojiIcon(emoji: string, timeLabel: string) {
  return L.divIcon({
    html: `<div class="pin-wrap"><div class="pin">${emoji}</div><time>${timeLabel}</time></div>`,
    className: "",
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -18],
  });
}

function FitToCheckIns({ checkIns }: { checkIns: MapCheckIn[] }) {
  const map = useMap();

  useEffect(() => {
    if (checkIns.length === 0) {
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

    if (checkIns.length === 1) {
      map.setView([checkIns[0].lat, checkIns[0].lng], 14);
      return;
    }

    const bounds = L.latLngBounds(checkIns.map((c) => [c.lat, c.lng]));
    map.fitBounds(bounds, { padding: [40, 40] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkIns.length]);

  return null;
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
  onMapClick?: (lat: number, lng: number) => void;
  onMarkerClick?: (checkIn: MapCheckIn) => void;
};

export default function MapView({ checkIns, onMapClick, onMarkerClick }: Props) {
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
      <FitToCheckIns checkIns={checkIns} />
      {onMapClick ? <ClickToAdd onMapClick={onMapClick} /> : null}

      {dayLines.map((points, i) => (
        <Polyline
          key={i}
          positions={points}
          pathOptions={{ color: "#2b1233", weight: 2, dashArray: "5 5", opacity: 0.6 }}
        />
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
              <p className="text-ink-soft">{formatTime(checkIn.timestamp)}</p>
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
