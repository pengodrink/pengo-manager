"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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

type Sb = Awaited<ReturnType<typeof createClient>>;

/** A new item starts "carried" at every location, with a count of 0. */
async function addToAllLocations(supabase: Sb, itemIds: string[]) {
  if (!itemIds.length) return;
  const { data: locs } = await supabase.from("locations").select("id");
  const rows = itemIds.flatMap((item_id) =>
    ((locs ?? []) as { id: string }[]).map((l) => ({
      item_id,
      location_id: l.id,
      qty: 0,
    })),
  );
  if (rows.length) {
    const { error } = await supabase
      .from("item_stock")
      .upsert(rows, { onConflict: "item_id,location_id", ignoreDuplicates: true });
    if (error) throw new Error(error.message);
  }
}

export async function createItem(formData: FormData) {
  await requireManager();
  const supabase = await createClient();

  const { data: created, error } = await supabase
    .from("inventory_items")
    .insert({
    name: String(formData.get("name") ?? "").trim(),
    category: str(formData.get("category")),
    unit: String(formData.get("unit") ?? "Unit").trim() || "Unit",
    low_stock_threshold: num(formData.get("low_stock_threshold"), 3),
    full_level: num(formData.get("full_level"), 6),
    cost_per_unit: formData.get("cost_per_unit")
      ? num(formData.get("cost_per_unit"))
      : null,
    supplier: str(formData.get("supplier")),
  })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  await addToAllLocations(supabase, [created.id as string]);
  revalidatePath("/inventory");
  revalidatePath("/stock");
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

  // "Carried at" checkboxes: ticked = the location carries this item.
  const locIds = String(formData.get("loc_ids") ?? "")
    .split(",")
    .filter(Boolean);
  for (const locId of locIds) {
    if (formData.has(`carry_${locId}`)) {
      await supabase
        .from("item_stock")
        .upsert([{ item_id: id, location_id: locId, qty: 0 }], {
          onConflict: "item_id,location_id",
          ignoreDuplicates: true,
        });
    } else {
      await supabase
        .from("item_stock")
        .delete()
        .eq("item_id", id)
        .eq("location_id", locId);
    }
  }

  revalidatePath("/inventory");
  revalidatePath(`/inventory/${id}`);
  revalidatePath("/stock");
  revalidatePath("/dashboard");
  revalidatePath("/shop");
}

/**
 * Manager: set EVERY item at EVERY location to that item's full level —
 * a one-click "everything is restocked".
 */
export async function restockAllToFull() {
  await requireManager();
  const supabase = await createClient();

  const [{ data: items }, { data: existing }] = await Promise.all([
    supabase.from("inventory_items").select("id, full_level"),
    supabase.from("item_stock").select("item_id, location_id"),
  ]);

  const full = new Map(
    ((items ?? []) as { id: string; full_level: number }[]).map((i) => [
      i.id,
      i.full_level,
    ]),
  );
  const now = new Date().toISOString();
  // Only rows that already exist = only locations that carry the item.
  const rows = ((existing ?? []) as { item_id: string; location_id: string }[])
    .filter((r) => full.has(r.item_id))
    .map((r) => ({
      item_id: r.item_id,
      location_id: r.location_id,
      qty: full.get(r.item_id) ?? 0,
      updated_at: now,
    }));

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
  revalidatePath("/stock");
  revalidatePath("/shop");
  revalidatePath("/dashboard");
  if (formData.get("then") === "list") redirect("/inventory");
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

  const { data: made, error } = await supabase
    .from("inventory_items")
    .insert(rows)
    .select("id");
  if (error) throw new Error(error.message);
  await addToAllLocations(
    supabase,
    ((made ?? []) as { id: string }[]).map((m) => m.id),
  );

  revalidatePath("/inventory");
  revalidatePath("/stock");
  revalidatePath("/shop");
  revalidatePath("/dashboard");
}
