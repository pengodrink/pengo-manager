import { PageHeader, EmptyState } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import type { InventoryItem } from "@/lib/types";
import { InventoryTable } from "./inventory-table";

export default async function InventoryPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: items } = await supabase
    .from("inventory_items")
    .select("*")
    .order("name");

  const list = (items ?? []) as InventoryItem[];
  const lowCount = list.filter(
    (i) => i.current_qty <= i.low_stock_threshold,
  ).length;

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle={
          list.length
            ? `${list.length} items · ${lowCount} low on stock`
            : "Track stock levels and log restocks & usage"
        }
      />
      {list.length === 0 ? (
        <EmptyState
          icon="📦"
          title="No items yet"
          hint={
            profile.role === "manager"
              ? "Add your first inventory item to start tracking stock."
              : "Ask a manager to add inventory items."
          }
        />
      ) : (
        <InventoryTable items={list} isManager={profile.role === "manager"} />
      )}
    </div>
  );
}
