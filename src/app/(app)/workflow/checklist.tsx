"use client";

import { useTransition } from "react";
import { FormDialog } from "@/components/form-dialog";
import { ConfirmButton } from "@/components/confirm-button";
import type { Shift, WorkflowTask } from "@/lib/types";
import { createTask, updateTask, deleteTask, toggleTask } from "./actions";

export type TaskView = WorkflowTask & {
  done: boolean;
  completedByName: string | null;
};

const SHIFT_LABELS: Record<Shift, string> = {
  opening: "Opening",
  closing: "Closing",
  anytime: "Anytime",
};

function ShiftField({ value }: { value?: Shift }) {
  return (
    <div>
      <label className="label">Shift</label>
      <select name="shift" defaultValue={value ?? "anytime"} className="input">
        <option value="opening">Opening</option>
        <option value="closing">Closing</option>
        <option value="anytime">Anytime</option>
      </select>
    </div>
  );
}

function TaskFields({ task }: { task?: WorkflowTask }) {
  return (
    <>
      <div>
        <label className="label">Title</label>
        <input name="title" required defaultValue={task?.title} className="input" />
      </div>
      <div>
        <label className="label">Description (optional)</label>
        <input
          name="description"
          defaultValue={task?.description ?? ""}
          className="input"
        />
      </div>
      <ShiftField value={task?.shift} />
    </>
  );
}

function ToggleRow({ task, isManager }: { task: TaskView; isManager: boolean }) {
  const [pending, startTransition] = useTransition();

  function toggle() {
    const fd = new FormData();
    fd.set("task_id", task.id);
    fd.set("done", String(task.done));
    startTransition(async () => {
      await toggleTask(fd);
    });
  }

  return (
    <div className="flex items-center gap-3 border-t border-border px-4 py-3 first:border-t-0">
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-pressed={task.done}
        className={`flex h-6 w-6 flex-none items-center justify-center rounded-md border ${
          task.done
            ? "border-brand bg-brand text-white"
            : "border-border bg-white"
        }`}
      >
        {task.done ? "✓" : ""}
      </button>
      <div className="flex-1">
        <div className={task.done ? "text-muted line-through" : "font-medium"}>
          {task.title}
        </div>
        {task.description && (
          <div className="text-xs text-muted">{task.description}</div>
        )}
        {task.done && task.completedByName && (
          <div className="text-xs text-green-700">
            Done by {task.completedByName}
          </div>
        )}
      </div>
      {isManager && (
        <div className="flex gap-2">
          <FormDialog
            trigger="Edit"
            title="Edit task"
            action={updateTask}
            triggerClassName="btn-secondary px-2.5 py-1 text-xs"
          >
            <input type="hidden" name="id" value={task.id} />
            <TaskFields task={task} />
          </FormDialog>
          <ConfirmButton
            action={deleteTask}
            confirm={`Delete task "${task.title}"?`}
            className="btn-danger px-2.5 py-1 text-xs"
            hidden={{ id: task.id }}
          >
            Delete
          </ConfirmButton>
        </div>
      )}
    </div>
  );
}

export function Checklist({
  groups,
  isManager,
}: {
  groups: Record<Shift, TaskView[]>;
  isManager: boolean;
}) {
  const order: Shift[] = ["opening", "anytime", "closing"];

  return (
    <div className="space-y-6">
      {isManager && (
        <div className="flex justify-end">
          <FormDialog
            trigger="+ Add task"
            title="Add workflow task"
            action={createTask}
            submitLabel="Add task"
          >
            <TaskFields />
          </FormDialog>
        </div>
      )}

      {order.map((shift) => {
        const tasks = groups[shift];
        if (!tasks || tasks.length === 0) return null;
        const doneCount = tasks.filter((t) => t.done).length;
        return (
          <section key={shift}>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
                {SHIFT_LABELS[shift]}
              </h2>
              <span className="text-xs text-muted">
                {doneCount}/{tasks.length} done
              </span>
            </div>
            <div className="card overflow-hidden">
              {tasks.map((t) => (
                <ToggleRow key={t.id} task={t} isManager={isManager} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
