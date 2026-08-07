"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import CheckInDialog from "@/components/checkin/CheckInDialog";
import PixelButton from "@/components/pixel/PixelButton";
import BatMascot from "@/components/pixel/BatMascot";
import TimelineSlider from "@/components/map/TimelineSlider";
import type { CheckInDTO, WalkDTO } from "@/lib/types";

const MapView = dynamic(() => import("@/components/map/MapView"), {
  ssr: false,
  loading: () => <p className="p-4 text-xs text-ink-soft">loading map…</p>,
});

export default function MapPage() {
  const [checkIns, setCheckIns] = useState<CheckInDTO[]>([]);
  const [walks, setWalks] = useState<WalkDTO[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CheckInDTO | null>(null);
  const [tapLocation, setTapLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [cutoff, setCutoff] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/checkins")
      .then((res) => res.json())
      .then(setCheckIns);
    fetch("/api/walks")
      .then((res) => res.json())
      .then(setWalks);
  }, []);

  const { minTime, maxTime } = useMemo(() => {
    const times = [
      ...checkIns.map((c) => new Date(c.timestamp).getTime()),
      ...walks.map((w) => new Date(w.timestamp).getTime()),
    ];
    if (times.length === 0) return { minTime: 0, maxTime: 0 };
    return { minTime: Math.min(...times), maxTime: Math.max(...times) };
  }, [checkIns, walks]);

  // null cutoff = "now" (show everything); the slider only clamps things once dragged back.
  const effectiveCutoff = cutoff ?? maxTime;
  const visibleCheckIns = useMemo(
    () => checkIns.filter((c) => new Date(c.timestamp).getTime() <= effectiveCutoff),
    [checkIns, effectiveCutoff]
  );
  const visibleWalks = useMemo(
    () => walks.filter((w) => new Date(w.timestamp).getTime() <= effectiveCutoff),
    [walks, effectiveCutoff]
  );

  function upsert(checkIn: CheckInDTO) {
    setCheckIns((current) => {
      const exists = current.some((c) => c.id === checkIn.id);
      return exists
        ? current.map((c) => (c.id === checkIn.id ? checkIn : c))
        : [checkIn, ...current];
    });
  }

  function remove(id: string) {
    setCheckIns((current) => current.filter((c) => c.id !== id));
  }

  return (
    <div>
      <p className="mb-2 text-[0.6875rem] tracking-wide text-ink-soft uppercase">
        {visibleCheckIns.length} stop{visibleCheckIns.length === 1 ? "" : "s"} pinned
        {effectiveCutoff < maxTime ? " (scrubbed)" : ""}
      </p>

      <div className="pixel-box-sm relative mb-3 h-[65dvh] min-h-[320px] w-full overflow-hidden">
        <MapView
          checkIns={visibleCheckIns}
          walks={visibleWalks}
          onMapClick={(lat, lng) => {
            setEditing(null);
            setTapLocation({ lat, lng });
            setDialogOpen(true);
          }}
          onMarkerClick={(mapCheckIn) => {
            const full = checkIns.find((c) => c.id === mapCheckIn.id);
            if (!full) return;
            setTapLocation(null);
            setEditing(full);
            setDialogOpen(true);
          }}
        />
        <div className="pointer-events-none absolute inset-0 z-[500] flex items-end justify-between p-2">
          <BatMascot />
          <PixelButton
            fab
            variant="accent"
            className="pointer-events-auto"
            aria-label="Add check-in"
            onClick={() => {
              setEditing(null);
              setTapLocation(null);
              setDialogOpen(true);
            }}
          >
            +
          </PixelButton>
        </div>
      </div>

      <TimelineSlider
        minTime={minTime}
        maxTime={maxTime}
        value={effectiveCutoff}
        onChange={setCutoff}
      />

      <p className="text-[0.625rem] text-ink-soft">
        tap the map to drop a pin, or tap a pin for details + the Maps link
      </p>

      <CheckInDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={upsert}
        onDeleted={remove}
        editing={editing}
        initialLocation={tapLocation}
      />
    </div>
  );
}
