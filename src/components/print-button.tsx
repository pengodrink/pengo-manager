"use client";

export function PrintButton({
  children = "🖨️ Print",
  className = "btn-secondary",
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <button type="button" className={className} onClick={() => window.print()}>
      {children}
    </button>
  );
}
