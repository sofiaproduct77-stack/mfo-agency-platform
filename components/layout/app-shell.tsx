"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { NavIcon, NavItem } from "@/components/layout/nav-config";
import { ShellHeader } from "@/components/layout/shell-header";
import { PullToRefresh } from "@/components/layout/pull-to-refresh";
import {
  BarChart3,
  Briefcase,
  ClipboardList,
  Home,
  LayoutGrid,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

const iconMap: Record<NavIcon, LucideIcon> = {
  home: Home,
  "layout-grid": LayoutGrid,
  "clipboard-list": ClipboardList,
  wallet: Wallet,
  users: Users,
  "bar-chart-3": BarChart3,
  briefcase: Briefcase,
};

const DOCK_INSET_PX = 4;

function resolveActiveIndex(pathname: string, items: NavItem[]) {
  const idx = items.findIndex(
    ({ href }) => pathname === href || pathname.startsWith(`${href}/`),
  );
  return idx >= 0 ? idx : 0;
}

export function TabBar({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const activeIndex = useMemo(
    () => resolveActiveIndex(pathname, items),
    [pathname, items],
  );

  const segmentWidth = `calc((100% - ${DOCK_INSET_PX * 2}px) / ${items.length})`;
  const segmentLeft = `calc(${DOCK_INSET_PX}px + (100% - ${DOCK_INSET_PX * 2}px) / ${items.length} * ${activeIndex})`;

  return (
    <nav className="safe-bottom pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-2">
      <div className="glass glass-dock pointer-events-auto w-full max-w-lg px-1 py-1.5">
        <div className="relative flex items-stretch">
          <span
            className="glass-pill glass-dock-pill absolute bottom-1 top-1 rounded-xl"
            style={{
              width: segmentWidth,
              left: segmentLeft,
            }}
            aria-hidden
          />
          {items.map(({ href, label, icon }, index) => {
            const Icon = iconMap[icon];
            const active = index === activeIndex;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative z-[1] flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] transition-colors duration-200",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon
                  className="h-5 w-5 shrink-0"
                  strokeWidth={active ? 2.25 : 2}
                />
                <span className="truncate">{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

export function AppShell({
  title,
  subtitle,
  children,
  nav,
  pullToRefresh = false,
  variant = "agent",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  nav: NavItem[];
  pullToRefresh?: boolean;
  variant?: "agent" | "workspace";
}) {
  const pathname = usePathname();
  const body = pullToRefresh ? (
    <PullToRefresh>{children}</PullToRefresh>
  ) : (
    children
  );
  const dense = variant === "workspace";

  return (
    <div
      className={cn(
        "mx-auto min-h-dvh max-w-lg pb-[calc(5.75rem+env(safe-area-inset-bottom,0px))]",
        dense && "shell-workspace",
      )}
    >
      <ShellHeader title={title} subtitle={subtitle} dense={dense} />
      <main
        key={pathname}
        className={cn(
          "page-enter px-4 py-4",
          dense ? "space-y-3" : "space-y-4",
        )}
      >
        {body}
      </main>
      {variant === "workspace" ? <TabBar items={nav} /> : null}
    </div>
  );
}
