import Link from "next/link";
import { PageHeader, StatCard } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import type { InventoryItem, TaskCompletion, WorkflowTask } from "@/lib/types";

export default async function DashboardPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: itemData }, { data: taskData }, { data: completionData }] =
    await Promise.all([
      supabase.from("inventory_items").select("*").order("name"),
      supabase.from("workflow_tasks").select("*").eq("active", true),
      supabase
        .from("task_completions")
        .select("task_id")
        .eq("business_date", today),
    ]);

  const items = (itemData ?? []) as InventoryItem[];
  const tasks = (taskData ?? []) as WorkflowTask[];
  const completions = (completionData ?? []) as Pick<TaskCompletion, "task_id">[];

  const outOfStock = items.filter((i) => i.current_qty <= 0);
  const lowStock = items.filter(
    (i) => i.current_qty > 0 && i.current_qty <= i.low_stock_threshold,
  );
  // Out-of-stock first (most urgent), then low.
  const needsAttention = [...outOfStock, ...lowStock];
  const doneIds = new Set(completions.map((c) => c.task_id));
  const remainingTasks = tasks.filter((t) => !doneIds.has(t.id));

  const firstName = (profile.full_name ?? "there").split(" ")[0];

  return (
    <div>
      <PageHeader
        title={`Hi, ${firstName} 👋`}
        subtitle="Here's what needs attention today"
      />

      {outOfStock.length > 0 && (
        <details className="group mb-3">
          <summary className="flex cursor-pointer list-none items-center gap-3 rounded-2xl border-2 border-red-300 bg-red-50 px-5 py-4 transition-colors hover:bg-red-100 [&::-webkit-details-marker]:hidden">
            <span className="text-2xl">⛔</span>
            <div className="flex-1">
              <div className="font-extrabold text-red-700">
                URGENT — {outOfStock.length} item{outOfStock.length === 1 ? " is" : "s are"} OUT of stock
              </div>
              <div className="text-sm text-red-600">
                Tap to see the list and restock.
              </div>
            </div>
            <span className="text-red-400 transition-transform group-open:rotate-180">
              ▾
            </span>
          </summary>
          <div className="card mt-2 max-h-96 divide-y divide-border overflow-y-auto">
            {outOfStock.map((i) => (
              <Link
                key={i.id}
                href={`/inventory/${i.id}`}
                className="flex items-center justify-between p-4 hover:bg-background"
              >
                <span className="font-medium">
                  {i.name}
                  {i.supplier && (
                    <span className="ml-2 text-xs text-muted">{i.supplier}</span>
                  )}
                </span>
                <span className="badge bg-red-100 text-red-700">⛔ Out of stock</span>
              </Link>
            ))}
          </div>
        </details>
      )}

      {lowStock.length > 0 && (
        <details className="group mb-6">
          <summary className="flex cursor-pointer list-none items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 transition-colors hover:bg-amber-100 [&::-webkit-details-marker]:hidden">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1">
              <div className="font-bold text-amber-700">
                {lowStock.length} item{lowStock.length === 1 ? "" : "s"} low on stock
              </div>
              <div className="text-sm text-amber-600">
                Tap to see the list — running low.
              </div>
            </div>
            <span className="text-amber-400 transition-transform group-open:rotate-180">
              ▾
            </span>
          </summary>
          <div className="card mt-2 max-h-96 divide-y divide-border overflow-y-auto">
            {lowStock.map((i) => (
              <Link
                key={i.id}
                href={`/inventory/${i.id}`}
                className="flex items-center justify-between p-4 hover:bg-background"
              >
                <span className="font-medium">
                  {i.name}
                  {i.supplier && (
                    <span className="ml-2 text-xs text-muted">{i.supplier}</span>
                  )}
                </span>
                <span className="badge bg-amber-100 text-amber-700 tabular-nums">
                  {i.current_qty} {i.unit} left
                </span>
              </Link>
            ))}
          </div>
        </details>
      )}

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Out of stock"
          value={outOfStock.length}
          href="/inventory"
          icon="⛔"
          accent={outOfStock.length > 0 ? "red" : "green"}
          tone={outOfStock.length > 0 ? "warn" : "default"}
        />
        <StatCard
          label="Low / reorder"
          value={lowStock.length}
          href="/stock?view=reorder"
          icon="⚠️"
          accent={lowStock.length > 0 ? "gold" : "green"}
        />
        <StatCard
          label="Tasks left today"
          value={remainingTasks.length}
          href="/workflow"
          icon="📋"
          accent={remainingTasks.length > 0 ? "gold" : "green"}
        />
        <StatCard
          label="Items tracked"
          value={items.length}
          href="/inventory"
          icon="📦"
          accent="sky"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">⚠️ Needs attention</h2>
            <Link href="/stock?view=reorder" className="text-sm text-brand">
              Reorder report
            </Link>
          </div>
          <div className="card divide-y divide-border">
            {needsAttention.length === 0 ? (
              <p className="p-4 text-sm text-muted">
                Everything is well stocked. 🎉
              </p>
            ) : (
              needsAttention.slice(0, 10).map((i) => {
                const out = i.current_qty <= 0;
                return (
                  <Link
                    key={i.id}
                    href={`/inventory/${i.id}`}
                    className="flex items-center justify-between p-4 hover:bg-background"
                  >
                    <span className="font-medium">{i.name}</span>
                    <span
                      className={`badge tabular-nums ${
                        out
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {out ? "⛔ Out of stock" : `${i.current_qty} ${i.unit} left`}
                    </span>
                  </Link>
                );
              })
            )}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">📋 Tasks to do</h2>
            <Link href="/workflow" className="text-sm text-brand">
              Open checklist
            </Link>
          </div>
          <div className="card divide-y divide-border">
            {tasks.length === 0 ? (
              <p className="p-4 text-sm text-muted">No tasks set up yet.</p>
            ) : remainingTasks.length === 0 ? (
              <p className="p-4 text-sm text-muted">
                All tasks done for today. 🎉
              </p>
            ) : (
              remainingTasks.slice(0, 8).map((t) => (
                <div key={t.id} className="flex items-center gap-3 p-4">
                  <span className="capitalize badge bg-background text-muted">
                    {t.shift}
                  </span>
                  <span className="font-medium">{t.title}</span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
