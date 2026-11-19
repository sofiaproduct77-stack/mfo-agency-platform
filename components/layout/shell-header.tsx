"use client";

import { useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { SignOutButton } from "@/components/layout/sign-out-button";

export function ShellHeader({
  title,
  subtitle,
  dense,
}: {
  title: string;
  subtitle?: string;
  dense: boolean;
}) {
  const [mounted, setMounted] = useState(false);

  useLayoutEffect(() => {
    setMounted(true);
  }, []);

  const bar = (
    <div
      className={cn(
        "glass safe-top w-full max-w-lg px-4 pb-4",
        dense ? "glass-bar" : "glass-bar-soft",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {subtitle ? (
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {subtitle}
            </p>
          ) : null}
          <h1
            className={cn(
              "font-semibold tracking-tight",
              dense ? "text-lg" : "text-xl",
            )}
          >
            {title}
          </h1>
        </div>
        <SignOutButton />
      </div>
    </div>
  );

  const header = (
    <header className="app-shell-header">
      {bar}
    </header>
  );

  return (
    <>
      <div className="shell-header-spacer" aria-hidden />
      {mounted ? createPortal(header, document.body) : header}
    </>
  );
}
