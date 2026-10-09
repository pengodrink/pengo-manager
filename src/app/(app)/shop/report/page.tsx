import Link from "next/link";
import { PageHeader, EmptyState } from "@/components/ui";
import { PrintButton } from "@/components/print-button";
import { CopyButton } from "@/components/copy-button";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { scopeFor } from "@/lib/scope";
import { needToOrder, stockStatus, STATUS_BADGE } from "@/lib/stock";
import type { InventoryItem, ItemStock, Location } from "@/lib/types";

type Row = {
  item: InventoryItem;
  total: number;
  outLocs: Location[];
  perLoc: { loc: Location; qty: number }[];
  tier: 1 | 2 | 3;
};

const TIERS: Record<1 | 2 | 3, { title: string; hint: string; tone: string }> = {
  1: {
    title: "🔴 Out of stock everywhere",
    hint: "Buy first — none left anywhere.",
    tone: "text-red",
  },
  2: {
    title: "🟠 Out at some locations",
    hint: "Still in stock elsewhere — restock the empty locations.",
    tone: "text-amber-600",
  },
  3: {
    title: "🟡 Running low",
    hint: "Not out yet — buy soon.",
    tone: "text-amber-500",
  },
};

export default async function ShopReportPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const scope = await scopeFor(supabase, profile);

  const [{ data: itemData }, { data: locData }, { data: stockData }] =
    await Promise.all([
      supabase.from("inventory_items").select("*"),
      supabase.from("locations").select("*").order("sort_order"),
      supabase.from("item_stock").select("item_id, location_id, qty"),
    ]);

  const allLocs = (locData ?? []) as Location[];
  // Staff only ever see their own location.
  const locs = scope ? allLocs.filter((l) => l.id === scope.locationId) : allLocs;
  const locById = new Map(locs.map((l) => [l.id, l]));

  const stock = new Map<string, Map<string, number>>();
  for (const r of (stockData ?? []) as Pick<
    ItemStock,
    "item_id" | "location_id" | "qty"
  >[]) {
    if (!locById.has(r.location_id)) continue;
    if (!stock.has(r.item_id)) stock.set(r.item_id, new Map());
    stock.get(r.item_id)!.set(r.location_id, Number(r.qty));
  }

  const rows: Row[] = [];
  for (const item of (itemData ?? []) as InventoryItem[]) {
    if (item.supplier?.trim().toLowerCase() === "le chef") continue; // not on this report
    const m = stock.get(item.id);
    if (!m || m.size === 0) continue; // not carried at any location you can see
    const perLoc = locs
      .filter((l) => m.has(l.id)) // only locations that carry it
      .map((l) => ({ loc: l, qty: m.get(l.id) ?? 0 }));
    const total = perLoc.reduce((s, p) => s + p.qty, 0);
    const outLocs = perLoc.filter((p) => p.qty <= 0).map((p) => p.loc);

    let tier: 1 | 2 | 3 | null = null;
    if (total <= 0) tier = 1;
    else if (outLocs.length > 0) tier = 2;
    else if (total <= item.low_stock_threshold) tier = 3;
    if (!tier) continue;
    rows.push({ item, total, outLocs, perLoc, tier });
  }

  // Most urgent first.
  rows.sort((a, b) => {
    if (a.tier !== b.tier) return a.tier - b.tier;
    if (a.tier === 1) {
      return (
        b.perLoc.length - a.perLoc.length || a.item.name.localeCompare(b.item.name)
      );
    }
    if (a.tier === 2) {
      return (
        b.outLocs.length - a.outLocs.length ||
        a.total - b.total ||
        a.item.name.localeCompare(b.item.name)
      );
    }
    return a.total - b.total || a.item.name.localeCompare(b.item.name);
  });

  const generated = new Date().toLocaleString();
  const where = scope ? locs[0]?.name ?? "your location" : "All locations";

  const buyFor = (r: Row) =>
    r.tier === 2
      ? `restock ${r.outLocs.map((l) => l.code).join(", ")}`
      : `buy ${Math.max(needToOrder(r.total, r.item.low_stock_threshold), 1)}+`;

  const copyText = [
    `Pengo — what to buy (${where}) — ${generated}`,
    ...([1, 2, 3] as const).flatMap((t) => {
      const list = rows.filter((r) => r.tier === t);
      if (!list.length) return [];
      return [
        "",
        TIERS[t].title.replace(/[🔴🟠🟡]\s?/u, "").toUpperCase(),
        ...list.map(
          (r, i) =>
            `${i + 1}. ${r.item.name}${r.item.supplier ? ` (${r.item.supplier})` : ""} — ${r.perLoc
              .map((p) => `${p.loc.code} ${p.qty}`)
              .join(", ")} — ${buyFor(r)}`,
        ),
      ];
    }),
  ].join("\n");

  return (
    <div>
      <PageHeader
        title="What to buy — report"
        subtitle={`${where} · generated ${generated}`}
        action={
          <div className="no-print flex flex-wrap gap-2">
            <Link href="/shop" className="btn-secondary">
              ← Shopping list
            </Link>
            {rows.length > 0 && (
              <>
                <CopyButton text={copyText} label="Copy report" className="btn-secondary" />
                <PrintButton className="btn-primary">🖨️ Print</PrintButton>
              </>
            )}
          </div>
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          icon="🎉"
          title="Nothing to buy"
          hint="Everything is stocked at every location."
        />
      ) : (
        <div className="space-y-8">
          <p className="text-sm text-muted">
            {rows.length} item{rows.length === 1 ? "" : "s"} to buy ·{" "}
            {rows.filter((r) => r.tier === 1).length} out everywhere ·{" "}
            {rows.filter((r) => r.tier === 2).length} out at some locations ·{" "}
            {rows.filter((r) => r.tier === 3).length} running low
          </p>

          {([1, 2, 3] as const).map((t) => {
            const list = rows.filter((r) => r.tier === t);
            if (!list.length) return null;
            return (
              <section key={t}>
                <h2 className={`text-lg font-bold ${TIERS[t].tone}`}>
                  {TIERS[t].title}{" "}
                  <span className="text-sm font-medium text-muted">
                    ({list.length})
                  </span>
                </h2>
                <p className="mb-2 text-sm text-muted">{TIERS[t].hint}</p>
                <div className="card overflow-hidden">
                  {list.map((r, idx) => (
                    <div
                      key={r.item.id}
                      className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border px-4 py-3 first:border-t-0"
                    >
                      <span className="w-7 text-sm font-bold tabular-nums text-muted">
                        {idx + 1}.
                      </span>
                      <div className="min-w-[10rem] flex-1">
                        <Link
                          href={`/inventory/${r.item.id}`}
                          className="font-semibold hover:text-brand"
                        >
                          {r.item.name}
                        </Link>
                        <div className="text-xs text-muted">
                          {r.item.supplier ?? "No vendor yet"}
                          {r.item.category ? ` · ${r.item.category}` : ""}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {r.perLoc.map((p) => {
                          const st = stockStatus(p.qty, r.item.low_stock_threshold);
                          return (
                            <span
                              key={p.loc.id}
                              title={p.loc.name}
                              className={`badge text-[11px] ${STATUS_BADGE[st]}`}
                            >
                              {p.loc.code} · {p.qty}
                            </span>
                          );
                        })}
                      </div>
                      <span className="w-28 text-right text-sm font-bold text-navy">
                        {buyFor(r)}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
