"use client";

import { useState } from "react";
import type { Recipe, RecipeIngredient } from "@/lib/types";

type Row = { name: string; quantity: string; unit: string };

export function RecipeFields({
  recipe,
  ingredients,
}: {
  recipe?: Recipe;
  ingredients?: RecipeIngredient[];
}) {
  const [rows, setRows] = useState<Row[]>(
    ingredients && ingredients.length
      ? ingredients.map((i) => ({
          name: i.name,
          quantity: i.quantity != null ? String(i.quantity) : "",
          unit: i.unit ?? "",
        }))
      : [{ name: "", quantity: "", unit: "" }],
  );

  function update(idx: number, key: keyof Row, value: string) {
    setRows((r) =>
      r.map((row, i) => (i === idx ? { ...row, [key]: value } : row)),
    );
  }

  return (
    <>
      <div>
        <label className="label">Name</label>
        <input name="name" required defaultValue={recipe?.name} className="input" />
      </div>
      <div>
        <label className="label">Category</label>
        <input
          name="category"
          defaultValue={recipe?.category ?? ""}
          placeholder="e.g. Espresso, Iced, Tea"
          className="input"
        />
      </div>
      <div>
        <label className="label">Short description</label>
        <input
          name="description"
          defaultValue={recipe?.description ?? ""}
          className="input"
        />
      </div>

      <div>
        <label className="label">Ingredients</label>
        <div className="space-y-2">
          {rows.map((row, idx) => (
            <div key={idx} className="flex gap-2">
              <input
                name="ing_name"
                value={row.name}
                onChange={(e) => update(idx, "name", e.target.value)}
                placeholder="Ingredient"
                className="input flex-1"
              />
              <input
                name="ing_qty"
                value={row.quantity}
                onChange={(e) => update(idx, "quantity", e.target.value)}
                placeholder="Qty"
                type="number"
                step="any"
                className="input w-20"
              />
              <input
                name="ing_unit"
                value={row.unit}
                onChange={(e) => update(idx, "unit", e.target.value)}
                placeholder="Unit"
                className="input w-24"
              />
              <button
                type="button"
                onClick={() => setRows((r) => r.filter((_, i) => i !== idx))}
                className="btn-secondary px-3"
                aria-label="Remove ingredient"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() =>
            setRows((r) => [...r, { name: "", quantity: "", unit: "" }])
          }
          className="btn-secondary mt-2 px-3 py-1.5"
        >
          + Add ingredient
        </button>
      </div>

      <div>
        <label className="label">Steps</label>
        <textarea
          name="instructions"
          rows={5}
          defaultValue={recipe?.instructions ?? ""}
          placeholder={"One step per line…"}
          className="input"
        />
      </div>

      <div>
        <label className="label">Photo (optional)</label>
        <input
          name="image"
          type="file"
          accept="image/*"
          className="input file:mr-3 file:rounded file:border-0 file:bg-brand file:px-3 file:py-1 file:text-white"
        />
        {recipe?.image_url && (
          <p className="mt-1 text-xs text-muted">
            Leave empty to keep the current photo.
          </p>
        )}
      </div>
    </>
  );
}
