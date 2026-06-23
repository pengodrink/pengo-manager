import Link from "next/link";
import { PageHeader, EmptyState } from "@/components/ui";
import { FormDialog } from "@/components/form-dialog";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import type { Recipe } from "@/lib/types";
import { RecipeFields } from "./recipe-fields";
import { createRecipe } from "./actions";

export default async function RecipesPage() {
  const profile = await requireProfile();
  const isManager = profile.role === "manager";
  const supabase = await createClient();

  const { data } = await supabase.from("recipes").select("*").order("name");
  const recipes = (data ?? []) as Recipe[];

  // Group by category for display.
  const groups = new Map<string, Recipe[]>();
  for (const r of recipes) {
    const key = r.category ?? "Uncategorized";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(r);
  }

  return (
    <div>
      <PageHeader
        title="Recipes"
        subtitle="Drink recipes and prep steps for the team"
        action={
          isManager ? (
            <FormDialog
              trigger="+ New recipe"
              title="New recipe"
              action={createRecipe}
              submitLabel="Create recipe"
            >
              <RecipeFields />
            </FormDialog>
          ) : null
        }
      />

      {recipes.length === 0 ? (
        <EmptyState
          icon="📖"
          title="No recipes yet"
          hint={
            isManager
              ? "Add your first drink recipe so staff can follow it."
              : "Ask a manager to add recipes."
          }
        />
      ) : (
        <div className="space-y-8">
          {[...groups.entries()].map(([category, items]) => (
            <section key={category}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
                {category}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((r) => (
                  <Link
                    key={r.id}
                    href={`/recipes/${r.id}`}
                    className="card overflow-hidden transition-colors hover:border-brand"
                  >
                    {r.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={r.image_url}
                        alt={r.name}
                        className="h-40 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-40 w-full items-center justify-center bg-background text-4xl">
                        ☕
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="font-medium">{r.name}</h3>
                      {r.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-muted">
                          {r.description}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
