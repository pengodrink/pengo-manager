import { PageHeader, EmptyState } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import type { InventoryItem, ItemStock, Location } from "@/lib/types";
import { InventoryTable, AddItemDialog } from "./inventory-table";

export default async function InventoryPage() {
  const profile = await requireProfile();
  const isManager = profile.role === "manager";
  const supabase = await createClient();

  const [{ data: itemData }, { data: locationData }, { data: stockData }] =
    await Promise.all([
      supabase
        .from("inventory_items")
        .select("*")
        .order("supplier")
        .order("category")
        .order("name"),
      supabase.from("locations").select("*").order("sort_order"),
      supabase.from("item_stock").select("item_id, location_id, qty"),
    ]);

  const list = (itemData ?? []) as InventoryItem[];
  const locations = (locationData ?? []) as Location[];
  const stockRows = (stockData ?? []) as Pick<
    ItemStock,
    "item_id" | "location_id" | "qty"
  >[];

  const stock: Record<string, Record<string, number>> = {};
  for (const s of stockRows) {
    (stock[s.item_id] ??= {})[s.location_id] = s.qty;
  }

  const lowCount = list.filter(
    (i) => i.current_qty <= i.low_stock_threshold,
  ).length;

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle={
          list.length
            ? `${list.length} items · ${lowCount} low across ${locations.length} locations`
            : "Track stock levels across your locations"
        }
        action={isManager ? <AddItemDialog /> : null}
      />
      {list.length === 0 ? (
        <EmptyState
          icon="📦"
          title="No items yet"
          hint={
            isManager
              ? "Add an item, or run the 0002 migration to import your spreadsheet."
              : "Ask a manager to add inventory items."
          }
        />
      ) : (
        <InventoryTable
          items={list}
          locations={locations}
          stock={stock}
          isManager={isManager}
        />
      )}
    </div>
  );
}
