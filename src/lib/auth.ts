import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

/** A profile, plus the location code when signed in via a location code. */
export type SessionProfile = Profile & { location_code: string | null };

/**
 * Returns the signed-in profile, or redirects to the location-code screen.
 * Use at the top of any protected Server Component / Server Action.
 */
export async function requireProfile(): Promise<SessionProfile> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/enter");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Profile row is created by a DB trigger on signup; if it's somehow missing,
  // treat the session as invalid.
  if (!profile) redirect("/enter");

  const loc = (user.user_metadata?.location_code as string | undefined) ?? null;
  return { ...(profile as Profile), location_code: loc };
}

/**
 * Like requireProfile, but additionally requires the manager role.
 * Employees are redirected to the dashboard.
 */
export async function requireManager(): Promise<SessionProfile> {
  const profile = await requireProfile();
  if (profile.role !== "manager") redirect("/dashboard");
  return profile;
}
