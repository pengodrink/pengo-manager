"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireManager, requireProfile } from "@/lib/auth";

/**
 * Save one location's stock counts. The form contains a hidden `location_id`
 * plus one `qty_<itemId>` field per item. We upsert all of them at once.
 */
export async function saveCounts(formData: FormData) {
  await requireProfile();
  const supabase = await createClient();

  const locationId = String(formData.get("location_id"));
  if (!locationId) throw new Error("No location selected.");

  const rows: { item_id: string; location_id: string; qty: number }[] = [];
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("qty_")) continue;
    const itemId = key.slice(4);
    const n = Number(value);
    rows.push({
      item_id: itemId,
      location_id: locationId,
      qty: Number.isFinite(n) ? n : 0,
    });
  }

  if (rows.length) {
    const { error } = await supabase
      .from("item_stock")
      .upsert(rows, { onConflict: "item_id,location_id" });
    if (error) throw new Error(error.message);
  }

  revalidatePath("/stock");
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  redirect(`/stock?loc=${locationId}&saved=1`);
}

/**
 * Restock one item across locations. The form has a hidden `item_id` plus one
 * `qty_<locationId>` field per location. Used by the editable reorder report.
 */
export async function saveItemCounts(formData: FormData) {
  await requireProfile();
  const supabase = await createClient();

  const itemId = String(formData.get("item_id"));
  if (!itemId) throw new Error("No item.");

  const rows: { item_id: string; location_id: string; qty: number }[] = [];
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("qty_")) continue;
    const n = Number(value);
    rows.push({
      item_id: itemId,
      location_id: key.slice(4),
      qty: Number.isFinite(n) ? n : 0,
    });
  }

  if (rows.length) {
    const { error } = await supabase
      .from("item_stock")
      .upsert(rows, { onConflict: "item_id,location_id" });
    if (error) throw new Error(error.message);
  }

  revalidatePath("/stock");
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
}

/** Manager: set the global reorder minimum (applied to every item). */
export async function setGlobalMinimum(formData: FormData) {
  await requireManager();
  const supabase = await createClient();
  const min = Math.max(0, Number(formData.get("minimum")) || 0);

  const { error } = await supabase
    .from("inventory_items")
    .update({ low_stock_threshold: min })
    .gte("low_stock_threshold", 0); // matches every row
  if (error) throw new Error(error.message);

  revalidatePath("/stock");
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
}
