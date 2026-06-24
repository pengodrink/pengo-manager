"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FormDialog } from "@/components/form-dialog";
import { ConfirmButton } from "@/components/confirm-button";
import type { InventoryItem } from "@/lib/types";
import {
  createItem,
  updateItem,
  deleteItem,
  logTransaction,
} from "./actions";

function ItemFields({ item }: { item?: InventoryItem }) {
  return (
    <>
      <div>
        <label className="label">Name</label>
        <input name="name" required defaultValue={item?.name} className="input" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Category</label>
          <input
            name="category"
            defaultValue={item?.category ?? ""}
            placeholder="e.g. Beans, Milk, Syrup"
            className="input"
          />
        </div>
        <div>
          <label className="label">Unit</label>
          <input
            name="unit"
            defaultValue={item?.unit ?? "pcs"}
            placeholder="kg, L, pcs"
            className="input"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {!item && (
          <div>
            <label className="label">Starting quantity</label>
            <input
              name="current_qty"
              type="number"
              step="any"
              defaultValue={0}
              className="input"
            />
          </div>
        )}
        <div>
          <label className="label">Low-stock alert at</label>
          <input
            name="low_stock_threshold"
            type="number"
            step="any"
            defaultValue={item?.low_stock_threshold ?? 0}
            className="input"
          />
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
        <div>
          <label className="label">Supplier</label>
          <input
            name="supplier"
            defaultValue={item?.supplier ?? ""}
            className="input"
          />
        </div>
      </div>
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

function StockFields({ type }: { type: "restock" | "usage" }) {
  return (
    <>
      <div>
        <label className="label">
          {type === "restock" ? "Quantity received" : "Quantity used"}
        </label>
        <input
          name="amount"
          type="number"
          step="any"
          min="0"
          required
          className="input"
        />
      </div>
      <div>
        <label className="label">Note (optional)</label>
        <input name="note" className="input" />
      </div>
    </>
  );
}

export function InventoryTable({
  items,
  isManager,
}: {
  items: InventoryItem[];
  isManager: boolean;
}) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return items;
    return items.filter(
      (i) =>
        i.name.toLowerCase().includes(term) ||
        (i.category ?? "").toLowerCase().includes(term),
    );
  }, [items, q]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search items…"
          className="input max-w-xs"
        />
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-background text-left text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Item</th>
              <th className="px-4 py-3 font-medium">In stock</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => {
              const low = item.current_qty <= item.low_stock_threshold;
              return (
                <tr key={item.id} className="border-t border-border">
                  <td className="px-4 py-3">
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
                  <td className="px-4 py-3 tabular-nums">
                    {item.current_qty} {item.unit}
                  </td>
                  <td className="px-4 py-3">
                    {low ? (
                      <span className="badge bg-amber-100 text-amber-700">
                        Low stock
                      </span>
                    ) : (
                      <span className="badge bg-green-100 text-green-700">
                        OK
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-2">
                      <FormDialog
                        trigger="Restock"
                        title={`Restock ${item.name}`}
                        action={logTransaction}
                        triggerClassName="btn-secondary px-3 py-1.5"
                        submitLabel="Add stock"
                      >
                        <input type="hidden" name="item_id" value={item.id} />
                        <input type="hidden" name="type" value="restock" />
                        <StockFields type="restock" />
                      </FormDialog>
                      <FormDialog
                        trigger="Use"
                        title={`Log usage — ${item.name}`}
                        action={logTransaction}
                        triggerClassName="btn-secondary px-3 py-1.5"
                        submitLabel="Log usage"
                      >
                        <input type="hidden" name="item_id" value={item.id} />
                        <input type="hidden" name="type" value="usage" />
                        <StockFields type="usage" />
                      </FormDialog>
                      {isManager && (
                        <>
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
                            confirm={`Delete "${item.name}"? This also removes its history.`}
                            className="btn-danger px-3 py-1.5"
                            hidden={{ id: item.id }}
                          >
                            Delete
                          </ConfirmButton>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
