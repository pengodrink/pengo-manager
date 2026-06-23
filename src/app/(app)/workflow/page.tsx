import { PageHeader, EmptyState } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import type {
  Shift,
  TaskCompletion,
  WorkflowTask,
  Profile,
} from "@/lib/types";
import { Checklist, type TaskView } from "./checklist";

export default async function WorkflowPage() {
  const profile = await requireProfile();
  const isManager = profile.role === "manager";
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: taskData } = await supabase
    .from("workflow_tasks")
    .select("*")
    .eq("active", true)
    .order("created_at");
  const tasks = (taskData ?? []) as WorkflowTask[];

  const { data: completionData } = await supabase
    .from("task_completions")
    .select("*")
    .eq("business_date", today);
  const completions = (completionData ?? []) as TaskCompletion[];

  // Resolve names of people who completed tasks.
  const userIds = [
    ...new Set(completions.map((c) => c.completed_by).filter(Boolean)),
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

  const completedBy = new Map<string, string | null>();
  for (const c of completions) {
    completedBy.set(
      c.task_id,
      c.completed_by ? names.get(c.completed_by) ?? "Staff" : null,
    );
  }

  const groups: Record<Shift, TaskView[]> = {
    opening: [],
    anytime: [],
    closing: [],
  };
  for (const t of tasks) {
    const done = completedBy.has(t.id);
    groups[t.shift].push({
      ...t,
      done,
      completedByName: done ? completedBy.get(t.id) ?? null : null,
    });
  }

  const total = tasks.length;
  const doneTotal = completions.length;

  return (
    <div>
      <PageHeader
        title="Today's Workflow"
        subtitle={
          total
            ? `${doneTotal}/${total} tasks done · ${new Date().toLocaleDateString()}`
            : "Opening and closing checklists for the team"
        }
      />
      {total === 0 ? (
        <EmptyState
          icon="✅"
          title="No tasks set up"
          hint={
            isManager
              ? "Add opening and closing tasks for your team to check off each day."
              : "Ask a manager to set up the daily checklist."
          }
        />
      ) : (
        <Checklist groups={groups} isManager={isManager} />
      )}
    </div>
  );
}
