import Link from "next/link";
import { PageHeader, EmptyState } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import type { InventoryItem, ItemStock, Location } from "@/lib/types";
import { ConfirmButton } from "@/components/confirm-button";
import { InventoryTable, AddItemDialog } from "./inventory-table";
import { ImportItemsDialog } from "./import-items";
import { restockAllToFull } from "./actions";
import { scopeFor, scopeItems } from "@/lib/scope";

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

  const scope = await scopeFor(supabase, profile);
  const list = scopeItems((itemData ?? []) as InventoryItem[], scope);
  const allLocations = (locationData ?? []) as Location[];
  // Staff only see their own location.
  const locations = scope
    ? allLocations.filter((l) => l.id === scope.locationId)
    : allLocations;
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
            ? `${list.length} items · ${lowCount} low${locations.length === 1 ? ` at ${locations[0].name}` : ` across ${locations.length} locations`}`
            : "Track stock levels across your locations"
        }
        action={
          <div className="flex flex-wrap gap-2">
            <Link href="/shop" className="btn-secondary">
              🛒 Shopping list
            </Link>
            {isManager && (
              <>
                <ConfirmButton
                  action={restockAllToFull}
                  confirm="Set EVERY item at EVERY location to its full level? This overwrites all current counts."
                  className="btn-secondary"
                >
                  ↺ Mark all back in stock
                </ConfirmButton>
                <ImportItemsDialog />
                <AddItemDialog />
              </>
            )}
          </div>
        }
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
