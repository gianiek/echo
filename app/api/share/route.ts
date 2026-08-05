import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateShareToken } from "@/lib/share";

export async function GET() {
  const settings = await prisma.settings.findUnique({ where: { id: 1 } });
  return NextResponse.json({ token: settings?.shareToken ?? null });
}

export async function POST() {
  const token = generateShareToken();
  await prisma.settings.upsert({
    where: { id: 1 },
    update: { shareToken: token },
    create: { id: 1, shareToken: token },
  });
  return NextResponse.json({ token });
}

export async function DELETE() {
  await prisma.settings.upsert({
    where: { id: 1 },
    update: { shareToken: null },
    create: { id: 1, shareToken: null },
  });
  return NextResponse.json({ ok: true });
}
