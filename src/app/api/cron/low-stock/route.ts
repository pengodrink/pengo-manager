import { createClient } from "@supabase/supabase-js";

// Daily low-stock email. Triggered by Vercel Cron (see vercel.json).
// Activates once these env vars are set in your hosting environment:
//   SUPABASE_SERVICE_ROLE_KEY  (Supabase -> Project Settings -> API)
//   RESEND_API_KEY             (resend.com -> API Keys)
//   ALERT_EMAIL                (where to send, e.g. you@pengodrink.com)
//   ALERT_FROM                 (optional; default uses Resend's test sender)
//   CRON_SECRET                (optional; Vercel sends it as a Bearer token)

export const dynamic = "force-dynamic";

type Row = {
  name: string;
  supplier: string | null;
  unit: string;
  current_qty: number;
  low_stock_threshold: number;
};

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    if (request.headers.get("authorization") !== `Bearer ${secret}`) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  const to = process.env.ALERT_EMAIL;

  if (!url || !serviceKey || !resendKey || !to) {
    return Response.json(
      { ok: false, reason: "Email alert not configured (missing env vars)." },
      { status: 200 },
    );
  }

  const supabase = createClient(url, serviceKey);
  const { data, error } = await supabase
    .from("inventory_items")
    .select("name, supplier, unit, current_qty, low_stock_threshold")
    .order("supplier")
    .order("name");
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });

  const low = ((data ?? []) as Row[]).filter(
    (i) => i.current_qty <= i.low_stock_threshold,
  );
  if (low.length === 0) return Response.json({ ok: true, low: 0 });

  // Group by supplier for the email body.
  const groups = new Map<string, Row[]>();
  for (const r of low) {
    const k = r.supplier ?? "Other";
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(r);
  }
  const sections = [...groups.entries()]
    .map(
      ([supplier, rows]) =>
        `<h3 style="margin:16px 0 4px">${supplier} (${rows.length})</h3>` +
        "<ul style='margin:0;padding-left:18px'>" +
        rows
          .map(
            (r) =>
              `<li>${r.name} — <b>${r.current_qty} ${r.unit}</b> left</li>`,
          )
          .join("") +
        "</ul>",
    )
    .join("");

  const html = `<div style="font-family:Arial,sans-serif;color:#16264c">
    <h2>🔔 ${low.length} item${low.length === 1 ? "" : "s"} low on stock</h2>
    <p style="color:#6c7a96">Pengo Shop Manager · ${new Date().toLocaleDateString()}</p>
    ${sections}
  </div>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.ALERT_FROM || "Pengo <onboarding@resend.dev>",
      to: [to],
      subject: `🔔 ${low.length} items low on stock — Pengo`,
      html,
    }),
  });

  return Response.json({ ok: res.ok, low: low.length });
}
