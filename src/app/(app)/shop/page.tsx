import { PageHeader } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import type { InventoryItem } from "@/lib/types";
import { ShoppingList } from "./shopping-list";

export default async function ShopPage() {
  await requireProfile();
  const supabase = await createClient();

  const { data } = await supabase
    .from("inventory_items")
    .select("id, name, supplier, category, unit, current_qty, low_stock_threshold")
    .order("name");

  const items = ((data ?? []) as InventoryItem[])
    .filter((i) => i.current_qty <= i.low_stock_threshold && i.supplier)
    .map((i) => ({
      id: i.id,
      name: i.name,
      supplier: i.supplier as string,
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
      />
      <ShoppingList items={items} />
    </div>
  );
}
