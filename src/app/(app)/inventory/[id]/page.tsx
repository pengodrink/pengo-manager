import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import type { InventoryItem, ItemStock, Location } from "@/lib/types";

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

  const low = i.current_qty <= i.low_stock_threshold;

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
          {low ? (
            <span className="badge bg-amber-100 text-amber-700">Reorder</span>
          ) : (
            <span className="badge bg-green-100 text-green-700">OK</span>
          )}
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

      <div>
        <h2 className="mb-3 text-lg font-semibold">By location</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {locations.map((l) => {
            const s = stock.get(l.id);
            return (
              <div key={l.id} className="card p-5">
                <div className="text-sm text-muted">{l.name}</div>
                <div className="mt-1 text-2xl font-bold tabular-nums">
                  {s?.qty ?? 0}{" "}
                  <span className="text-base font-normal text-muted">{i.unit}</span>
                </div>
                {s?.updated_at && (
                  <div className="mt-1 text-xs text-muted">
                    Updated {new Date(s.updated_at).toLocaleDateString()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-sm text-muted">
          Update these on the{" "}
          <Link href="/stock" className="font-medium text-brand">
            Stock Count
          </Link>{" "}
          page.
        </p>
      </div>
    </div>
  );
}
