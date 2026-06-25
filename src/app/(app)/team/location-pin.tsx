"use client";

import { useState, useTransition } from "react";
import { setLocationPin } from "./actions";

export function LocationPin({
  id,
  name,
  pin,
}: {
  id: string;
  name: string;
  pin: string | null;
}) {
  const [value, setValue] = useState(pin ?? "");
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function save() {
    const fd = new FormData();
    fd.set("id", id);
    fd.set("pin", value);
    startTransition(async () => {
      await setLocationPin(fd);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    });
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="flex-1 font-medium">{name}</div>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        inputMode="numeric"
        placeholder="No PIN"
        className="input w-28 text-center tracking-widest"
        aria-label={`${name} PIN`}
      />
      <button
        type="button"
        onClick={save}
        disabled={pending}
        className={saved ? "btn-secondary px-3 py-1.5" : "btn-primary px-3 py-1.5"}
      >
        {pending ? "Saving…" : saved ? "✓ Saved" : "Save"}
      </button>
    </div>
  );
}
