import { cookies } from "next/headers";

// Cookie name granting count access to a specific location for this session.
export const locCookie = (locationId: string) => `ploc_${locationId}`;

/** Has the current browser unlocked this location with its PIN? */
export async function hasLocationAccess(locationId: string): Promise<boolean> {
  const c = await cookies();
  return c.get(locCookie(locationId))?.value === "1";
}
