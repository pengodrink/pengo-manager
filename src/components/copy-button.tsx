"use client";

import { useState } from "react";

export function CopyButton({
  text,
  label = "Copy list",
  className = "btn-secondary px-3 py-1.5",
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked — no-op.
    }
  }

  return (
    <button type="button" onClick={copy} className={className}>
      {copied ? "✓ Copied" : label}
    </button>
  );
}
