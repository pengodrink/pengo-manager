"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireManager } from "@/lib/auth";
import type { Role } from "@/lib/types";

export async function updateRole(formData: FormData) {
  const me = await requireManager();
  const supabase = await createClient();

  const id = String(formData.get("id"));
  const role = String(formData.get("role")) as Role;

  // Guard against a manager accidentally locking themselves out.
  if (id === me.id && role !== "manager") {
    throw new Error("You can't remove your own manager access.");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/team");
}
