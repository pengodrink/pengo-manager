"use client";

import { useRouter } from "next/navigation";

export function BackButton({
  fallback = "/inventory",
  label = "← Back",
}: {
  fallback?: string;
  label?: string;
}) {
  const router = useRouter();

  function goBack() {
    // Prefer the page the user came from; fall back if there's no history
    // (e.g. opened the link directly).
    if (window.history.length > 1) router.back();
    else router.push(fallback);
  }

  return (
    <button
      type="button"
      onClick={goBack}
      className="text-sm text-muted hover:text-brand"
    >
      {label}
    </button>
  );
}
