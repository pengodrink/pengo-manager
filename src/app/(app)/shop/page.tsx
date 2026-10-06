import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import type { InventoryItem } from "@/lib/types";
import { ShoppingList } from "./shopping-list";
import { scopeFor, scopeItems } from "@/lib/scope";

export default async function ShopPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const scope = await scopeFor(supabase, profile);

  const { data } = await supabase
    .from("inventory_items")
    .select("id, name, supplier, category, unit, current_qty, low_stock_threshold")
    .order("name");

  const items = scopeItems((data ?? []) as InventoryItem[], scope)
    .filter((i) => i.current_qty <= i.low_stock_threshold)
    .map((i) => ({
      id: i.id,
      name: i.name,
      supplier: i.supplier ?? "No vendor yet",
      category: i.category,
      unit: i.unit,
      current_qty: i.current_qty,
      low_stock_threshold: i.low_stock_threshold,
    }));

  return (
    <div>
      <PageHeader
        title="Shopping List"
        subtitle="Pick the vendor you're at — see only what you need to buy"
        action={
          <Link href="/shop/report" className="btn-primary">
            📄 Generate report
          </Link>
        }
      />
      <ShoppingList items={items} />
    </div>
  );
}
