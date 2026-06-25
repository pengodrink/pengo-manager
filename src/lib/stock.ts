// Shared stock-status logic so every screen agrees on what's urgent.

export type StockStatus = "out" | "low" | "ok";

export function stockStatus(qty: number, threshold: number): StockStatus {
  if (qty <= 0) return "out"; // urgent — completely out
  if (qty <= threshold) return "low"; // low — needs reordering
  return "ok";
}

/** How many units to order to clear the reorder minimum. */
export function needToOrder(qty: number, threshold: number): number {
  return Math.max(0, threshold - qty);
}

export const STATUS_LABEL: Record<StockStatus, string> = {
  out: "Out of stock",
  low: "Reorder",
  ok: "OK",
};

// Tailwind classes for a status badge.
export const STATUS_BADGE: Record<StockStatus, string> = {
  out: "bg-red-100 text-red-700",
  low: "bg-amber-100 text-amber-700",
  ok: "bg-green-100 text-green-700",
};
