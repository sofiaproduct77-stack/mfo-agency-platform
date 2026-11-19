"use client";

import { useState } from "react";
import type { Reward } from "@/types/database";
import { formatDateTime, formatMoney } from "@/lib/utils";

const PREVIEW_COUNT = 3;

function RewardRow({ reward }: { reward: Reward }) {
  return (
    <li className="surface-flat flex items-center justify-between px-3 py-3">
      <div>
        <p className="text-sm font-medium tabular-nums">
          {formatMoney(Number(reward.amount))}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatDateTime(reward.created_at)}
        </p>
      </div>
      <span
        className={
          reward.status === "paid"
            ? "text-xs text-success"
            : "text-xs text-warning"
        }
      >
        {reward.status === "paid" ? "Выплачено" : "Начислено"}
      </span>
    </li>
  );
}

export function RewardsList({ rewards }: { rewards: Reward[] }) {
  const [expanded, setExpanded] = useState(false);
  const hasMore = rewards.length > PREVIEW_COUNT;
  const visible =
    expanded || !hasMore ? rewards : rewards.slice(0, PREVIEW_COUNT);

  return (
    <div className="space-y-2">
      <ul className="space-y-2">
        {visible.map((r) => (
          <RewardRow key={r.id} reward={r} />
        ))}
      </ul>
      {hasMore ? (
        <button
          type="button"
          onClick={() => setExpanded((open) => !open)}
          className="text-left text-xs font-medium text-accent hover:underline"
        >
          {expanded ? "Скрыть" : "Показать все"}
        </button>
      ) : null}
    </div>
  );
}
