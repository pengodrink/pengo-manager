import { Nav } from "@/components/nav";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { InventoryItem } from "@/lib/types";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: items } = await supabase
    .from("inventory_items")
    .select("current_qty, low_stock_threshold");
  const lowCount = ((items ?? []) as Pick<
    InventoryItem,
    "current_qty" | "low_stock_threshold"
  >[]).filter((i) => i.current_qty <= i.low_stock_threshold).length;

  return (
    <div className="min-h-screen">
      <Nav
        role={profile.role}
        name={profile.full_name ?? "Staff"}
        lowCount={lowCount}
      />
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
