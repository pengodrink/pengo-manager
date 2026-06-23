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
    { href: "/recipes", label: "Recipes", icon: "📖" },
    { href: "/workflow", label: "Workflow", icon: "✅" },
    { href: "/team", label: "Team", icon: "👥", managerOnly: true },
  ];

export function Nav({ role, name }: { role: Role; name: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const visible = links.filter((l) => !l.managerOnly || role === "manager");

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-white">
            ☕
          </span>
          <span>Pengo</span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {visible.map((l) => {
            const active = pathname === l.href || pathname.startsWith(l.href + "/");
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-brand text-white"
                    : "text-foreground hover:bg-background"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <div className="text-sm font-medium leading-tight">{name}</div>
            <div className="text-xs capitalize text-muted">{role}</div>
          </div>
          <form action={signOut}>
            <button type="submit" className="btn-secondary px-3 py-1.5">
              Sign out
            </button>
          </form>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="btn-secondary px-2 py-1.5 md:hidden"
            aria-label="Toggle menu"
          >
            ☰
          </button>
        </div>
      </div>

      {open && (
        <nav className="grid gap-1 border-t border-border px-4 py-2 md:hidden">
          {visible.map((l) => {
            const active = pathname === l.href || pathname.startsWith(l.href + "/");
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`rounded-lg px-3 py-2 text-sm font-medium ${
                  active ? "bg-brand text-white" : "hover:bg-background"
                }`}
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
