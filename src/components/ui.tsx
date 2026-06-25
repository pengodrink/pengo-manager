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

const ACCENTS: Record<string, string> = {
  gold: "linear-gradient(90deg, var(--gold-2), var(--gold-dark))",
  sky: "linear-gradient(90deg, #6cc0f0, var(--sky))",
  red: "linear-gradient(90deg, #f25a51, var(--red))",
  green: "linear-gradient(90deg, #7fd083, var(--green))",
  navy: "linear-gradient(90deg, var(--navy-2), var(--navy))",
};

export function StatCard({
  label,
  value,
  href,
  icon,
  accent = "navy",
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  href?: string;
  icon?: string;
  accent?: "gold" | "sky" | "red" | "green" | "navy";
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
        className="absolute inset-x-0 top-0 h-1.5"
        style={{ backgroundImage: ACCENTS[accent] ?? ACCENTS.navy }}
      />
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-muted">{label}</div>
        {icon && <span className="text-2xl">{icon}</span>}
      </div>
      <div
        className={`mt-2 text-3xl font-extrabold tracking-tight ${
          tone === "warn" ? "text-red" : "text-navy"
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
