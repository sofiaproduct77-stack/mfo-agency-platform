"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { PeriodKey } from "@/lib/analytics/aggregates";
import { useDashboardRefresh } from "@/components/agent/dashboard-refresh-context";
import { ChevronDown } from "lucide-react";

const options: { key: PeriodKey; label: string }[] = [
  { key: "day", label: "День" },
  { key: "week", label: "Неделя" },
  { key: "month", label: "Месяц" },
];

export function PeriodSelectButton({ active }: { active: PeriodKey }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { refresh } = useDashboardRefresh();
  const rootRef = useRef<HTMLDivElement>(null);
  const activeLabel = options.find((o) => o.key === active)?.label ?? "Месяц";

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  function select(key: PeriodKey) {
    if (key === active) {
      setOpen(false);
      return;
    }
    setOpen(false);
    refresh(() => {
      router.push(`/agent/dashboard?period=${key}`);
    });
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "surface-flat flex w-full items-center justify-between px-4 py-3 text-left transition-all duration-200",
          open && "ring-1 ring-accent/20",
        )}
      >
        <span className="text-sm text-muted-foreground">Период статистики</span>
        <span className="flex items-center gap-1 text-sm font-medium text-foreground">
          {activeLabel}
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-200",
              open && "rotate-180",
            )}
          />
        </span>
      </button>
      {open ? (
        <ul
          className="surface-flat absolute inset-x-0 top-full z-30 mt-2 overflow-hidden py-1 animate-fade-in"
          role="listbox"
        >
          {options.map((opt) => (
            <li key={opt.key}>
              <button
                type="button"
                role="option"
                aria-selected={active === opt.key}
                onClick={() => select(opt.key)}
                className={cn(
                  "flex w-full px-4 py-2.5 text-left text-sm transition-colors",
                  active === opt.key
                    ? "bg-accent/15 font-medium text-accent"
                    : "text-foreground hover:bg-muted/60",
                )}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
