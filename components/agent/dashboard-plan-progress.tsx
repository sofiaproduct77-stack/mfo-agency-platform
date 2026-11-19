import type { Plan } from "@/types/database";
import { cn, formatShortDate } from "@/lib/utils";

function salesRemainingLabel(remaining: number) {
  if (remaining <= 0) return "План выполнен";
  const n = remaining;
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `Осталась ${n} продажа`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
    return `Осталось ${n} продажи`;
  }
  return `Осталось ${n} продаж`;
}

function ProgressRing({
  percent,
  size = 128,
  complete,
}: {
  percent: number;
  size?: number;
  complete: boolean;
}) {
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, percent));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="-rotate-90 shrink-0 drop-shadow-[0_0_18px_rgba(59,130,246,0.35)]"
      aria-hidden
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        className="progress-ring-track"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className={cn(
          "transition-[stroke-dashoffset] duration-700 ease-out",
          complete ? "text-success" : "text-accent",
        )}
      />
    </svg>
  );
}

export function DashboardProgressStrip({
  plan,
  planSales,
}: {
  plan: Plan | null;
  planSales: number;
}) {
  if (!plan || plan.target_sales <= 0) return null;

  const target = plan.target_sales;
  const percent = (planSales / target) * 100;
  const remaining = Math.max(0, target - planSales);
  const complete = planSales >= target;

  return (
    <section
      aria-label="Прогресс по плану"
      className="metric-item metric-item-delay-3 flex flex-col items-center px-2 py-6 text-center"
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        Прогресс
      </p>
      <div
        className={cn(
          "relative mt-4 flex h-32 w-32 items-center justify-center",
          complete && "progress-medallion-glow rounded-full",
        )}
      >
        <ProgressRing percent={percent} complete={complete} />
        <span className="absolute text-base font-semibold tabular-nums text-muted-foreground">
          {Math.min(100, Math.round(percent))}%
        </span>
      </div>
      <p className="mt-5 tabular-nums text-4xl font-semibold leading-none tracking-tight">
        {planSales}
        <span className="text-2xl font-normal text-muted-foreground">
          {" "}
          / {target}
        </span>
      </p>
      <p
        className={cn(
          "mt-2 text-sm",
          complete ? "font-medium text-success" : "text-muted-foreground",
        )}
      >
        {salesRemainingLabel(remaining)}
      </p>
      <p className="mt-1 text-[11px] text-muted-foreground/80">
        {formatShortDate(plan.period_start)} — {formatShortDate(plan.period_end)}
      </p>
    </section>
  );
}
