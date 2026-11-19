import { AppShell } from "@/components/layout/app-shell";
import { adminNav } from "@/components/layout/nav-config";
import { EmptyState } from "@/components/ui/empty-state";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils";

export default async function AdminAuditPage() {
  await requireRole(["admin"]);
  const supabase = await createClient();
  const { data: logs } = await supabase
    .from("audit_log")
    .select("*, profiles(full_name)")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <AppShell title="Журнал действий" subtitle="Администратор" nav={adminNav} variant="workspace">
      {(logs ?? []).length === 0 ? (
        <EmptyState title="Записей пока нет" />
      ) : (
        <ul className="space-y-2">
          {logs!.map((entry) => (
            <li
              key={entry.id}
              className="rounded-xl border border-[var(--card-border)] bg-card px-3 py-3"
            >
              <p className="text-sm font-medium">{entry.action}</p>
              <p className="text-xs text-muted-foreground">
                {(entry.profiles as { full_name: string } | null)?.full_name ??
                  "Система"}{" "}
                · {formatDateTime(entry.created_at)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
