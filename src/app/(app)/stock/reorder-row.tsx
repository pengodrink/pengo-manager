"use client";

import { useState, useTransition } from "react";
import type { InventoryItem, Location } from "@/lib/types";
import { saveItemCounts } from "./actions";

export function ReorderRow({
  item,
  locations,
  current,
}: {
  item: InventoryItem;
  locations: Location[];
  current: Record<string, number>;
}) {
  const [vals, setVals] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      locations.map((l) => [l.id, String(current[l.id] ?? 0)]),
    ),
  );
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const total = locations.reduce((sum, l) => sum + (Number(vals[l.id]) || 0), 0);
  const stillLow = total <= item.low_stock_threshold;

  function save() {
    const fd = new FormData();
    fd.set("item_id", item.id);
    for (const l of locations) fd.set(`qty_${l.id}`, vals[l.id] ?? "0");
    startTransition(async () => {
      await saveItemCounts(fd);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <tr className="border-t border-border">
      <td className="px-4 py-2.5">
        <span className="font-semibold">{item.name}</span>
        {item.category && (
          <span className="ml-2 text-xs text-muted">{item.category}</span>
        )}
      </td>
      {locations.map((l) => (
        <td key={l.id} className="px-2 py-2">
          <input
            type="number"
            min="0"
            step="any"
            value={vals[l.id] ?? "0"}
            onChange={(e) =>
              setVals((v) => ({ ...v, [l.id]: e.target.value }))
            }
            className="input w-16 px-2 py-1 text-right tabular-nums"
            aria-label={`${item.name} at ${l.name}`}
          />
        </td>
      ))}
      <td className="px-3 py-2.5 text-right">
        <span
          className={`font-bold tabular-nums ${
            stillLow ? "text-red" : "text-green"
          }`}
        >
          {total} {item.unit}
        </span>
      </td>
      <td className="px-3 py-2.5 text-right">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className={saved ? "btn-secondary px-3 py-1.5" : "btn-primary px-3 py-1.5"}
        >
          {pending ? "Saving…" : saved ? "✓ Saved" : "Save"}
        </button>
      </td>
    </tr>
  );
}
