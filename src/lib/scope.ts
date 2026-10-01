import type { createClient } from "@/lib/supabase/server";
import type { SessionProfile } from "@/lib/auth";

type Sb = Awaited<ReturnType<typeof createClient>>;

/** What a staff location login can see: their location, and counts there. */
export type OwnScope = { locationId: string; code: string; qty: Map<string, number> };

/**
 * For staff signed in with a location code, load their location's counts so
 * pages show ONLY that location's numbers. Managers (and other accounts)
 * get null = the full, all-locations view.
 */
export async function scopeFor(
  supabase: Sb,
  profile: SessionProfile,
): Promise<OwnScope | null> {
  if (profile.role === "manager" || !profile.location_code) return null;
  const { data: loc } = await supabase
    .from("locations")
    .select("id")
    .eq("code", profile.location_code)
    .single();
  if (!loc) return null;
  const { data: rows } = await supabase
    .from("item_stock")
    .select("item_id, qty")
    .eq("location_id", loc.id);
  const qty = new Map<string, number>();
  for (const r of (rows ?? []) as { item_id: string; qty: number }[]) {
    qty.set(r.item_id, Number(r.qty));
  }
  return { locationId: loc.id as string, code: profile.location_code, qty };
}

/** Replace each item's total with this location's count. */
export function scopeItems<T extends { id: string; current_qty: number }>(
  items: T[],
  scope: OwnScope | null,
): T[] {
  if (!scope) return items;
  return items.map((i) => ({ ...i, current_qty: scope.qty.get(i.id) ?? 0 }));
}
