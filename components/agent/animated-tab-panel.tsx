"use client";

import type { ReactNode } from "react";

export function AnimatedTabPanel({
  tabKey,
  children,
}: {
  tabKey: string;
  children: ReactNode;
}) {
  return (
    <div key={tabKey} className="animate-tab-enter space-y-4">
      {children}
    </div>
  );
}
