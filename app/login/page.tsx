import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-12">
      <div className="mb-8 space-y-2 text-center">
        <p className="text-xs font-medium uppercase tracking-widest text-accent">
          MFO Agency
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Вход в платформу
        </h1>
        <p className="text-sm text-muted-foreground">
          Доступ только для сотрудников агентства
        </p>
      </div>
      <div className="rounded-[var(--radius-xl)] border border-[var(--card-border)] bg-card p-6">
        <LoginForm />
      </div>
    </div>
  );
}
