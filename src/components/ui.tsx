import Link from "next/link";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  icon = "✨",
  title,
  hint,
}: {
  icon?: string;
  title: string;
  hint?: string;
}) {
  return (
    <div className="card flex flex-col items-center justify-center gap-3 p-14 text-center">
      <div
        className="flex h-16 w-16 items-center justify-center rounded-2xl text-3xl"
        style={{ background: "var(--background)" }}
      >
        {icon}
      </div>
      <p className="text-lg font-semibold">{title}</p>
      {hint && <p className="max-w-sm text-sm text-muted">{hint}</p>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  href,
  icon,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  href?: string;
  icon?: string;
  tone?: "default" | "warn";
}) {
  const body = (
    <div
      className={`card group relative overflow-hidden p-5 transition-all ${
        href ? "hover:-translate-y-0.5 hover:shadow-md" : ""
      }`}
    >
      {/* accent strip */}
      <span
        className="absolute inset-x-0 top-0 h-1"
        style={{
          backgroundImage:
            tone === "warn"
              ? "linear-gradient(90deg, #f59e0b, #d97706)"
              : "linear-gradient(90deg, var(--brand-2), var(--brand))",
        }}
      />
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-muted">{label}</div>
        {icon && <span className="text-xl">{icon}</span>}
      </div>
      <div
        className={`mt-2 text-3xl font-bold tracking-tight ${
          tone === "warn" ? "text-amber-600" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
  return href ? (
    <Link href={href} className="block">
      {body}
    </Link>
  ) : (
    body
  );
}
