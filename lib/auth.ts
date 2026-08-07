import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const AUTH_COOKIE = "echo_auth";

/**
 * Compares two strings without leaking how many leading characters matched via
 * response timing. Hashing both to a fixed length first sidesteps the "different
 * lengths" edge case entirely — timingSafeEqual requires equal-length buffers, and a
 * digest is always the same size regardless of input length.
 */
function timingSafeStringEqual(a: string, b: string): boolean {
  const hashA = createHash("sha256").update(a).digest();
  const hashB = createHash("sha256").update(b).digest();
  return timingSafeEqual(hashA, hashB);
}

/**
 * The auth cookie is HMAC(password, SESSION_SECRET) rather than a bare hash of the
 * password — so the cookie value isn't a keyless, publicly-recomputable function of
 * the password alone (which a leaked cookie + a weak passphrase could otherwise expose
 * to offline guessing). Returns null if either secret is unconfigured.
 */
export function expectedAuthToken(): string | null {
  const password = process.env.APP_PASSWORD;
  const secret = process.env.SESSION_SECRET;
  if (!password || !secret) return null;
  return createHmac("sha256", secret).update(password).digest("hex");
}

export function checkPassword(candidate: string): boolean {
  const expected = process.env.APP_PASSWORD;
  if (!expected) return false; // never authenticate against an unset password
  return timingSafeStringEqual(candidate, expected);
}

export function checkAuthToken(candidate: string | undefined): boolean {
  const expected = expectedAuthToken();
  if (!expected || !candidate) return false;
  return timingSafeStringEqual(candidate, expected);
}
