import Link from "next/link";
import { PageHeader, EmptyState } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { PrintButton } from "@/components/print-button";
import { CopyButton } from "@/components/copy-button";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import type { InventoryItem, ItemStock, Location } from "@/lib/types";
import { hasLocationAccess } from "@/lib/location-access";
import { saveCounts, setGlobalMinimum, unlockLocation } from "./actions";
import { ReorderRow } from "./reorder-row";

type Search = { loc?: string; view?: string; saved?: string; pin?: string };

const STALE_DAYS = 7;

function isStale(iso?: string): boolean {
  if (!iso) return true;
  return Date.now() - new Date(iso).getTime() > STALE_DAYS * 86400000;
}

function timeAgo(iso?: string): string {
  if (!iso) return "Never counted";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "Counted just now";
  if (mins < 60) return `Counted ${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `Counted ${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days === 1) return "Counted yesterday";
  if (days < 7) return `Counted ${days} days ago`;
  return `Counted ${new Date(iso).toLocaleDateString()}`;
}

function groupBySupplier(items: InventoryItem[]) {
  const groups = new Map<string, InventoryItem[]>();
  for (const it of items) {
    const key = it.supplier ?? "Other";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(it);
  }
  return [...groups.entries()];
}

function groupByCategory(items: InventoryItem[]) {
  const groups = new Map<string, InventoryItem[]>();
  for (const it of items) {
    const key = it.category ?? "Other";
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
  const { loc, view = "count", saved, pin } = await searchParams;
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

    const low = items
      .filter((i) => i.current_qty <= i.low_stock_threshold)
      .sort((a, b) => a.current_qty - b.current_qty); // out of stock first
    const outCount = low.filter((i) => i.current_qty <= 0).length;
    const currentMin = items.length ? items[0].low_stock_threshold : 3;

    return (
      <div>
        <PageHeader
          title="Stock Count"
          subtitle={
            outCount > 0
              ? `${outCount} out of stock · ${low.length} to reorder`
              : "What needs reordering across all locations"
          }
          action={
            low.length > 0 ? (
              <div className="no-print">
                <PrintButton>🖨️ Print order list</PrintButton>
              </div>
            ) : null
          }
        />
        <div className="mb-1 hidden text-sm text-muted print:block">
          Reorder list · {new Date().toLocaleDateString()} · items with total ≤{" "}
          {currentMin}
        </div>
        <div className="no-print mb-5 flex flex-wrap items-center gap-2">
          {tab("count", "Enter counts")}
          {tab("reorder", "Reorder report")}
        </div>

        {isManager && (
          <form
            action={setGlobalMinimum}
            className="no-print card mb-5 flex flex-wrap items-end gap-3 p-4"
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
            {groupBySupplier(low).map(([supplier, list]) => {
              const copyText = [
                `${supplier} order — ${new Date().toLocaleDateString()}`,
                ...list.map((it) => `${it.name}: ${it.current_qty} ${it.unit}`),
              ].join("\n");
              return (
              <section key={supplier}>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
                    {supplier} · {list.length} to order
                  </h2>
                  <div className="no-print">
                    <CopyButton text={copyText} />
                  </div>
                </div>
                <div className="card overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-background text-left text-muted">
                      <tr>
                        <th className="px-4 py-3 font-medium">Item</th>
                        {locations.map((l) => (
                          <th key={l.id} className="px-3 py-3 text-right font-medium" title={l.name}>
                            {l.code}
                          </th>
                        ))}
                        <th className="px-4 py-3 text-right font-medium">Total</th>
                        <th className="no-print px-3 py-3 text-right font-medium">
                          Restock
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((it) => (
                        <ReorderRow
                          key={it.id}
                          item={it}
                          locations={locations}
                          current={Object.fromEntries(byItem.get(it.id) ?? [])}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ------------------------------------------------------------------ COUNT
  const selected = locations.find((l) => l.id === loc) ?? null;

  // Most recent count time per location.
  const { data: tsData } = await supabase
    .from("item_stock")
    .select("location_id, updated_at");
  const lastCounted = new Map<string, string>();
  (tsData as { location_id: string; updated_at: string }[] | null)?.forEach(
    (r) => {
      const prev = lastCounted.get(r.location_id);
      if (!prev || r.updated_at > prev) lastCounted.set(r.location_id, r.updated_at);
    },
  );

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
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {locations.map((l) => {
          const active = selected?.id === l.id;
          const ts = lastCounted.get(l.id);
          const stale = isStale(ts);
          return (
            <Link
              key={l.id}
              href={`/stock?view=count&loc=${l.id}`}
              className={`rounded-xl border px-4 py-3 transition-all ${
                active
                  ? "border-transparent text-white shadow"
                  : stale
                    ? "border-amber-300 bg-amber-50 hover:border-amber-400"
                    : "border-border bg-card hover:border-brand-2"
              }`}
              style={
                active
                  ? { backgroundImage: "linear-gradient(135deg, var(--brand-2), var(--brand-dark))" }
                  : undefined
              }
            >
              <div className="font-semibold">{l.name}</div>
              <div
                className={`text-xs ${
                  active
                    ? "text-white/80"
                    : stale
                      ? "font-medium text-amber-700"
                      : "text-muted"
                }`}
              >
                {stale && "⚠️ "}
                {timeAgo(ts)}
              </div>
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
      ) : !isManager && !(await hasLocationAccess(selected.id)) ? (
        <div className="mx-auto max-w-sm">
          <div className="card p-6 text-center">
            <div className="mb-2 text-3xl">🔒</div>
            <h2 className="text-lg font-bold">{selected.name}</h2>
            <p className="mb-4 text-sm text-muted">
              Enter this location&apos;s PIN to count its stock.
            </p>
            <form action={unlockLocation} className="space-y-3">
              <input type="hidden" name="location_id" value={selected.id} />
              <input
                name="pin"
                inputMode="numeric"
                autoComplete="off"
                autoFocus
                placeholder="••••"
                className="input text-center text-2xl tracking-[0.5em]"
              />
              {pin === "bad" && (
                <p className="text-sm font-medium text-red">
                  Wrong PIN — try again.
                </p>
              )}
              <button type="submit" className="btn-primary w-full">
                Unlock
              </button>
            </form>
          </div>
        </div>
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

      <div className="space-y-8">
        {groupBySupplier(items).map(([supplier, list]) => (
          <section key={supplier}>
            <h2 className="mb-3 border-b border-border pb-1 text-base font-bold">
              {supplier}
            </h2>
            <div className="space-y-4">
              {groupByCategory(list).map(([category, citems]) => (
                <div key={category}>
                  <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
                    {category}
                  </h3>
                  <div className="card divide-y divide-border">
                    {citems.map((it) => (
                      <div
                        key={it.id}
                        className="flex items-center gap-3 px-4 py-2.5"
                      >
                        <div className="flex-1 font-medium">{it.name}</div>
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
