"use client";

import dynamic from "next/dynamic";
import BatMascot from "@/components/pixel/BatMascot";
import { formatShortDate, formatTime } from "@/lib/dates";
import type { PublicCheckInDTO } from "@/lib/types";

const MapView = dynamic(() => import("@/components/map/MapView"), {
  ssr: false,
  loading: () => <p className="p-4 text-xs text-ink-soft">loading map…</p>,
});

export default function SharedView({
  trackerName,
  checkIns,
}: {
  trackerName: string;
  checkIns: PublicCheckInDTO[];
}) {
  return (
    <div className="pixel-box mx-auto flex w-full max-w-[420px] flex-1 flex-col lg:max-w-[720px]">
      <div className="flex items-center justify-center gap-2 px-3 py-3 font-display text-xs">
        <span>🦇 ECHO</span>
      </div>
      <div className="flex items-center justify-center gap-1.5 border-t-2 border-ink bg-panel-2 px-3 py-1.5 text-[0.625rem] tracking-wide text-ink-soft uppercase">
        <BatMascot className="scale-50" />
        following <b className="text-ink">{trackerName || "a friend"}</b>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <p className="mb-2 text-[0.6875rem] tracking-wide text-ink-soft uppercase">
          {checkIns.length} stop{checkIns.length === 1 ? "" : "s"} pinned
        </p>

        <div className="pixel-box-sm relative mb-4 h-[55dvh] min-h-[280px] w-full overflow-hidden">
          <MapView checkIns={checkIns} />
        </div>

        {checkIns.length === 0 ? (
          <p className="text-xs text-ink-soft">Nothing pinned yet.</p>
        ) : (
          checkIns.map((c) => (
            <div key={c.id} className="log-row" style={{ cursor: "default" }}>
              <time>{formatShortDate(c.timestamp)}</time>
              <span>{c.emoji}</span>
              <span className="truncate">{c.placeName}</span>
              <span className={c.isWorkout ? "amt workout" : "amt"}>
                {c.isWorkout ? "workout" : formatTime(c.timestamp)}
              </span>
              <a
                href={c.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="maps-link"
              >
                ↗ Maps
              </a>
            </div>
          ))
        )}

        <p className="mt-4 text-center text-[0.5625rem] text-ink-soft">
          read-only view · powered by Echo
        </p>
      </div>
    </div>
  );
}
