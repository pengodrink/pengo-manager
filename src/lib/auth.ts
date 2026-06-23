import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

/**
 * Returns the signed-in user's profile, or redirects to /login.
 * Use at the top of any protected Server Component / Server Action.
 */
export async function requireProfile(): Promise<Profile> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Profile row is created by a DB trigger on signup; if it's somehow missing,
  // treat the session as invalid.
  if (!profile) redirect("/login");

  return profile as Profile;
}

/**
 * Like requireProfile, but additionally requires the manager role.
 * Employees are redirected to the dashboard.
 */
export async function requireManager(): Promise<Profile> {
  const profile = await requireProfile();
  if (profile.role !== "manager") redirect("/dashboard");
  return profile;
}
