"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUp, type AuthState } from "@/app/auth/actions";

export default function SignupPage() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    signUp,
    null,
  );

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl text-3xl"
            style={{
              backgroundImage:
                "linear-gradient(135deg, var(--brand-2), var(--brand-dark))",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            ☕
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
          <p className="mt-1 text-sm text-muted">
            The first person to sign up becomes the manager.
          </p>
        </div>

        <div className="card p-8" style={{ boxShadow: "var(--shadow-lg)" }}>
          <form action={formAction} className="space-y-4">
            <div>
              <label className="label" htmlFor="full_name">
                Full name
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                required
                autoComplete="name"
                placeholder="Jane Barista"
                className="input"
              />
            </div>
            <div>
              <label className="label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@pengo.coffee"
                className="input"
              />
            </div>
            <div>
              <label className="label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                placeholder="At least 6 characters"
                className="input"
              />
            </div>

            {state?.error && (
              <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700">
                {state.error}
              </p>
            )}

            <button
              type="submit"
              className="btn-primary w-full"
              disabled={pending}
            >
              {pending ? "Creating…" : "Create account"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-brand">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
