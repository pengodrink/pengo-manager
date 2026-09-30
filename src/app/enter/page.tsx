"use client";

import Link from "next/link";
import Image from "next/image";
import { useActionState, useState } from "react";
import { enterLocation, type AuthState } from "@/app/auth/actions";
import { STAFF_LOCATIONS } from "@/lib/location-accounts";

export default function EnterPage() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    enterLocation,
    null,
  );
  const [code, setCode] = useState("");

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-7 text-center">
          <Image
            src="/pengo-logo.png"
            alt="Pengo"
            width={110}
            height={110}
            className="mx-auto drop-shadow-lg"
            priority
          />
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-navy">
            Pick your location
          </h1>
          <p className="mt-1 text-sm text-muted">
            Then enter your location code
          </p>
        </div>

        <div className="card p-6" style={{ boxShadow: "var(--shadow-lg)" }}>
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="code" value={code} />

            <div className="grid gap-2">
              {STAFF_LOCATIONS.map((l) => {
                const active = code === l.code;
                return (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => setCode(l.code)}
                    className={`rounded-xl border px-4 py-3 text-left font-bold transition-all ${
                      active
                        ? "border-transparent text-white shadow"
                        : "border-border bg-card hover:border-sky"
                    }`}
                    style={
                      active
                        ? {
                            backgroundImage:
                              "linear-gradient(135deg, var(--navy-2), var(--navy))",
                          }
                        : undefined
                    }
                  >
                    📍 {l.name}
                  </button>
                );
              })}
            </div>

            <input
              name="pin"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              placeholder="Location code"
              className="input text-center text-2xl tracking-[0.4em]"
            />

            {state?.error && (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
                {state.error}
              </p>
            )}

            <button
              type="submit"
              className="btn-primary w-full"
              disabled={pending || !code}
            >
              {pending ? "Checking…" : "Enter"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          Manager?{" "}
          <Link href="/login" className="font-bold text-sky">
            Sign in with email
          </Link>
        </p>
      </div>
    </div>
  );
}
