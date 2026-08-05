import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeCheckIn } from "@/lib/checkins";
import { categoryLabel } from "@/lib/categories";

export async function GET() {
  const checkIns = await prisma.checkIn.findMany({
    where: { amountSpent: { gt: 0 }, spendCategory: { not: null } },
    orderBy: { timestamp: "desc" },
  });
  const serialized = checkIns.map(serializeCheckIn);

  const byCategory = new Map<
    string,
    { emoji: string; label: string; total: number; count: number; items: typeof serialized }
  >();

  for (const checkIn of serialized) {
    const emoji = checkIn.spendCategory!;
    const existing = byCategory.get(emoji);
    if (existing) {
      existing.total += checkIn.amountSpent ?? 0;
      existing.count += 1;
      existing.items.push(checkIn);
    } else {
      byCategory.set(emoji, {
        emoji,
        label: categoryLabel(emoji) ?? "Other",
        total: checkIn.amountSpent ?? 0,
        count: 1,
        items: [checkIn],
      });
    }
  }

  const categories = Array.from(byCategory.values()).sort((a, b) => b.total - a.total);
  const grandTotal = categories.reduce((sum, c) => sum + c.total, 0);

  return NextResponse.json({
    total: grandTotal,
    categories: categories.map((c) => ({
      ...c,
      percent: grandTotal ? Math.round((c.total / grandTotal) * 100) : 0,
    })),
  });
}
