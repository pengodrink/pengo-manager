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

  const now = new Date().toISOString();
  const rows: {
    item_id: string;
    location_id: string;
    qty: number;
    updated_at: string;
  }[] = [];
  for (const it of (items ?? []) as { id: string; full_level: number }[]) {
    for (const l of (locs ?? []) as { id: string }[]) {
      rows.push({
        item_id: it.id,
        location_id: l.id,
        qty: it.full_level,
        updated_at: now,
      });
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

/**
 * Manager: add many items at once. One per line, as "Name" or
 * "Name | Category". Vendor/category fields apply as defaults. Items that
 * already exist (same name + vendor) are skipped.
 */
export async function importItems(formData: FormData) {
  await requireManager();
  const supabase = await createClient();

  const defSupplier = str(formData.get("supplier"));
  const defCategory = str(formData.get("category"));
  const lines = String(formData.get("list") ?? "").split("\n");

  const { data: existing } = await supabase
    .from("inventory_items")
    .select("name, supplier");
  const seen = new Set(
    ((existing ?? []) as { name: string; supplier: string | null }[]).map(
      (e) => `${e.name.trim().toLowerCase()}|${(e.supplier ?? "").toLowerCase()}`,
    ),
  );

  const rows: {
    name: string;
    category: string | null;
    supplier: string | null;
    unit: string;
    low_stock_threshold: number;
    full_level: number;
  }[] = [];

  for (const raw of lines) {
    const [nameRaw, catRaw] = raw.split("|");
    const name = (nameRaw ?? "").trim();
    if (!name) continue;
    const key = `${name.toLowerCase()}|${(defSupplier ?? "").toLowerCase()}`;
    if (seen.has(key)) continue; // duplicate of an existing item or earlier line
    seen.add(key);
    rows.push({
      name,
      category: (catRaw ?? "").trim() || defCategory,
      supplier: defSupplier,
      unit: "Unit",
      low_stock_threshold: 3,
      full_level: 6,
    });
  }

  if (!rows.length) throw new Error("Nothing new to add (all items already exist).");

  const { error } = await supabase.from("inventory_items").insert(rows);
  if (error) throw new Error(error.message);

  revalidatePath("/inventory");
  revalidatePath("/stock");
  revalidatePath("/shop");
  revalidatePath("/dashboard");
}
