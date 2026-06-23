"use client";

import { useTransition } from "react";

/**
 * Submit-style button that confirms before invoking a Server Action.
 * Render hidden inputs as children to pass ids to the action.
 */
export function ConfirmButton({
  action,
  confirm,
  children,
  className = "btn-danger",
  hidden,
}: {
  action: (formData: FormData) => Promise<void>;
  confirm: string;
  children: React.ReactNode;
  className?: string;
  hidden?: Record<string, string>;
}) {
  const [pending, startTransition] = useTransition();

  function handle(formData: FormData) {
    if (!window.confirm(confirm)) return;
    startTransition(async () => {
      await action(formData);
    });
  }

  return (
    <form action={handle} className="inline">
      {hidden &&
        Object.entries(hidden).map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
      <button type="submit" className={className} disabled={pending}>
        {children}
      </button>
    </form>
  );
}
