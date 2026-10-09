// Morning "what to bring" report, per location.
// Reads SUPABASE_ACCESS_TOKEN + SUPABASE_PROJECT_REF from .env.local and
// queries the live database through the Supabase Management API.
// Usage: node scripts/morning-report.mjs [--json]

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const env = Object.fromEntries(
  readFileSync(path.join(root, ".env.local"), "utf8")
    .split("\n")
    .map((l) => l.match(/^([A-Z_]+)=(.*)$/))
    .filter(Boolean)
    .map((m) => [m[1], m[2].trim().replace(/^["']|["']$/g, "")]),
);
const token = env.SUPABASE_ACCESS_TOKEN;
const ref = env.SUPABASE_PROJECT_REF;
if (!token || !ref) {
  console.error("Missing SUPABASE_ACCESS_TOKEN or SUPABASE_PROJECT_REF in .env.local");
  process.exit(1);
}

const sql = `
  select l.code, l.name as location, l.sort_order,
         i.name as item, i.supplier, i.unit, i.low_stock_threshold as min,
         s.qty::float as qty
  from public.item_stock s
  join public.locations l on l.id = s.location_id
  join public.inventory_items i on i.id = s.item_id
  order by l.sort_order, s.qty, i.name`;

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query: sql }),
});
if (!res.ok) {
  console.error(`Supabase query failed (${res.status}): ${await res.text()}`);
  process.exit(1);
}
const rows = await res.json();

// Same rules as src/lib/stock.ts: out = 0 or less, low = at/below the minimum.
const locs = new Map();
for (const r of rows) {
  if (!locs.has(r.code)) locs.set(r.code, { code: r.code, name: r.location, out: [], low: [] });
  const bring = Math.max(r.min - r.qty, 1);
  const entry = { item: r.item, supplier: r.supplier, unit: r.unit, qty: r.qty, min: r.min, bring };
  if (r.qty <= 0) locs.get(r.code).out.push(entry);
  else if (r.qty <= r.min) locs.get(r.code).low.push(entry);
}

// Where else has it in stock (above its minimum) — so you know where to grab it.
const spare = (item, code) =>
  rows
    .filter((r) => r.item === item && r.code !== code && r.qty > r.min)
    .map((r) => `${r.code} ${r.qty}`);

const report = [...locs.values()];
if (process.argv.includes("--json")) {
  console.log(JSON.stringify(report, null, 2));
  process.exit(0);
}

const fmt = (e, code) => {
  const from = spare(e.item, code);
  return `  - ${e.item}: bring ${e.bring} ${e.unit} (has ${e.qty}, min ${e.min})` +
    (from.length ? ` — spare at ${from.join(", ")}` : e.supplier ? ` — buy from ${e.supplier}` : "");
};

const date = new Date().toLocaleDateString("en-US", {
  weekday: "long", month: "short", day: "numeric", timeZone: "America/Los_Angeles",
});
const lines = [`PENGO — what to bring today (${date})`];
for (const l of report) {
  lines.push("", `${l.name} (${l.code}) — ${l.out.length} out, ${l.low.length} low`);
  if (!l.out.length && !l.low.length) lines.push("  All stocked ✅");
  if (l.out.length) lines.push(" OUT:", ...l.out.map((e) => fmt(e, l.code)));
  if (l.low.length) lines.push(" LOW:", ...l.low.map((e) => fmt(e, l.code)));
}
console.log(lines.join("\n"));
