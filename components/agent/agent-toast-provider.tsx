"use client";

import { useEffect, useState } from "react";
import {
  subscribeAgentToast,
  type AgentToastPayload,
} from "@/lib/agent-toast-bus";
import { cn } from "@/lib/utils";

export function AgentToastProvider() {
  const [toast, setToast] = useState<AgentToastPayload | null>(null);

  useEffect(() => {
    return subscribeAgentToast((payload) => {
      setToast(payload);
    });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(t);
  }, [toast]);

  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 z-[60] mx-auto max-w-lg animate-fade-in safe-bottom-offset"
    >
      <div
        className={cn(
          "surface-flat px-4 py-3",
          toast.tone === "success" && "border-success/30",
        )}
      >
        <p className="text-sm font-medium">{toast.title}</p>
        {toast.body ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{toast.body}</p>
        ) : null}
      </div>
    </div>
  );
}
