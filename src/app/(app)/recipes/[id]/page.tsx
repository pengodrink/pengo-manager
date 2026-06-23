import Link from "next/link";
import { notFound } from "next/navigation";
import { FormDialog } from "@/components/form-dialog";
import { ConfirmButton } from "@/components/confirm-button";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import type { Recipe, RecipeIngredient } from "@/lib/types";
import { RecipeFields } from "../recipe-fields";
import { updateRecipe, deleteRecipe } from "../actions";

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireProfile();
  const isManager = profile.role === "manager";
  const supabase = await createClient();

  const { data: recipe } = await supabase
    .from("recipes")
    .select("*")
    .eq("id", id)
    .single();
  if (!recipe) notFound();
  const r = recipe as Recipe;

  const { data: ing } = await supabase
    .from("recipe_ingredients")
    .select("*")
    .eq("recipe_id", id)
    .order("name");
  const ingredients = (ing ?? []) as RecipeIngredient[];

  const steps = (r.instructions ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/recipes" className="text-sm text-muted hover:text-brand">
          ← Back to recipes
        </Link>
        {isManager && (
          <div className="flex gap-2">
            <FormDialog
              trigger="Edit"
              title={`Edit ${r.name}`}
              action={updateRecipe}
              triggerClassName="btn-secondary"
            >
              <input type="hidden" name="id" value={r.id} />
              <RecipeFields recipe={r} ingredients={ingredients} />
            </FormDialog>
            <ConfirmButton
              action={deleteRecipe}
              confirm={`Delete recipe "${r.name}"?`}
              hidden={{ id: r.id }}
            >
              Delete
            </ConfirmButton>
          </div>
        )}
      </div>

      {r.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={r.image_url}
          alt={r.name}
          className="h-64 w-full rounded-xl object-cover"
        />
      )}

      <div>
        <h1 className="text-2xl font-semibold">{r.name}</h1>
        {r.category && <p className="text-sm text-muted">{r.category}</p>}
        {r.description && <p className="mt-2 text-foreground">{r.description}</p>}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="card p-5 md:col-span-1">
          <h2 className="mb-3 font-semibold">Ingredients</h2>
          {ingredients.length === 0 ? (
            <p className="text-sm text-muted">No ingredients listed.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {ingredients.map((i) => (
                <li key={i.id} className="flex justify-between gap-2">
                  <span>{i.name}</span>
                  <span className="text-muted tabular-nums">
                    {i.quantity ?? ""} {i.unit ?? ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-5 md:col-span-2">
          <h2 className="mb-3 font-semibold">Steps</h2>
          {steps.length === 0 ? (
            <p className="text-sm text-muted">No steps added.</p>
          ) : (
            <ol className="list-decimal space-y-2 pl-5 text-sm">
              {steps.map((s, idx) => (
                <li key={idx}>{s}</li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
