import { NextResponse } from "next/server";
import { AUTH_COOKIE, checkPassword, expectedAuthToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json();
  const password = typeof body.password === "string" ? body.password : "";
  const trackerName =
    typeof body.trackerName === "string" ? body.trackerName.trim() : "";

  if (!checkPassword(password)) {
    return NextResponse.json({ error: "Wrong passphrase" }, { status: 401 });
  }

  if (trackerName) {
    await prisma.settings.upsert({
      where: { id: 1 },
      update: { trackerName },
      create: { id: 1, trackerName },
    });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(AUTH_COOKIE, expectedAuthToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}
