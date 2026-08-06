import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date");
  const date = dateParam ? new Date(dateParam) : startOfUtcDay(new Date());

  const [today, allDaily, checkIns] = await Promise.all([
    prisma.dailyLog.findUnique({ where: { date } }),
    prisma.dailyLog.findMany(),
    prisma.checkIn.findMany({ select: { timestamp: true } }),
  ]);

  // Dinner
  const dinnerMade = allDaily.filter((d) => d.dinnerType === "made").length;
  const dinnerPurchased = allDaily.filter((d) => d.dinnerType === "purchased").length;
  const dinnerTotal = dinnerMade + dinnerPurchased;

  // Home vs. visited: an explicit "didn't leave the house" takes precedence over
  // inferred check-in activity for that same day.
  const stayedHomeDayKeys = new Set(
    allDaily.filter((d) => d.didNotLeaveHouse).map((d) => d.date.toISOString().slice(0, 10))
  );
  const visitedDayKeys = new Set(
    checkIns
      .map((c) => c.timestamp.toISOString().slice(0, 10))
      .filter((key) => !stayedHomeDayKeys.has(key))
  );
  const stayedHomeDays = stayedHomeDayKeys.size;
  const visitedDays = visitedDayKeys.size;
  const homeVisitedTotal = stayedHomeDays + visitedDays;

  // Mood distribution, 1-5
  const moodCounts = [1, 2, 3, 4, 5].map(
    (level) => allDaily.filter((d) => d.mood === level).length
  );
  const moodTotal = moodCounts.reduce((sum, n) => sum + n, 0);

  return NextResponse.json({
    today: today
      ? {
          date: today.date.toISOString(),
          dinnerType: today.dinnerType,
          didNotLeaveHouse: today.didNotLeaveHouse,
          mood: today.mood,
        }
      : null,
    dinner: {
      counts: { made: dinnerMade, purchased: dinnerPurchased },
      percentages: {
        made: dinnerTotal ? Math.round((dinnerMade / dinnerTotal) * 100) : 0,
        purchased: dinnerTotal ? Math.round((dinnerPurchased / dinnerTotal) * 100) : 0,
      },
      total: dinnerTotal,
    },
    homeVsVisited: {
      counts: { stayedHome: stayedHomeDays, visited: visitedDays },
      percentages: {
        stayedHome: homeVisitedTotal ? Math.round((stayedHomeDays / homeVisitedTotal) * 100) : 0,
        visited: homeVisitedTotal ? Math.round((visitedDays / homeVisitedTotal) * 100) : 0,
      },
      total: homeVisitedTotal,
    },
    mood: {
      counts: moodCounts,
      percentages: moodCounts.map((n) => (moodTotal ? Math.round((n / moodTotal) * 100) : 0)),
      total: moodTotal,
    },
  });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const date = body.date ? new Date(body.date) : startOfUtcDay(new Date());
  if (Number.isNaN(date.getTime())) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};

  if (body.dinnerType !== undefined) {
    if (body.dinnerType !== null && body.dinnerType !== "made" && body.dinnerType !== "purchased") {
      return NextResponse.json(
        { error: "dinnerType must be 'made', 'purchased', or null" },
        { status: 400 }
      );
    }
    data.dinnerType = body.dinnerType;
  }

  if (body.didNotLeaveHouse !== undefined) {
    data.didNotLeaveHouse = Boolean(body.didNotLeaveHouse);
  }

  if (body.mood !== undefined) {
    if (body.mood !== null && (!Number.isInteger(body.mood) || body.mood < 1 || body.mood > 5)) {
      return NextResponse.json({ error: "mood must be an integer 1-5, or null" }, { status: 400 });
    }
    data.mood = body.mood;
  }

  const entry = await prisma.dailyLog.upsert({
    where: { date },
    update: data,
    create: { date, ...data },
  });

  return NextResponse.json({
    date: entry.date.toISOString(),
    dinnerType: entry.dinnerType,
    didNotLeaveHouse: entry.didNotLeaveHouse,
    mood: entry.mood,
  });
}
