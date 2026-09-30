"use client";

import { FormDialog } from "@/components/form-dialog";
import { importItems } from "./actions";

// Pre-filled from the list you pasted. One per line: "Name | Category".
const STARTER = `Passion fruit | Fruit
Frozen banana | Frozen Fruit
Chocolate ice cream | Ice Cream
Lychee Monin | Syrup
Banana Monin | Syrup
Lychee cans | Fruit
Croffles | Bakery
Croffle cream | Bakery
Crispy shrimp condensed milk | Frozen Food
Oolong tea | Tea
Earl grey | Tea
Coconut water | Juice
Chai mix | Powders & Mixes
Tajin | Sauces
Chamoy | Sauces
Cheesy waffle | Frozen Food
Matcha Nutella | Sauces
Cheesy croc | Frozen Food
Garlic | Produce
Food containers | Supplies
Cups | Supplies
Matcha lids | Supplies
Milkshake lids | Supplies
Super size straws | Supplies
Oreo crumbs | Toppings
Whip cream | Dairy
Sponges | Restroom/Cleaning
Steel wool | Restroom/Cleaning
Reusable bottles | Supplies
Sauce cups | Supplies
Sauce lids | Supplies
Croffle containers | Supplies
Croffle lids | Supplies
Nutella | Sauces
Biscoff cream | Sauces
Biscoff cookie | Bakery
Chips Ahoy | Bakery
Mini Oreos | Bakery
Teddy Graham cookie | Bakery
Rags | Restroom/Cleaning
Seal roll | Supplies
Super size cups | Supplies
Super size lids | Supplies
Receipt paper | Supplies
Cup order stickers | Supplies
Cake pops | Bakery
Forks | Supplies
Knives | Supplies
Kumquat syrup | Syrup
Hot chocolate | Powders & Mixes
Food bags | Supplies
Fruit bags | Supplies`;

export function ImportItemsDialog() {
  return (
    <FormDialog
      trigger="＋ Add many"
      title="Add many items"
      action={importItems}
      submitLabel="Add items"
      triggerClassName="btn-secondary"
    >
      <p className="text-sm text-muted">
        One item per line. Use <b>Name | Category</b> to set a category. Items
        that already exist are skipped. New items start at 0 until counted.
      </p>
      <div>
        <label className="label">Items</label>
        <textarea
          name="list"
          rows={12}
          defaultValue={STARTER}
          className="input font-mono text-xs"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Vendor (optional)</label>
          <input name="supplier" placeholder="e.g. Costco" className="input" />
        </div>
        <div>
          <label className="label">Default category</label>
          <input name="category" placeholder="if a line has none" className="input" />
        </div>
      </div>
    </FormDialog>
  );
}
