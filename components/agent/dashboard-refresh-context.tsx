"use client";

import {
  createContext,
  useContext,
  useTransition,
  type ReactNode,
} from "react";

type Ctx = {
  isPending: boolean;
  refresh: (action: () => void) => void;
};

const DashboardRefreshContext = createContext<Ctx | null>(null);

export function DashboardRefreshProvider({ children }: { children: ReactNode }) {
  const [isPending, startTransition] = useTransition();

  return (
    <DashboardRefreshContext.Provider
      value={{
        isPending,
        refresh: (action) => startTransition(action),
      }}
    >
      {children}
    </DashboardRefreshContext.Provider>
  );
}

export function useDashboardRefresh() {
  const ctx = useContext(DashboardRefreshContext);
  if (!ctx) {
    return { isPending: false, refresh: (fn: () => void) => fn() };
  }
  return ctx;
}
