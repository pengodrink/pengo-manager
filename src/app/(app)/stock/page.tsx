import Link from "next/link";
import { PageHeader, EmptyState } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import type { InventoryItem, ItemStock, Location } from "@/lib/types";
import { saveCounts, setGlobalMinimum } from "./actions";

type Search = { loc?: string; view?: string; saved?: string };

function groupBySupplier(items: InventoryItem[]) {
  const groups = new Map<string, InventoryItem[]>();
  for (const it of items) {
    const key = it.supplier ?? "Other";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(it);
  }
  return [...groups.entries()];
}

export default async function StockPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const { loc, view = "count", saved } = await searchParams;
  const profile = await requireProfile();
  const isManager = profile.role === "manager";
  const supabase = await createClient();

  const { data: locationData } = await supabase
    .from("locations")
    .select("*")
    .order("sort_order");
  const locations = (locationData ?? []) as Location[];

  if (locations.length === 0) {
    return (
      <div>
        <PageHeader title="Stock Count" />
        <EmptyState
          icon="🧮"
          title="Locations not set up yet"
          hint="Run the 0002 migration in Supabase to create your locations and import items."
        />
      </div>
    );
  }

  const { data: itemData } = await supabase
    .from("inventory_items")
    .select("*")
    .order("supplier")
    .order("category")
    .order("name");
  const items = (itemData ?? []) as InventoryItem[];

  const tab = (v: string, label: string) => (
    <Link
      href={`/stock?view=${v}`}
      className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all ${
        view === v
          ? "text-white shadow"
          : "text-muted hover:bg-background hover:text-foreground"
      }`}
      style={
        view === v
          ? { backgroundImage: "linear-gradient(135deg, var(--brand-2), var(--brand-dark))" }
          : undefined
      }
    >
      {label}
    </Link>
  );

  // ---------------------------------------------------------------- REORDER
  if (view === "reorder") {
    const { data: stockData } = await supabase.from("item_stock").select("*");
    const stock = (stockData ?? []) as ItemStock[];
    const byItem = new Map<string, Map<string, number>>();
    for (const s of stock) {
      if (!byItem.has(s.item_id)) byItem.set(s.item_id, new Map());
      byItem.get(s.item_id)!.set(s.location_id, s.qty);
    }

    const low = items.filter((i) => i.current_qty <= i.low_stock_threshold);
    const currentMin = items.length ? items[0].low_stock_threshold : 3;

    return (
      <div>
        <PageHeader
          title="Stock Count"
          subtitle="What needs reordering across all locations"
        />
        <div className="mb-5 flex flex-wrap items-center gap-2">
          {tab("count", "Enter counts")}
          {tab("reorder", "Reorder report")}
        </div>

        {isManager && (
          <form
            action={setGlobalMinimum}
            className="card mb-5 flex flex-wrap items-end gap-3 p-4"
          >
            <div>
              <label className="label">Flag as low when total is at or below</label>
              <input
                name="minimum"
                type="number"
                min="0"
                step="1"
                defaultValue={currentMin}
                className="input w-28"
              />
            </div>
            <SubmitButton className="btn-secondary">Apply</SubmitButton>
            <p className="text-xs text-muted">Applies to every item.</p>
          </form>
        )}

        {low.length === 0 ? (
          <EmptyState
            icon="✅"
            title="Nothing to reorder"
            hint="Every item is above your reorder minimum."
          />
        ) : (
          <div className="space-y-6">
            {groupBySupplier(low).map(([supplier, list]) => (
              <section key={supplier}>
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
                  {supplier} · {list.length} to order
                </h2>
                <div className="card overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-background text-left text-muted">
                      <tr>
                        <th className="px-4 py-3 font-medium">Item</th>
                        {locations.map((l) => (
                          <th key={l.id} className="px-3 py-3 text-right font-medium">
                            {l.code}
                          </th>
                        ))}
                        <th className="px-4 py-3 text-right font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((it) => {
                        const m = byItem.get(it.id);
                        return (
                          <tr key={it.id} className="border-t border-border">
                            <td className="px-4 py-2.5">
                              <span className="font-medium">{it.name}</span>
                              {it.category && (
                                <span className="ml-2 text-xs text-muted">
                                  {it.category}
                                </span>
                              )}
                            </td>
                            {locations.map((l) => (
                              <td
                                key={l.id}
                                className="px-3 py-2.5 text-right tabular-nums text-muted"
                              >
                                {m?.get(l.id) ?? 0}
                              </td>
                            ))}
                            <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-amber-600">
                              {it.current_qty} {it.unit}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ------------------------------------------------------------------ COUNT
  const selected = locations.find((l) => l.id === loc) ?? null;

  return (
    <div>
      <PageHeader
        title="Stock Count"
        subtitle={
          selected
            ? `Entering counts for ${selected.name}`
            : "Pick your location, then enter what you currently have"
        }
      />
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {tab("count", "Enter counts")}
        {tab("reorder", "Reorder report")}
      </div>

      {/* Location picker */}
      <div className="mb-6 flex flex-wrap gap-2">
        {locations.map((l) => {
          const active = selected?.id === l.id;
          return (
            <Link
              key={l.id}
              href={`/stock?view=count&loc=${l.id}`}
              className={`rounded-xl border px-4 py-2 text-sm font-medium transition-all ${
                active
                  ? "border-transparent text-white shadow"
                  : "border-border bg-card hover:border-brand-2"
              }`}
              style={
                active
                  ? { backgroundImage: "linear-gradient(135deg, var(--brand-2), var(--brand-dark))" }
                  : undefined
              }
            >
              {l.name}
            </Link>
          );
        })}
      </div>

      {!selected ? (
        <EmptyState
          icon="📍"
          title="Choose a location above"
          hint="Then you'll see every item with a box to type your current count."
        />
      ) : items.length === 0 ? (
        <EmptyState icon="📦" title="No items yet" hint="Import items first." />
      ) : (
        <StockForm location={selected} items={items} saved={saved === "1"} />
      )}
    </div>
  );
}

async function StockForm({
  location,
  items,
  saved,
}: {
  location: Location;
  items: InventoryItem[];
  saved: boolean;
}) {
  const supabase = await createClient();
  const { data: stockData } = await supabase
    .from("item_stock")
    .select("item_id, qty")
    .eq("location_id", location.id);
  const current = new Map<string, number>();
  (stockData as { item_id: string; qty: number }[] | null)?.forEach((s) =>
    current.set(s.item_id, s.qty),
  );

  return (
    <form action={saveCounts}>
      <input type="hidden" name="location_id" value={location.id} />

      {saved && (
        <p className="mb-4 rounded-xl bg-green-50 px-4 py-2.5 text-sm font-medium text-green-700">
          ✓ Counts saved for {location.name}.
        </p>
      )}

      <div className="space-y-6">
        {groupBySupplier(items).map(([supplier, list]) => (
          <section key={supplier}>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
              {supplier}
            </h2>
            <div className="card divide-y divide-border">
              {list.map((it) => (
                <div
                  key={it.id}
                  className="flex items-center gap-3 px-4 py-2.5"
                >
                  <div className="flex-1">
                    <span className="font-medium">{it.name}</span>
                    {it.category && (
                      <span className="ml-2 text-xs text-muted">{it.category}</span>
                    )}
                  </div>
                  <span className="text-xs text-muted">{it.unit}</span>
                  <input
                    name={`qty_${it.id}`}
                    type="number"
                    step="any"
                    min="0"
                    defaultValue={current.get(it.id) ?? 0}
                    className="input w-24 text-right"
                  />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="sticky bottom-4 mt-6 flex justify-end">
        <SubmitButton pendingLabel="Saving counts…">
          Save counts for {location.name}
        </SubmitButton>
      </div>
    </form>
  );
}
