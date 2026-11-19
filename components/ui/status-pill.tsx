import { cn } from "@/lib/utils";
import type { ApplicationStatus } from "@/types/database";
import { APPLICATION_STATUS_LABELS } from "@/types/database";

const tones: Record<ApplicationStatus, { pill: string; dot: string }> = {
  link_click: {
    pill: "bg-muted text-muted-foreground",
    dot: "bg-muted-foreground",
  },
  application_submitted: {
    pill: "bg-accent/15 text-accent",
    dot: "bg-accent",
  },
  under_review: {
    pill: "bg-warning/15 text-warning",
    dot: "bg-warning",
  },
  approved: {
    pill: "bg-success/15 text-success",
    dot: "bg-success",
  },
  sale_confirmed: {
    pill: "bg-success/20 text-success",
    dot: "bg-success",
  },
  reward_accrued: {
    pill: "bg-warning/15 text-warning",
    dot: "bg-warning",
  },
  reward_paid: {
    pill: "bg-success/25 text-success",
    dot: "bg-success",
  },
  rejected: {
    pill: "bg-danger/15 text-danger",
    dot: "bg-danger",
  },
};

export function StatusPill({
  status,
  className,
}: {
  status: ApplicationStatus;
  className?: string;
}) {
  const tone = tones[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        tone.pill,
        className,
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 shrink-0 rounded-full", tone.dot)}
        aria-hidden
      />
      {APPLICATION_STATUS_LABELS[status]}
    </span>
  );
}
