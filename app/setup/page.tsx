export default function SetupPage() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-6 px-4 py-12">
      <div className="space-y-2 text-center">
        <p className="text-xs font-medium uppercase tracking-widest text-accent">
          MFO Agency
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Нужна настройка Supabase
        </h1>
        <p className="text-sm text-muted-foreground">
          База ещё не подключена. На этой машине Docker ждёт включения WSL
          (Virtual Machine Platform).
        </p>
      </div>

      <ol className="space-y-3 rounded-[var(--radius-xl)] border border-[var(--card-border)] bg-card p-5 text-sm leading-relaxed text-muted-foreground">
        <li>
          1. Запустите от администратора:{" "}
          <code className="text-foreground">scripts\enable-docker.ps1</code>
        </li>
        <li>2. Перезагрузите Windows.</li>
        <li>3. Откройте Docker Desktop → статус Running.</li>
        <li>
          4. В терминале:{" "}
          <code className="text-foreground">npm run setup:local</code>
        </li>
        <li>
          5. Обновите страницу или откройте{" "}
          <code className="text-foreground">/login</code>
        </li>
      </ol>

      <p className="text-center text-xs text-muted-foreground">
        Подробности: SETUP-LOCAL.md в папке проекта
      </p>
    </div>
  );
}
