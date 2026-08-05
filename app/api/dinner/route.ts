import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date");
  const date = dateParam ? new Date(dateParam) : startOfUtcDay(new Date());

  const [today, all] = await Promise.all([
    prisma.dinnerLog.findUnique({ where: { date } }),
    prisma.dinnerLog.findMany(),
  ]);

  const made = all.filter((d) => d.type === "made").length;
  const purchased = all.filter((d) => d.type === "purchased").length;
  const total = made + purchased;

  return NextResponse.json({
    today: today ? { date: today.date.toISOString(), type: today.type } : null,
    counts: { made, purchased },
    percentages: {
      made: total ? Math.round((made / total) * 100) : 0,
      purchased: total ? Math.round((purchased / total) * 100) : 0,
    },
    total,
  });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const type = body.type;

  if (type !== "made" && type !== "purchased") {
    return NextResponse.json(
      { error: "type must be 'made' or 'purchased'" },
      { status: 400 }
    );
  }

  const date = body.date ? new Date(body.date) : startOfUtcDay(new Date());
  if (Number.isNaN(date.getTime())) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const entry = await prisma.dinnerLog.upsert({
    where: { date },
    update: { type },
    create: { date, type },
  });

  return NextResponse.json({ date: entry.date.toISOString(), type: entry.type });
}
