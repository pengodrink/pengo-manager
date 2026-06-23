"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireManager, requireProfile } from "@/lib/auth";
import type { InventoryTxType } from "@/lib/types";

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
    unit: String(formData.get("unit") ?? "pcs").trim() || "pcs",
    current_qty: num(formData.get("current_qty")),
    low_stock_threshold: num(formData.get("low_stock_threshold")),
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
      unit: String(formData.get("unit") ?? "pcs").trim() || "pcs",
      low_stock_threshold: num(formData.get("low_stock_threshold")),
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
 * Records a stock movement. The DB trigger updates inventory_items.current_qty.
 * `type` decides the sign: restock = +, usage = -, adjustment = signed as given.
 */
export async function logTransaction(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const itemId = String(formData.get("item_id"));
  const type = String(formData.get("type")) as InventoryTxType;
  const amount = Math.abs(num(formData.get("amount")));

  let change = amount;
  if (type === "usage") change = -amount;
  if (type === "adjustment") change = num(formData.get("amount")); // keep sign

  const { error } = await supabase.from("inventory_transactions").insert({
    item_id: itemId,
    change_qty: change,
    type,
    note: str(formData.get("note")),
    created_by: profile.id,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/inventory");
  revalidatePath(`/inventory/${itemId}`);
  revalidatePath("/dashboard");
}
