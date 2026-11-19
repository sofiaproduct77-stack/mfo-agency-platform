"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "income", label: "Начисления" },
  { id: "events", label: "События" },
] as const;

export type IncomeTab = (typeof tabs)[number]["id"];

export function IncomeSubNav({ active }: { active: IncomeTab }) {
  return (
    <div className="glass glass-dock relative flex gap-1 rounded-[1.15rem] p-1">
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          href={`/agent/income?tab=${tab.id}`}
          className={cn(
            "relative z-10 flex-1 rounded-xl py-2 text-center text-sm font-medium transition-colors duration-200",
            active === tab.id
              ? "text-foreground"
              : "text-muted-foreground",
          )}
        >
          {tab.label}
        </Link>
      ))}
      <span
        className="glass-pill glass-dock-pill absolute bottom-1 top-1 rounded-xl"
        style={{
          width: `calc((100% - 8px) / ${tabs.length})`,
          left:
            active === "income"
              ? "4px"
              : `calc(4px + (100% - 8px) / ${tabs.length})`,
        }}
        aria-hidden
      />
    </div>
  );
}
