import { AppShell } from "@/components/layout/app-shell";
import { adminNav } from "@/components/layout/nav-config";
import { createUserAction } from "@/actions/platform";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/supabase/server";
import { ROLE_LABELS, type UserRole } from "@/types/database";

export default async function AdminUsersPage() {
  await requireRole(["admin"]);
  const supabase = await createClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, role, phone, is_active, manager_id")
    .order("created_at", { ascending: false });

  const managers = (profiles ?? []).filter((p) => p.role === "manager");

  return (
    <AppShell title="Пользователи" subtitle="Администратор" nav={adminNav} variant="workspace">
      <Card className="space-y-3">
        <p className="text-sm font-medium">Новый пользователь</p>
        <form action={createUserAction} className="space-y-2">
          <input
            name="full_name"
            required
            placeholder="ФИО"
            className="h-10 w-full rounded-xl border border-[var(--card-border)] bg-muted px-3 text-sm"
          />
          <input
            name="email"
            type="email"
            required
            placeholder="Email"
            className="h-10 w-full rounded-xl border border-[var(--card-border)] bg-muted px-3 text-sm"
          />
          <input
            name="password"
            type="password"
            required
            minLength={8}
            placeholder="Пароль (мин. 8 символов)"
            className="h-10 w-full rounded-xl border border-[var(--card-border)] bg-muted px-3 text-sm"
          />
          <input
            name="phone"
            placeholder="Телефон"
            className="h-10 w-full rounded-xl border border-[var(--card-border)] bg-muted px-3 text-sm"
          />
          <select
            name="role"
            className="h-10 w-full rounded-xl border border-[var(--card-border)] bg-muted px-3 text-sm"
            defaultValue="agent"
          >
            {(Object.keys(ROLE_LABELS) as UserRole[]).map((role) => (
              <option key={role} value={role}>
                {ROLE_LABELS[role]}
              </option>
            ))}
          </select>
          <select
            name="manager_id"
            className="h-10 w-full rounded-xl border border-[var(--card-border)] bg-muted px-3 text-sm"
            defaultValue=""
          >
            <option value="">Руководитель (для агента)</option>
            {managers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.full_name}
              </option>
            ))}
          </select>
          <Button type="submit" className="w-full">
            Создать
          </Button>
        </form>
      </Card>

      <ul className="space-y-2">
        {(profiles ?? []).map((user) => (
          <li
            key={user.id}
            className="flex items-center justify-between rounded-xl border border-[var(--card-border)] bg-card px-3 py-3"
          >
            <div>
              <p className="text-sm font-medium">{user.full_name}</p>
              <p className="text-xs text-muted-foreground">
                {ROLE_LABELS[user.role as UserRole]}
                {user.phone ? ` · ${user.phone}` : ""}
              </p>
            </div>
            <span
              className={
                user.is_active ? "text-xs text-success" : "text-xs text-danger"
              }
            >
              {user.is_active ? "Активен" : "Отключён"}
            </span>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
