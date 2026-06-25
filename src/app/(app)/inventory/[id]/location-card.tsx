"use client";

import { useRef, useState, useTransition } from "react";
import { setLocationStock } from "@/app/(app)/stock/actions";

export function LocationCard({
  itemId,
  unit,
  locationId,
  locationName,
  qty,
  updatedAt,
  fullLevel,
}: {
  itemId: string;
  unit: string;
  locationId: string;
  locationName: string;
  qty: number;
  updatedAt: string | null;
  fullLevel: number;
}) {
  const [open, setOpen] = useState(false);
  const [entry, setEntry] = useState(String(qty));
  const [pending, startTransition] = useTransition();
  const [flash, setFlash] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function submit(q: number, msg: string) {
    const fd = new FormData();
    fd.set("item_id", itemId);
    fd.set("location_id", locationId);
    fd.set("qty", String(q));
    startTransition(async () => {
      await setLocationStock(fd);
      setOpen(false);
      setFlash(msg);
      setTimeout(() => setFlash(null), 1600);
    });
  }

  // Distinguish single tap (open popup) from double tap (fill to full).
  function handleClick() {
    if (timer.current) return;
    timer.current = setTimeout(() => {
      timer.current = null;
      setEntry(String(qty));
      setOpen(true);
    }, 230);
  }
  function handleDouble() {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    if (fullLevel > 0) submit(fullLevel, `Filled to ${fullLevel}`);
    else {
      setEntry(String(qty));
      setOpen(true);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        onDoubleClick={handleDouble}
        disabled={pending}
        className="card w-full cursor-pointer p-5 text-left transition-colors hover:border-brand-2"
      >
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted">{locationName}</span>
          {flash && (
            <span className="text-xs font-bold text-green">✓ {flash}</span>
          )}
        </div>
        <div className="mt-1 text-2xl font-bold tabular-nums">
          {qty} <span className="text-base font-normal text-muted">{unit}</span>
        </div>
        <div className="mt-1 text-xs text-muted">
          {updatedAt
            ? `Updated ${new Date(updatedAt).toLocaleDateString()}`
            : "Never counted"}
          {fullLevel > 0 && <> · double-tap = fill to {fullLevel}</>}
        </div>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="card w-full max-w-xs p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-1 text-lg font-bold">Restock {locationName}</h2>
            <p className="mb-3 text-sm text-muted">Enter the new count ({unit}).</p>
            <input
              type="number"
              min="0"
              step="any"
              autoFocus
              value={entry}
              onChange={(e) => setEntry(e.target.value)}
              className="input text-lg"
            />
            {fullLevel > 0 && (
              <button
                type="button"
                onClick={() => submit(fullLevel, `Filled to ${fullLevel}`)}
                disabled={pending}
                className="btn-secondary mt-3 w-full"
              >
                ⚡ Fill to full ({fullLevel})
              </button>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                disabled={pending}
                onClick={() => submit(Number(entry) || 0, "Saved")}
              >
                {pending ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
