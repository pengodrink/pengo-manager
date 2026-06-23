"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireManager } from "@/lib/auth";

function str(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
}

type IngredientInput = { name: string; quantity: number | null; unit: string | null };

function parseIngredients(formData: FormData): IngredientInput[] {
  const names = formData.getAll("ing_name").map((v) => String(v).trim());
  const qtys = formData.getAll("ing_qty").map((v) => String(v).trim());
  const units = formData.getAll("ing_unit").map((v) => String(v).trim());

  const rows: IngredientInput[] = [];
  for (let idx = 0; idx < names.length; idx++) {
    if (!names[idx]) continue;
    rows.push({
      name: names[idx],
      quantity: qtys[idx] ? Number(qtys[idx]) : null,
      unit: units[idx] || null,
    });
  }
  return rows;
}

async function uploadImage(
  recipeId: string,
  file: File | null,
): Promise<string | null> {
  if (!file || file.size === 0) return null;
  const supabase = await createClient();
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${recipeId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from("recipe-images")
    .upload(path, file, { upsert: true });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from("recipe-images").getPublicUrl(path);
  return data.publicUrl;
}

async function saveIngredients(recipeId: string, rows: IngredientInput[]) {
  const supabase = await createClient();
  await supabase.from("recipe_ingredients").delete().eq("recipe_id", recipeId);
  if (rows.length) {
    const { error } = await supabase.from("recipe_ingredients").insert(
      rows.map((r) => ({
        recipe_id: recipeId,
        name: r.name,
        quantity: r.quantity,
        unit: r.unit,
      })),
    );
    if (error) throw new Error(error.message);
  }
}

export async function createRecipe(formData: FormData) {
  await requireManager();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("recipes")
    .insert({
      name: String(formData.get("name") ?? "").trim(),
      category: str(formData.get("category")),
      description: str(formData.get("description")),
      instructions: str(formData.get("instructions")),
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  const recipeId = data.id as string;

  const imageUrl = await uploadImage(recipeId, formData.get("image") as File | null);
  if (imageUrl) {
    await supabase.from("recipes").update({ image_url: imageUrl }).eq("id", recipeId);
  }

  await saveIngredients(recipeId, parseIngredients(formData));

  revalidatePath("/recipes");
}

export async function updateRecipe(formData: FormData) {
  await requireManager();
  const supabase = await createClient();
  const id = String(formData.get("id"));

  const imageUrl = await uploadImage(id, formData.get("image") as File | null);

  const update: Record<string, unknown> = {
    name: String(formData.get("name") ?? "").trim(),
    category: str(formData.get("category")),
    description: str(formData.get("description")),
    instructions: str(formData.get("instructions")),
  };
  if (imageUrl) update.image_url = imageUrl;

  const { error } = await supabase.from("recipes").update(update).eq("id", id);
  if (error) throw new Error(error.message);

  await saveIngredients(id, parseIngredients(formData));

  revalidatePath("/recipes");
  revalidatePath(`/recipes/${id}`);
}

export async function deleteRecipe(formData: FormData) {
  await requireManager();
  const supabase = await createClient();
  const id = String(formData.get("id"));

  const { error } = await supabase.from("recipes").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/recipes");
  redirect("/recipes");
}
