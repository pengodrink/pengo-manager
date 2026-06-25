import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import type { InventoryItem, ItemStock, Location } from "@/lib/types";
import {
  stockStatus,
  STATUS_LABEL,
  STATUS_BADGE,
  needToOrder,
} from "@/lib/stock";
import { LocationCard } from "./location-card";

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireProfile();
  const supabase = await createClient();

  const { data: item } = await supabase
    .from("inventory_items")
    .select("*")
    .eq("id", id)
    .single();

  if (!item) notFound();
  const i = item as InventoryItem;

  const [{ data: locationData }, { data: stockData }] = await Promise.all([
    supabase.from("locations").select("*").order("sort_order"),
    supabase.from("item_stock").select("location_id, qty, updated_at").eq("item_id", id),
  ]);
  const locations = (locationData ?? []) as Location[];
  const stock = new Map<string, { qty: number; updated_at: string }>();
  (stockData as Pick<ItemStock, "location_id" | "qty" | "updated_at">[] | null)?.forEach(
    (s) => stock.set(s.location_id, { qty: s.qty, updated_at: s.updated_at }),
  );

  const status = stockStatus(i.current_qty, i.low_stock_threshold);
  const need = needToOrder(i.current_qty, i.low_stock_threshold);

  return (
    <div className="space-y-6">
      <Link href="/inventory" className="text-sm text-muted hover:text-brand">
        ← Back to inventory
      </Link>

      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{i.name}</h1>
            <p className="text-sm text-muted">
              {[i.supplier, i.category].filter(Boolean).join(" · ") || "Uncategorized"}
            </p>
          </div>
          <span className={`badge ${STATUS_BADGE[status]}`}>
            {status === "out" && "⛔ "}
            {STATUS_LABEL[status]}
          </span>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <dt className="text-xs text-muted">Total in stock</dt>
            <dd className="text-lg font-semibold tabular-nums">
              {i.current_qty} {i.unit}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Reorder at (≤)</dt>
            <dd className="text-lg font-semibold tabular-nums">
              {i.low_stock_threshold}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Unit</dt>
            <dd className="text-lg font-semibold">{i.unit}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Cost / unit</dt>
            <dd className="text-lg font-semibold tabular-nums">
              {i.cost_per_unit != null ? `$${i.cost_per_unit}` : "—"}
            </dd>
          </div>
        </dl>
      </div>

      {/* Need to order — prominent, with current shown smaller alongside */}
      <div
        className={`card flex items-end gap-5 p-6 ${
          need > 0 ? "border-2" : ""
        }`}
        style={need > 0 ? { borderColor: "var(--red)" } : undefined}
      >
        <div>
          <div className="text-sm font-semibold text-muted">Need to order</div>
          <div
            className={`text-5xl font-extrabold tabular-nums ${
              need > 0 ? "text-red" : "text-green"
            }`}
          >
            {need} <span className="text-2xl font-bold">{i.unit}</span>
          </div>
        </div>
        <div className="pb-1">
          <div className="text-xs text-muted">current in stock</div>
          <div className="text-lg font-semibold tabular-nums text-muted">
            {i.current_qty} {i.unit}
          </div>
        </div>
        {need === 0 && (
          <div className="ml-auto pb-2 text-sm font-medium text-green">
            ✓ Above the reorder minimum
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-1 text-lg font-semibold">By location</h2>
        <p className="mb-3 text-sm text-muted">
          Tap a location to enter a count · double-tap to fill it to{" "}
          {i.full_level}.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {locations.map((l) => {
            const s = stock.get(l.id);
            return (
              <LocationCard
                key={l.id}
                itemId={i.id}
                unit={i.unit}
                locationId={l.id}
                locationName={l.name}
                qty={s?.qty ?? 0}
                updatedAt={s?.updated_at ?? null}
                fullLevel={i.full_level}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
