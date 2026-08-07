import { NextResponse } from "next/server";
import { AUTH_COOKIE, checkPassword, expectedAuthToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const FAILED_LOGIN_DELAY_MS = 400;

export async function POST(request: Request) {
  const body = await request.json();
  const password = typeof body.password === "string" ? body.password : "";
  const trackerName =
    typeof body.trackerName === "string" ? body.trackerName.trim() : "";

  if (!checkPassword(password)) {
    // A small fixed delay raises the cost of brute-forcing the passphrase across many
    // requests without needing a shared rate-limit store across serverless invocations.
    await new Promise((resolve) => setTimeout(resolve, FAILED_LOGIN_DELAY_MS));
    return NextResponse.json({ error: "Wrong passphrase" }, { status: 401 });
  }

  const token = expectedAuthToken();
  if (!token) {
    return NextResponse.json(
      { error: "Server is misconfigured (missing SESSION_SECRET)" },
      { status: 500 }
    );
  }

  if (trackerName) {
    await prisma.settings.upsert({
      where: { id: 1 },
      update: { trackerName },
      create: { id: 1, trackerName },
    });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}
