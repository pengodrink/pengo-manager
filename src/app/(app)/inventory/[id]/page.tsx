import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import type { InventoryItem, InventoryTransaction, Profile } from "@/lib/types";

const txLabel: Record<string, string> = {
  restock: "Restock",
  usage: "Usage",
  adjustment: "Adjustment",
};

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

  const { data: txs } = await supabase
    .from("inventory_transactions")
    .select("*")
    .eq("item_id", id)
    .order("created_at", { ascending: false })
    .limit(100);

  const transactions = (txs ?? []) as InventoryTransaction[];

  // Resolve who logged each transaction.
  const userIds = [
    ...new Set(transactions.map((t) => t.created_by).filter(Boolean)),
  ] as string[];
  const names = new Map<string, string>();
  if (userIds.length) {
    const { data: people } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", userIds);
    (people as Pick<Profile, "id" | "full_name">[] | null)?.forEach((p) =>
      names.set(p.id, p.full_name ?? "Staff"),
    );
  }

  const low = i.current_qty <= i.low_stock_threshold;

  return (
    <div className="space-y-6">
      <Link href="/inventory" className="text-sm text-muted hover:text-brand">
        ← Back to inventory
      </Link>

      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">{i.name}</h1>
            {i.category && <p className="text-sm text-muted">{i.category}</p>}
          </div>
          {low ? (
            <span className="badge bg-amber-100 text-amber-700">Low stock</span>
          ) : (
            <span className="badge bg-green-100 text-green-700">OK</span>
          )}
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <dt className="text-xs text-muted">In stock</dt>
            <dd className="text-lg font-semibold tabular-nums">
              {i.current_qty} {i.unit}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Low-stock alert at</dt>
            <dd className="text-lg font-semibold tabular-nums">
              {i.low_stock_threshold} {i.unit}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Cost / unit</dt>
            <dd className="text-lg font-semibold tabular-nums">
              {i.cost_per_unit != null ? `$${i.cost_per_unit}` : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Supplier</dt>
            <dd className="text-lg font-semibold">{i.supplier ?? "—"}</dd>
          </div>
        </dl>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">History</h2>
        {transactions.length === 0 ? (
          <p className="text-sm text-muted">No stock movements yet.</p>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-background text-left text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">When</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Change</th>
                  <th className="px-4 py-3 font-medium">By</th>
                  <th className="px-4 py-3 font-medium">Note</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id} className="border-t border-border">
                    <td className="px-4 py-3 text-muted">
                      {new Date(t.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">{txLabel[t.type] ?? t.type}</td>
                    <td
                      className={`px-4 py-3 tabular-nums font-medium ${
                        t.change_qty < 0 ? "text-red-600" : "text-green-700"
                      }`}
                    >
                      {t.change_qty > 0 ? "+" : ""}
                      {t.change_qty} {i.unit}
                    </td>
                    <td className="px-4 py-3">
                      {t.created_by ? names.get(t.created_by) ?? "Staff" : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted">{t.note ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
