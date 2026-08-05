import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeCheckIn } from "@/lib/checkins";
import { groupByDay } from "@/lib/dates";

const SEGMENTS = 8;

function monthKey(iso: string): string {
  return iso.slice(0, 7); // YYYY-MM
}

function segmentsFor(current: number, best: number): number {
  if (best <= 0) return 0;
  return Math.max(0, Math.min(SEGMENTS, Math.round((current / best) * SEGMENTS)));
}

export async function GET() {
  const checkIns = await prisma.checkIn.findMany({ orderBy: { timestamp: "desc" } });
  const serialized = checkIns.map(serializeCheckIn);

  const totalSpent = serialized.reduce((sum, c) => sum + (c.amountSpent ?? 0), 0);
  const placesVisited = serialized.length;
  const workoutsDone = serialized.filter((c) => c.isWorkout).length;

  const days = groupByDay(serialized); // most-recent tracked day first; untracked days simply don't appear
  const daySpend = (items: typeof serialized) =>
    items.reduce((sum, c) => sum + (c.amountSpent ?? 0), 0);

  const noSpendTotal = days.filter((d) => daySpend(d.items) === 0).length;

  let noSpendStreak = 0;
  for (const day of days) {
    if (daySpend(day.items) > 0) break;
    noSpendStreak++;
  }

  // Monthly buckets power the decorative "vs. your best month" fill on each bar.
  const months = new Map<string, { spend: number; visits: number; workouts: number }>();
  for (const c of serialized) {
    const key = monthKey(c.timestamp);
    const bucket = months.get(key) ?? { spend: 0, visits: 0, workouts: 0 };
    bucket.spend += c.amountSpent ?? 0;
    bucket.visits += 1;
    bucket.workouts += c.isWorkout ? 1 : 0;
    months.set(key, bucket);
  }

  const thisMonthKey = new Date().toISOString().slice(0, 7);
  const thisMonth = months.get(thisMonthKey) ?? { spend: 0, visits: 0, workouts: 0 };
  const bestSpend = Math.max(0, ...Array.from(months.values(), (m) => m.spend));
  const bestVisits = Math.max(0, ...Array.from(months.values(), (m) => m.visits));
  const bestWorkouts = Math.max(0, ...Array.from(months.values(), (m) => m.workouts));

  return NextResponse.json({
    totalSpent,
    placesVisited,
    workoutsDone,
    noSpendDays: { total: noSpendTotal, streak: noSpendStreak },
    bars: {
      segments: SEGMENTS,
      spent: segmentsFor(thisMonth.spend, bestSpend),
      places: segmentsFor(thisMonth.visits, bestVisits),
      workouts: segmentsFor(thisMonth.workouts, bestWorkouts),
      noSpend: segmentsFor(noSpendStreak, Math.max(noSpendStreak, noSpendTotal)),
    },
  });
}
