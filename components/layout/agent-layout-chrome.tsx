"use client";

import { TabBar } from "@/components/layout/app-shell";
import { agentNav } from "@/components/layout/nav-config";

/** Persistent tab bar — must live in agent layout so the pill can slide between routes. */
export function AgentLayoutChrome({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <TabBar items={agentNav} />
    </>
  );
}
