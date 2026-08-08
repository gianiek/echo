"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import PixelBar from "@/components/pixel/PixelBar";
import PixelLineChart from "@/components/pixel/PixelLineChart";
import ActivityHeatmap from "@/components/pixel/ActivityHeatmap";
import BatMascot from "@/components/pixel/BatMascot";
import type { MapCheckIn } from "@/lib/types";

const MapView = dynamic(() => import("@/components/map/MapView"), {
  ssr: false,
  loading: () => <p className="p-4 text-xs text-ink-soft">loading map…</p>,
});

// Everything on this page is hardcoded sample data — this route never touches the
// database, so it's safe to link publicly without exposing anything from the real,
// single-user app it's demonstrating.

const SAMPLE_CHECKINS: MapCheckIn[] = [
  {
    id: "d1",
    placeName: "Roastery Coffee",
    lat: 37.7714,
    lng: -122.4816,
    emoji: "☕",
    timestamp: daysAgoIso(1, 8, 15),
    googleMapsUrl: "#",
    amountSpent: 5.5,
  },
  {
    id: "d2",
    placeName: "Community Gym",
    lat: 37.7694,
    lng: -122.4862,
    emoji: "🏋️",
    timestamp: daysAgoIso(1, 18, 0),
    googleMapsUrl: "#",
    amountSpent: 0,
  },
  {
    id: "d3",
    placeName: "Riverside Books",
    lat: 37.7679,
    lng: -122.4831,
    emoji: "📚",
    timestamp: daysAgoIso(3, 14, 20),
    googleMapsUrl: "#",
    amountSpent: 18,
  },
  {
    id: "d4",
    placeName: "The Corner Diner",
    lat: 37.7658,
    lng: -122.478,
    emoji: "🍔",
    timestamp: daysAgoIso(3, 19, 30),
    googleMapsUrl: "#",
    amountSpent: 22,
  },
  {
    id: "d5",
    placeName: "Sunset Trailhead",
    lat: 37.7645,
    lng: -122.4897,
    emoji: "🌳",
    timestamp: daysAgoIso(6, 9, 0),
    googleMapsUrl: "#",
    amountSpent: 0,
  },
];

const SAMPLE_LOG = [
  { time: "8:15am", emoji: "☕", title: "Roastery Coffee", meta: "$5.50", type: "checkin" },
  { time: "6:00pm", emoji: "🏋️", title: "Community Gym", meta: "workout", type: "checkin" },
];
const SAMPLE_LOG_DAY2 = [
  { time: "2:20pm", emoji: "📚", title: "Riverside Books", meta: "$18.00", type: "checkin" },
  { time: "7:30pm", emoji: "🍔", title: "The Corner Diner", meta: "$22.00", type: "checkin" },
  { time: "9:05pm", emoji: "🎬", title: "Spirited Away", meta: "rated 5/5", type: "movie" },
];
const SAMPLE_LOG_DAY3 = [
  { time: "9:00am", emoji: "🌳", title: "Sunset Trailhead", meta: "walk · 2.4mi", type: "walk" },
  { time: "9:40pm", emoji: "✨", title: "Finally fixed that flaky test", meta: "whimsy", type: "journal" },
];

const SAMPLE_JOURNAL_DATES = buildSampleJournalDates();
const SAMPLE_MOOD_POINTS = buildSampleMoodPoints();

function daysAgoIso(days: number, hour: number, minute: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function buildSampleJournalDates(): string[] {
  const dates: string[] = [];
  for (let i = 0; i < 120; i++) {
    // A deterministic, pseudo-random-looking but reproducible pattern — no Math.random()
    // so the page renders identically on every load/build.
    const hit = (i * 37) % 100;
    if (hit < 55) continue;
    const count = hit > 90 ? 2 : 1;
    for (let c = 0; c < count; c++) dates.push(daysAgoIso(i, 20, 0));
  }
  return dates;
}

function buildSampleMoodPoints(): { date: string; value: number }[] {
  const points: { date: string; value: number }[] = [];
  const pattern = [3, 4, 4, 5, 3, 2, 4, 4, 5, 5, 3, 4];
  for (let i = 29; i >= 0; i--) {
    if (i % 5 === 2) continue; // leave a gap here and there, same as real gappy data
    points.push({ date: daysAgoIso(i, 21, 0), value: pattern[i % pattern.length] });
  }
  return points;
}

function LogRow({
  time,
  emoji,
  title,
  meta,
}: {
  time: string;
  emoji: string;
  title: string;
  meta: string;
}) {
  return (
    <div className="log-row" style={{ cursor: "default" }}>
      <time>{time}</time>
      <span>{emoji}</span>
      <span className="truncate">{title}</span>
      <span className="amt">{meta}</span>
      <span />
    </div>
  );
}

export default function DemoView() {
  return (
    <div className="pixel-box mx-auto flex w-full max-w-[420px] flex-1 flex-col lg:max-w-[720px]">
      <div className="flex items-center justify-center gap-2 px-3 py-3 font-display text-xs">
        <span>🦇 ECHO</span>
      </div>

      <div className="flex flex-col items-center gap-1 border-t-2 border-ink bg-panel-2 px-3 py-2 text-center text-[0.625rem] tracking-wide text-ink-soft uppercase">
        <div className="flex items-center gap-1.5">
          <BatMascot className="scale-50" />
          <span>
            demo mode <b className="text-accent">·</b> sample data, not a real account
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <p className="mb-3 text-[0.6875rem] leading-relaxed text-ink-soft normal-case">
          Everything below is fake — a made-up week of coffee runs, a gym session, a book, a
          walk, and a journal entry — rendered with the real components and hardcoded sample
          data, so this page never touches the database behind the live app.
        </p>

        <p className="mb-2 text-[0.6875rem] tracking-wide text-ink-soft uppercase">The map</p>
        <div className="pixel-box-sm relative mb-5 h-[40dvh] min-h-[220px] w-full overflow-hidden">
          <MapView checkIns={SAMPLE_CHECKINS} />
        </div>

        <p className="mb-2 text-[0.6875rem] tracking-wide text-ink-soft uppercase">The log</p>
        <div className="pixel-box-sm mb-5 p-2">
          <p className="day-header">Today</p>
          {SAMPLE_LOG.map((r) => (
            <LogRow key={r.title} {...r} />
          ))}
          <p className="day-header">3 days ago</p>
          {SAMPLE_LOG_DAY2.map((r) => (
            <LogRow key={r.title} {...r} />
          ))}
          <p className="day-header">6 days ago</p>
          {SAMPLE_LOG_DAY3.map((r) => (
            <LogRow key={r.title} {...r} />
          ))}
        </div>

        <p className="mb-2 text-[0.6875rem] tracking-wide text-ink-soft uppercase">Stats</p>
        <div className="mb-5 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          <div className="pixel-box-sm p-3">
            <div className="font-display text-lg">$482</div>
            <div className="mt-1.5 mb-2 text-[0.5625rem] tracking-wide text-ink-soft uppercase">
              $ Spent
            </div>
            <PixelBar variant="segments" segments={8} filled={4} />
          </div>
          <div className="pixel-box-sm p-3">
            <div className="font-display text-lg">27</div>
            <div className="mt-1.5 mb-2 text-[0.5625rem] tracking-wide text-ink-soft uppercase">
              Places Visited
            </div>
            <PixelBar variant="segments" segments={8} filled={6} />
          </div>
          <div className="pixel-box-sm p-3">
            <div className="font-display text-lg">9</div>
            <div className="mt-1.5 mb-2 text-[0.5625rem] tracking-wide text-ink-soft uppercase">
              Workouts
            </div>
            <PixelBar variant="segments" segments={8} filled={3} />
          </div>
          <div className="pixel-box-sm p-3">
            <div className="font-display text-lg">4🔥</div>
            <div className="mt-1.5 mb-2 text-[0.5625rem] tracking-wide text-ink-soft uppercase">
              No-Spend Streak
            </div>
            <PixelBar variant="segments" segments={8} filled={2} />
          </div>
        </div>

        <p className="mb-2 text-[0.6875rem] tracking-wide text-ink-soft uppercase">Mood trend</p>
        <div className="pixel-box-sm mb-5 p-2">
          <PixelLineChart
            points={SAMPLE_MOOD_POINTS}
            min={1}
            max={5}
            formatValue={(v) => ["😞", "😕", "😐", "🙂", "😄"][v - 1] ?? String(v)}
          />
        </div>

        <p className="mb-2 text-[0.6875rem] tracking-wide text-ink-soft uppercase">
          Journal heatmap
        </p>
        <div className="mb-5">
          <ActivityHeatmap dates={SAMPLE_JOURNAL_DATES} unitLabel="entry" unitLabelPlural="entries" />
        </div>

        <div className="pixel-box-sm p-3 text-center">
          <p className="mb-3 text-[0.6875rem] leading-relaxed text-ink-soft normal-case">
            This is a portfolio walkthrough of a real, daily-driver app I built for myself.
            The actual thing is password-gated (it&apos;s my life, not a public dataset) —
            everything you just saw is the same UI, same components, fake data.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link href="https://github.com/gianiek/echo" className="pixel-btn pixel-btn--accent flex-1">
              View source ↗
            </Link>
            <Link href="https://echo-ten-coral.vercel.app" className="pixel-btn flex-1">
              Open the live app ↗
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
