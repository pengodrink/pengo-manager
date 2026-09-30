import { createHmac } from "crypto";

// Locations staff can enter with a code. Each has a hidden Supabase account
// (loc-<code>@pengodrink.com) whose password is derived from a server secret.
// To add a location: add it here AND create its account (see README notes).
export const STAFF_LOCATIONS = [
  { code: "MV", name: "Mission Viejo" },
  { code: "LF", name: "Lake Forest" },
  { code: "AP", name: "Pengo Alicia" },
] as const;

export const SESSION_MINUTES = 30;

export const locationEmail = (code: string) =>
  `loc-${code.toLowerCase()}@pengodrink.com`;

export function locationPassword(code: string): string {
  const secret = process.env.LOCATION_AUTH_SECRET;
  if (!secret) throw new Error("LOCATION_AUTH_SECRET is not set.");
  return createHmac("sha256", secret).update(`loc:${code}`).digest("hex");
}
