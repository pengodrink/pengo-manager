"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "@/app/auth/actions";
import type { Role } from "@/lib/types";

const links: { href: string; label: string; icon: string; managerOnly?: boolean }[] =
  [
    { href: "/dashboard", label: "Dashboard", icon: "🏠" },
    { href: "/inventory", label: "Inventory", icon: "📦" },
    { href: "/stock", label: "Stock Count", icon: "🧮" },
    { href: "/recipes", label: "Recipes", icon: "📖" },
    { href: "/workflow", label: "Workflow", icon: "✅" },
    { href: "/team", label: "Team", icon: "👥", managerOnly: true },
  ];

const brandGradient = {
  backgroundImage: "linear-gradient(135deg, var(--brand-2), var(--brand-dark))",
};

export function Nav({ role, name }: { role: Role; name: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const visible = links.filter((l) => !l.managerOnly || role === "manager");
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <header
      className="sticky top-0 z-20 border-b border-border"
      style={{
        background: "color-mix(in srgb, var(--card) 80%, transparent)",
        backdropFilter: "saturate(180%) blur(12px)",
      }}
    >
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl text-lg text-white shadow"
            style={brandGradient}
          >
            ☕
          </span>
          <span className="text-lg font-bold tracking-tight">Pengo</span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {visible.map((l) => {
            const active = isActive(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all ${
                  active
                    ? "text-white shadow"
                    : "text-muted hover:bg-background hover:text-foreground"
                }`}
                style={active ? brandGradient : undefined}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden items-center gap-2 text-right sm:flex">
            <div>
              <div className="text-sm font-semibold leading-tight">{name}</div>
              <div className="text-xs capitalize text-muted">{role}</div>
            </div>
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white"
              style={brandGradient}
            >
              {(name?.[0] ?? "?").toUpperCase()}
            </span>
          </div>
          <form action={signOut}>
            <button type="submit" className="btn-secondary px-3 py-1.5">
              Sign out
            </button>
          </form>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="btn-secondary px-2.5 py-1.5 md:hidden"
            aria-label="Toggle menu"
          >
            ☰
          </button>
        </div>
      </div>

      {open && (
        <nav className="grid gap-1 border-t border-border px-4 py-2 md:hidden">
          {visible.map((l) => {
            const active = isActive(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`rounded-lg px-3 py-2 text-sm font-medium ${
                  active ? "text-white" : "hover:bg-background"
                }`}
                style={active ? brandGradient : undefined}
              >
                <span className="mr-2">{l.icon}</span>
                {l.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
