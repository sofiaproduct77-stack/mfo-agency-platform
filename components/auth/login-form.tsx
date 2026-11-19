"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

function normalizeLoginEmail(email: string) {
  return email
    .trim()
    .toLowerCase()
    .replace(/@mfo\.agency\.local$/i, "@mfo-agency.local");
}

function loginErrorMessage(message: string) {
  if (/fetch|network|failed to fetch/i.test(message)) {
    return "Нет связи с сервером. Проверьте Wi‑Fi и что ПК с проектом включён.";
  }
  return "Неверный email или пароль";
}

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const form = e.currentTarget;
    const email = normalizeLoginEmail(String(new FormData(form).get("email") ?? ""));
    const password = String(new FormData(form).get("password") ?? "");

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(loginErrorMessage(signInError.message));
      setPending(false);
      return;
    }

    router.refresh();
    router.replace("/");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm text-muted-foreground" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="agent@mfo-agency.local"
          className="h-11 w-full rounded-xl border border-[var(--card-border)] bg-muted px-3 text-sm outline-none ring-accent focus:ring-2"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm text-muted-foreground" htmlFor="password">
          Пароль
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={6}
          className="h-11 w-full rounded-xl border border-[var(--card-border)] bg-muted px-3 text-sm outline-none ring-accent focus:ring-2"
        />
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <p className="text-xs text-muted-foreground">
        Демо: <span className="font-mono">agent@mfo-agency.local</span> — между mfo и
        agency <strong>дефис</strong>, не точка.
      </p>
      <Button type="submit" className="w-full" loading={pending}>
        Войти
      </Button>
    </form>
  );
}
