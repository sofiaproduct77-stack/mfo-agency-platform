"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { celebrateConfirmedSale } from "@/lib/celebration";
import { showAgentToast } from "@/lib/agent-toast-bus";
import {
  APPLICATION_STATUS_LABELS,
  type ApplicationStatus,
} from "@/types/database";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "mfo_notifications_enabled";

function canNotify() {
  return typeof window !== "undefined" && "Notification" in window;
}

function notify(title: string, body: string) {
  if (!canNotify() || Notification.permission !== "granted") return;
  try {
    new Notification(title, {
      body,
      icon: "/icon",
      tag: `mfo-${Date.now()}`,
    });
  } catch {
    /* ignore */
  }
}

function isConfirmedSale(status: ApplicationStatus | undefined) {
  return status === "sale_confirmed";
}

export function AgentLiveNotifications({ agentId }: { agentId: string }) {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (canNotify()) {
      if (
        Notification.permission === "default" &&
        !localStorage.getItem("mfo_notifications_asked")
      ) {
        setShowPrompt(true);
      }
    }

    const supabase = createClient();
    const channel = supabase
      .channel(`agent-${agentId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "applications",
          filter: `agent_id=eq.${agentId}`,
        },
        (payload) => {
          const oldRow = payload.old as { status?: ApplicationStatus };
          const next = payload.new as { status?: ApplicationStatus };
          if (!next.status) return;

          if (
            isConfirmedSale(next.status) &&
            !isConfirmedSale(oldRow.status)
          ) {
            celebrateConfirmedSale();
            showAgentToast({
              title: "Продажа подтверждена",
              body: APPLICATION_STATUS_LABELS.sale_confirmed,
              tone: "success",
            });
          } else if (oldRow.status !== next.status) {
            showAgentToast({
              title: "Статус заявки",
              body: APPLICATION_STATUS_LABELS[next.status] ?? next.status,
            });
          }

          if (Notification.permission === "granted") {
            notify(
              "Статус заявки",
              APPLICATION_STATUS_LABELS[next.status] ?? next.status,
            );
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "promo_events",
        },
        (payload) => {
          if (Notification.permission !== "granted") return;
          const row = payload.new as { title?: string; is_active?: boolean };
          if (row.is_active === false) return;
          notify("Новое событие", row.title ?? "Доступна акция с бонусом");
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "rewards",
          filter: `agent_id=eq.${agentId}`,
        },
        () => {
          showAgentToast({
            title: "Начисление",
            body: "Вам начислено вознаграждение",
            tone: "success",
          });
          if (Notification.permission !== "granted") return;
          notify("Начисление", "Вам начислено вознаграждение");
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [agentId]);

  async function enableNotifications() {
    if (!canNotify()) return;
    localStorage.setItem("mfo_notifications_asked", "1");
    const result = await Notification.requestPermission();
    if (result === "granted") {
      localStorage.setItem(STORAGE_KEY, "1");
      notify("MFO Agency", "Уведомления включены");
    }
    setShowPrompt(false);
  }

  function dismissPrompt() {
    localStorage.setItem("mfo_notifications_asked", "1");
    setShowPrompt(false);
  }

  if (!showPrompt) return null;

  return (
    <div className="mx-4 mt-3 rounded-xl border border-accent/20 bg-accent/10 px-3 py-3">
      <p className="text-sm font-medium">Уведомления</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Статусы заявок, начисления и новые события.
      </p>
      <div className="mt-2 flex gap-2">
        <Button
          type="button"
          className="h-9 flex-1 text-xs"
          onClick={enableNotifications}
        >
          Включить
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="h-9 flex-1 text-xs"
          onClick={dismissPrompt}
        >
          Позже
        </Button>
      </div>
    </div>
  );
}
