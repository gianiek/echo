import { createHash } from "node:crypto";

export const AUTH_COOKIE = "echo_auth";

export function expectedAuthToken(): string {
  const password = process.env.APP_PASSWORD ?? "";
  return createHash("sha256").update(password).digest("hex");
}

export function checkPassword(candidate: string): boolean {
  return candidate === (process.env.APP_PASSWORD ?? "");
}
