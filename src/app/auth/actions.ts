"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@/lib/supabase/server";
import {
  STAFF_LOCATIONS,
  SESSION_MINUTES,
  locationEmail,
  locationPassword,
} from "@/lib/location-accounts";

export type AuthState = { error: string } | null;

export async function signIn(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signUp(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  if (error) return { error: error.message };

  // If email confirmation is enabled, there is no session yet.
  if (!data.session) {
    return {
      error:
        "Account created. Please check your email to confirm, then sign in.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

/**
 * Staff sign-in: pick a location and enter its code. We check the code against
 * the PIN stored for that location, then sign into the location's hidden
 * account with cookies that expire after SESSION_MINUTES (renewed by activity
 * in proxy.ts).
 */
export async function enterLocation(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const code = String(formData.get("code") ?? "");
  const pin = String(formData.get("pin") ?? "").trim();
  const known = STAFF_LOCATIONS.some((l) => l.code === code);
  if (!known || !pin) return { error: "Pick your location and enter its code." };

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const creds = {
    email: locationEmail(code),
    password: locationPassword(code),
  };

  // 1) Verify the code with a throwaway client (no cookies stored yet).
  const probe = createServerClient(url, key, {
    cookies: { getAll: () => [], setAll: () => {} },
  });
  const { error: signErr } = await probe.auth.signInWithPassword(creds);
  if (signErr) return { error: "Could not reach this location. Try again." };
  const { data: loc } = await probe
    .from("locations")
    .select("pin")
    .eq("code", code)
    .single();
  if (!loc?.pin || loc.pin !== pin) {
    await new Promise((r) => setTimeout(r, 1200)); // slow down guessing
    return { error: "Wrong code — try again." };
  }

  // 2) Code is right: sign in for real, with short-lived cookies.
  const store = await cookies();
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) =>
        list.forEach(({ name, value, options }) =>
          store.set(name, value, {
            ...options,
            maxAge: SESSION_MINUTES * 60,
            httpOnly: true,
          }),
        ),
    },
  });
  const { error } = await supabase.auth.signInWithPassword(creds);
  if (error) return { error: "Could not sign in. Try again." };

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const wasStaff = !!user?.user_metadata?.location_code;
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect(wasStaff ? "/enter" : "/login");
}
