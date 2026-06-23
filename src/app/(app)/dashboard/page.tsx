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

  const lowStock = items.filter(
    (i) => i.current_qty <= i.low_stock_threshold,
  );
  const doneIds = new Set(completions.map((c) => c.task_id));
  const remainingTasks = tasks.filter((t) => !doneIds.has(t.id));

  const firstName = (profile.full_name ?? "there").split(" ")[0];

  return (
    <div>
      <PageHeader
        title={`Hi, ${firstName} 👋`}
        subtitle="Here's what needs attention today"
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Low-stock items"
          value={lowStock.length}
          href="/inventory"
          tone={lowStock.length > 0 ? "warn" : "default"}
        />
        <StatCard
          label="Tasks left today"
          value={remainingTasks.length}
          href="/workflow"
          tone={remainingTasks.length > 0 ? "warn" : "default"}
        />
        <StatCard
          label="Items tracked"
          value={items.length}
          href="/inventory"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">⚠️ Low on stock</h2>
            <Link href="/inventory" className="text-sm text-brand">
              View all
            </Link>
          </div>
          <div className="card divide-y divide-border">
            {lowStock.length === 0 ? (
              <p className="p-4 text-sm text-muted">
                Everything is well stocked. 🎉
              </p>
            ) : (
              lowStock.slice(0, 8).map((i) => (
                <Link
                  key={i.id}
                  href={`/inventory/${i.id}`}
                  className="flex items-center justify-between p-4 hover:bg-background"
                >
                  <span className="font-medium">{i.name}</span>
                  <span className="badge bg-amber-100 text-amber-700 tabular-nums">
                    {i.current_qty} {i.unit} left
                  </span>
                </Link>
              ))
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
