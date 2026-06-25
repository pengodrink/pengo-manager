// Shared types mirroring the Supabase/Postgres schema (see supabase/migrations).

export type Role = "manager" | "employee";

export type Profile = {
  id: string;
  full_name: string | null;
  role: Role;
  created_at: string;
};

export type InventoryItem = {
  id: string;
  name: string;
  category: string | null;
  unit: string;
  current_qty: number;
  low_stock_threshold: number;
  full_level: number;
  cost_per_unit: number | null;
  supplier: string | null;
  updated_at: string;
};

export type InventoryTxType = "restock" | "usage" | "adjustment";

export type InventoryTransaction = {
  id: string;
  item_id: string;
  change_qty: number;
  type: InventoryTxType;
  note: string | null;
  created_by: string | null;
  created_at: string;
};

export type Recipe = {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  image_url: string | null;
  instructions: string | null;
  created_at: string;
};

export type RecipeIngredient = {
  id: string;
  recipe_id: string;
  item_id: string | null;
  name: string;
  quantity: number | null;
  unit: string | null;
};

export type Location = {
  id: string;
  code: string;
  name: string;
  sort_order: number;
  pin: string | null;
  created_at: string;
};

export type ItemStock = {
  id: string;
  item_id: string;
  location_id: string;
  qty: number;
  updated_at: string;
};

export type Shift = "opening" | "closing" | "anytime";

export type WorkflowTask = {
  id: string;
  title: string;
  description: string | null;
  shift: Shift;
  active: boolean;
  created_at: string;
};

export type TaskCompletion = {
  id: string;
  task_id: string;
  business_date: string;
  status: "todo" | "done";
  completed_by: string | null;
  completed_at: string | null;
};
