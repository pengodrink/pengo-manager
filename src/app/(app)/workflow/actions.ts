"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireManager, requireProfile } from "@/lib/auth";
import type { Shift } from "@/lib/types";

function str(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
}

export async function createTask(formData: FormData) {
  await requireManager();
  const supabase = await createClient();

  const { error } = await supabase.from("workflow_tasks").insert({
    title: String(formData.get("title") ?? "").trim(),
    description: str(formData.get("description")),
    shift: (String(formData.get("shift")) || "anytime") as Shift,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/workflow");
}

export async function updateTask(formData: FormData) {
  await requireManager();
  const supabase = await createClient();
  const id = String(formData.get("id"));

  const { error } = await supabase
    .from("workflow_tasks")
    .update({
      title: String(formData.get("title") ?? "").trim(),
      description: str(formData.get("description")),
      shift: (String(formData.get("shift")) || "anytime") as Shift,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/workflow");
}

export async function deleteTask(formData: FormData) {
  await requireManager();
  const supabase = await createClient();
  const id = String(formData.get("id"));

  const { error } = await supabase.from("workflow_tasks").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/workflow");
}

/** Toggle a task's completion for today's business date. */
export async function toggleTask(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const taskId = String(formData.get("task_id"));
  const currentlyDone = String(formData.get("done")) === "true";
  const today = new Date().toISOString().slice(0, 10);

  if (currentlyDone) {
    const { error } = await supabase
      .from("task_completions")
      .delete()
      .eq("task_id", taskId)
      .eq("business_date", today);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("task_completions").insert({
      task_id: taskId,
      business_date: today,
      status: "done",
      completed_by: profile.id,
    });
    if (error) throw new Error(error.message);
  }

  revalidatePath("/workflow");
  revalidatePath("/dashboard");
}
