"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireManager } from "@/lib/auth";

function num(v: FormDataEntryValue | null, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function str(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
}

export async function createItem(formData: FormData) {
  await requireManager();
  const supabase = await createClient();

  const { error } = await supabase.from("inventory_items").insert({
    name: String(formData.get("name") ?? "").trim(),
    category: str(formData.get("category")),
    unit: String(formData.get("unit") ?? "Unit").trim() || "Unit",
    low_stock_threshold: num(formData.get("low_stock_threshold"), 3),
    full_level: num(formData.get("full_level"), 6),
    cost_per_unit: formData.get("cost_per_unit")
      ? num(formData.get("cost_per_unit"))
      : null,
    supplier: str(formData.get("supplier")),
  });

  if (error) throw new Error(error.message);
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
}

export async function updateItem(formData: FormData) {
  await requireManager();
  const supabase = await createClient();
  const id = String(formData.get("id"));

  const { error } = await supabase
    .from("inventory_items")
    .update({
      name: String(formData.get("name") ?? "").trim(),
      category: str(formData.get("category")),
      unit: String(formData.get("unit") ?? "Unit").trim() || "Unit",
      low_stock_threshold: num(formData.get("low_stock_threshold"), 3),
      full_level: num(formData.get("full_level"), 6),
      cost_per_unit: formData.get("cost_per_unit")
        ? num(formData.get("cost_per_unit"))
        : null,
      supplier: str(formData.get("supplier")),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/inventory");
  revalidatePath(`/inventory/${id}`);
}

/**
 * Manager: set EVERY item at EVERY location to that item's full level —
 * a one-click "everything is restocked".
 */
export async function restockAllToFull() {
  await requireManager();
  const supabase = await createClient();

  const [{ data: items }, { data: locs }] = await Promise.all([
    supabase.from("inventory_items").select("id, full_level"),
    supabase.from("locations").select("id"),
  ]);

  const rows: { item_id: string; location_id: string; qty: number }[] = [];
  for (const it of (items ?? []) as { id: string; full_level: number }[]) {
    for (const l of (locs ?? []) as { id: string }[]) {
      rows.push({ item_id: it.id, location_id: l.id, qty: it.full_level });
    }
  }

  if (rows.length) {
    const { error } = await supabase
      .from("item_stock")
      .upsert(rows, { onConflict: "item_id,location_id" });
    if (error) throw new Error(error.message);
  }

  revalidatePath("/inventory");
  revalidatePath("/stock");
  revalidatePath("/dashboard");
}

export async function deleteItem(formData: FormData) {
  await requireManager();
  const supabase = await createClient();
  const id = String(formData.get("id"));

  const { error } = await supabase.from("inventory_items").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
}
