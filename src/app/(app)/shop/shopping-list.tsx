"use client";

import { useMemo, useState } from "react";
import { CopyButton } from "@/components/copy-button";
import { PrintButton } from "@/components/print-button";
import { needToOrder } from "@/lib/stock";

type ShopItem = {
  id: string;
  name: string;
  supplier: string;
  category: string | null;
  unit: string;
  current_qty: number;
  low_stock_threshold: number;
};

export function ShoppingList({ items }: { items: ShopItem[] }) {
  const vendors = useMemo(
    () => [...new Set(items.map((i) => i.supplier))].sort(),
    [items],
  );
  const [vendor, setVendor] = useState(vendors[0] ?? "");
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const list = useMemo(
    () =>
      items
        .filter((i) => i.supplier === vendor)
        .sort((a, b) => a.current_qty - b.current_qty),
    [items, vendor],
  );

  const groups = useMemo(() => {
    const m = new Map<string, ShopItem[]>();
    for (const it of list) {
      const k = it.category ?? "Other";
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(it);
    }
    return [...m.entries()];
  }, [list]);

  function toggle(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const pickedInVendor = list.filter((i) => checked.has(i.id)).length;

  const copyText = [
    `${vendor} shopping list — ${new Date().toLocaleDateString()}`,
    ...list
      .filter((i) => !checked.has(i.id))
      .map((i) => {
        const n = needToOrder(i.current_qty, i.low_stock_threshold);
        return `□ ${i.name}${n > 0 ? ` (buy ${n}+)` : ""}`;
      }),
  ].join("\n");

  if (vendors.length === 0) {
    return (
      <div className="card p-12 text-center">
        <div className="mb-2 text-4xl">🎉</div>
        <p className="font-semibold">Nothing to buy</p>
        <p className="text-sm text-muted">
          Every item is above its reorder minimum.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Vendor picker */}
      <div className="no-print flex flex-wrap gap-2">
        {vendors.map((v) => {
          const count = items.filter((i) => i.supplier === v).length;
          const active = v === vendor;
          return (
            <button
              key={v}
              type="button"
              onClick={() => setVendor(v)}
              className={`rounded-xl border px-4 py-2 text-sm font-bold transition-all ${
                active
                  ? "border-transparent text-white shadow"
                  : "border-border bg-card hover:border-sky"
              }`}
              style={
                active
                  ? {
                      backgroundImage:
                        "linear-gradient(135deg, var(--navy-2), var(--navy))",
                    }
                  : undefined
              }
            >
              {v}{" "}
              <span
                className={`ml-1 rounded-full px-1.5 text-xs ${
                  active ? "bg-white/20" : "bg-background text-muted"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold">
          🛒 {vendor}
          <span className="ml-2 text-sm font-medium text-muted">
            {pickedInVendor}/{list.length} picked
          </span>
        </h2>
        <div className="no-print flex gap-2">
          <CopyButton text={copyText} label="Copy list" />
          <PrintButton />
        </div>
      </div>

      <div className="space-y-5">
        {groups.map(([category, citems]) => (
          <section key={category}>
            <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
              {category}
            </h3>
            <div className="card divide-y divide-border">
              {citems.map((it) => {
                const isChecked = checked.has(it.id);
                const out = it.current_qty <= 0;
                const buy = needToOrder(it.current_qty, it.low_stock_threshold);
                return (
                  <button
                    key={it.id}
                    type="button"
                    onClick={() => toggle(it.id)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-background"
                  >
                    <span
                      className={`flex h-6 w-6 flex-none items-center justify-center rounded-md border ${
                        isChecked
                          ? "border-green bg-green text-white"
                          : "border-border bg-white"
                      }`}
                      style={
                        isChecked ? { backgroundColor: "var(--green)" } : undefined
                      }
                    >
                      {isChecked ? "✓" : ""}
                    </span>
                    <span
                      className={`flex-1 font-medium ${
                        isChecked ? "text-muted line-through" : ""
                      }`}
                    >
                      {it.name}
                    </span>
                    {!isChecked &&
                      (out ? (
                        <span className="badge bg-red-100 text-red-700">⛔ Out</span>
                      ) : (
                        <span className="badge bg-amber-100 text-amber-700 tabular-nums">
                          {it.current_qty} left
                        </span>
                      ))}
                    {!isChecked && buy > 0 && (
                      <span className="text-xs font-semibold text-navy">
                        buy {buy}+
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
