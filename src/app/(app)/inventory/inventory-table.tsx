"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FormDialog } from "@/components/form-dialog";
import { ConfirmButton } from "@/components/confirm-button";
import type { InventoryItem, Location } from "@/lib/types";
import { stockStatus, STATUS_LABEL, STATUS_BADGE } from "@/lib/stock";
import { createItem, updateItem, deleteItem } from "./actions";

function ItemFields({ item }: { item?: InventoryItem }) {
  return (
    <>
      <div>
        <label className="label">Name</label>
        <input name="name" required defaultValue={item?.name} className="input" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Supplier</label>
          <input
            name="supplier"
            defaultValue={item?.supplier ?? ""}
            placeholder="e.g. Costco, Lollicup"
            className="input"
          />
        </div>
        <div>
          <label className="label">Category</label>
          <input
            name="category"
            defaultValue={item?.category ?? ""}
            placeholder="e.g. Fruit, Dairy"
            className="input"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Unit</label>
          <input
            name="unit"
            defaultValue={item?.unit ?? "Unit"}
            placeholder="Case, Unit, kg…"
            className="input"
          />
        </div>
        <div>
          <label className="label">Reorder at (total ≤)</label>
          <input
            name="low_stock_threshold"
            type="number"
            step="any"
            defaultValue={item?.low_stock_threshold ?? 3}
            className="input"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Full level (per location)</label>
          <input
            name="full_level"
            type="number"
            step="any"
            defaultValue={item?.full_level ?? 6}
            className="input"
          />
          <p className="mt-1 text-xs text-muted">
            Double-tap a location fills it to this.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Cost per unit</label>
          <input
            name="cost_per_unit"
            type="number"
            step="any"
            defaultValue={item?.cost_per_unit ?? ""}
            className="input"
          />
        </div>
      </div>
      <p className="text-xs text-muted">
        Stock counts are entered per location on the Stock Count page.
      </p>
    </>
  );
}

export function AddItemDialog() {
  return (
    <FormDialog
      trigger="+ Add item"
      title="Add inventory item"
      action={createItem}
      submitLabel="Add item"
    >
      <ItemFields />
    </FormDialog>
  );
}

export function InventoryTable({
  items,
  locations,
  stock,
  isManager,
}: {
  items: InventoryItem[];
  locations: Location[];
  stock: Record<string, Record<string, number>>;
  isManager: boolean;
}) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return items;
    return items.filter(
      (i) =>
        i.name.toLowerCase().includes(term) ||
        (i.category ?? "").toLowerCase().includes(term) ||
        (i.supplier ?? "").toLowerCase().includes(term),
    );
  }, [items, q]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by item, category or supplier…"
          className="input max-w-sm"
        />
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-background text-left text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Item</th>
              <th className="px-3 py-3 font-medium">Supplier</th>
              {locations.map((l) => (
                <th key={l.id} className="px-3 py-3 text-right font-medium" title={l.name}>
                  {l.code}
                </th>
              ))}
              <th className="px-3 py-3 text-right font-medium">Total</th>
              <th className="px-3 py-3 font-medium">Status</th>
              {isManager && <th className="px-4 py-3 text-right font-medium">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => {
              const status = stockStatus(
                item.current_qty,
                item.low_stock_threshold,
              );
              const perLoc = stock[item.id] ?? {};
              return (
                <tr key={item.id} className="border-t border-border">
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/inventory/${item.id}`}
                      className="font-medium hover:text-brand"
                    >
                      {item.name}
                    </Link>
                    {item.category && (
                      <div className="text-xs text-muted">{item.category}</div>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-muted">{item.supplier ?? "—"}</td>
                  {locations.map((l) => (
                    <td
                      key={l.id}
                      className="px-3 py-2.5 text-right tabular-nums text-muted"
                    >
                      {perLoc[l.id] ?? 0}
                    </td>
                  ))}
                  <td
                    className={`px-3 py-2.5 text-right font-semibold tabular-nums ${
                      status === "out" ? "text-red" : ""
                    }`}
                  >
                    {item.current_qty}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`badge ${STATUS_BADGE[status]}`}>
                      {status === "out" && "⛔ "}
                      {STATUS_LABEL[status]}
                    </span>
                  </td>
                  {isManager && (
                    <td className="px-4 py-2.5">
                      <div className="flex flex-wrap justify-end gap-2">
                        <FormDialog
                          trigger="Edit"
                          title={`Edit ${item.name}`}
                          action={updateItem}
                          triggerClassName="btn-secondary px-3 py-1.5"
                        >
                          <input type="hidden" name="id" value={item.id} />
                          <ItemFields item={item} />
                        </FormDialog>
                        <ConfirmButton
                          action={deleteItem}
                          confirm={`Delete "${item.name}"?`}
                          className="btn-danger px-3 py-1.5"
                          hidden={{ id: item.id }}
                        >
                          Delete
                        </ConfirmButton>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
