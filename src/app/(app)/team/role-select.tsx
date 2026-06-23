"use client";

import { useTransition } from "react";
import type { Role } from "@/lib/types";
import { updateRole } from "./actions";

export function RoleSelect({
  id,
  role,
  disabled,
}: {
  id: string;
  role: Role;
  disabled?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const fd = new FormData();
    fd.set("id", id);
    fd.set("role", e.target.value);
    startTransition(async () => {
      await updateRole(fd);
    });
  }

  return (
    <select
      defaultValue={role}
      onChange={onChange}
      disabled={disabled || pending}
      className="input w-36"
    >
      <option value="employee">Employee</option>
      <option value="manager">Manager</option>
    </select>
  );
}
