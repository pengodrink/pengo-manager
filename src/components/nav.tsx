"use client";

import Link from "next/link";
import Image from "next/image";
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

export function Nav({
  role,
  name,
  lowCount = 0,
}: {
  role: Role;
  name: string;
  lowCount?: number;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const visible = links.filter((l) => !l.managerOnly || role === "manager");
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <header
      className="sticky top-0 z-20 text-white shadow-lg"
      style={{
        backgroundImage: "linear-gradient(120deg, var(--navy), var(--navy-2))",
      }}
    >
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-2.5">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow">
            <Image src="/pengo-logo.png" alt="Pengo" width={34} height={34} />
          </span>
          <span className="text-xl font-extrabold tracking-tight">Pengo</span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {visible.map((l) => {
            const active = isActive(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-lg px-3.5 py-1.5 text-sm font-bold transition-all ${
                  active
                    ? "text-navy shadow"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
                style={
                  active
                    ? { backgroundImage: "linear-gradient(135deg, var(--gold-2), var(--gold))" }
                    : undefined
                }
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <Link
            href="/stock?view=reorder"
            className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-lg transition-colors hover:bg-white/20"
            title={
              lowCount > 0
                ? `${lowCount} items low on stock`
                : "Stock levels OK"
            }
          >
            🔔
            {lowCount > 0 && (
              <span
                className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-extrabold text-white"
                style={{ backgroundColor: "var(--red)" }}
              >
                {lowCount > 99 ? "99+" : lowCount}
              </span>
            )}
          </Link>
          <div className="hidden items-center gap-2 text-right sm:flex">
            <div>
              <div className="text-sm font-bold leading-tight">{name}</div>
              <div className="text-xs capitalize text-white/70">{role}</div>
            </div>
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-extrabold text-navy"
              style={{ backgroundImage: "linear-gradient(135deg, var(--gold-2), var(--gold))" }}
            >
              {(name?.[0] ?? "?").toUpperCase()}
            </span>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-xl border border-white/30 px-3 py-1.5 text-sm font-bold text-white transition-colors hover:bg-white/10"
            >
              Sign out
            </button>
          </form>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="rounded-xl border border-white/30 px-2.5 py-1.5 text-white md:hidden"
            aria-label="Toggle menu"
          >
            ☰
          </button>
        </div>
      </div>

      {open && (
        <nav className="grid gap-1 border-t border-white/15 px-4 py-2 md:hidden">
          {visible.map((l) => {
            const active = isActive(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`rounded-lg px-3 py-2 text-sm font-bold ${
                  active ? "text-navy" : "text-white/85 hover:bg-white/10"
                }`}
                style={
                  active
                    ? { backgroundImage: "linear-gradient(135deg, var(--gold-2), var(--gold))" }
                    : undefined
                }
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
