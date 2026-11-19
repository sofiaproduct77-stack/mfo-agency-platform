"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const THRESHOLD = 72;

export function PullToRefresh({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const startY = useRef(0);
  const pulling = useRef(false);
  const [offset, setOffset] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY > 0 || refreshing) return;
    startY.current = e.touches[0]?.clientY ?? 0;
    pulling.current = true;
  }, [refreshing]);

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!pulling.current || refreshing) return;
      const y = e.touches[0]?.clientY ?? 0;
      const diff = Math.max(0, Math.min(y - startY.current, THRESHOLD * 1.5));
      if (diff > 0 && window.scrollY === 0) {
        setOffset(diff);
      }
    },
    [refreshing],
  );

  const onTouchEnd = useCallback(async () => {
    if (!pulling.current) return;
    pulling.current = false;
    if (offset >= THRESHOLD && !refreshing) {
      setRefreshing(true);
      setOffset(THRESHOLD * 0.6);
      router.refresh();
      await new Promise((r) => setTimeout(r, 600));
      setRefreshing(false);
    }
    setOffset(0);
  }, [offset, refreshing, router]);

  const progress = Math.min(1, offset / THRESHOLD);
  const ringSize = 28;
  const stroke = 3;
  const r = (ringSize - stroke) / 2;
  const c = 2 * Math.PI * r;

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className="relative touch-pan-y"
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 flex flex-col items-center justify-end transition-opacity",
          offset > 8 || refreshing ? "opacity-100" : "opacity-0",
        )}
        style={{ height: Math.max(offset, refreshing ? 48 : 0) }}
      >
        <svg
          width={ringSize}
          height={ringSize}
          className={cn("-rotate-90", refreshing && "animate-spin")}
          style={refreshing ? { animationDuration: "0.9s" } : undefined}
          aria-hidden
        >
          <circle
            cx={ringSize / 2}
            cy={ringSize / 2}
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            className="text-muted"
          />
          <circle
            cx={ringSize / 2}
            cy={ringSize / 2}
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={refreshing ? c * 0.25 : c * (1 - progress)}
            className="text-accent"
          />
        </svg>
        <span className="mt-1 text-[10px] text-muted-foreground">
          {refreshing
            ? "Обновление…"
            : offset >= THRESHOLD
              ? "Отпустите"
              : "Потяните"}
        </span>
      </div>
      <div
        style={{
          transform: offset ? `translateY(${offset * 0.35}px)` : undefined,
          transition: pulling.current ? "none" : "transform 0.25s ease-out",
        }}
      >
        {children}
      </div>
    </div>
  );
}
