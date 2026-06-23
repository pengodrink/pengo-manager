import { PageHeader } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { requireManager } from "@/lib/auth";
import type { Profile } from "@/lib/types";
import { RoleSelect } from "./role-select";

export default async function TeamPage() {
  const me = await requireManager();
  const supabase = await createClient();

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at");
  const people = (data ?? []) as Profile[];

  return (
    <div>
      <PageHeader
        title="Team"
        subtitle="Manage who can access the app and what they can do"
      />

      <div className="card mb-4 bg-amber-50 p-4 text-sm text-amber-800">
        New staff sign up at the login screen — they start as{" "}
        <strong>employees</strong>. Promote them to <strong>manager</strong> here
        to give full access.
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-background text-left text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium">Role</th>
            </tr>
          </thead>
          <tbody>
            {people.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <span className="font-medium">{p.full_name ?? "Staff"}</span>
                  {p.id === me.id && (
                    <span className="ml-2 text-xs text-muted">(you)</span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted">
                  {new Date(p.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <RoleSelect
                    id={p.id}
                    role={p.role}
                    disabled={p.id === me.id}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
