import { RevenueChart } from "@/components/charts/revenue-chart";
import { CardTitle } from "@/components/ui/card";

type Point = { label: string; revenue: number; sales: number };

export function IncomeSalesChart({ data }: { data: Point[] }) {
  return (
    <div className="surface-flat chart-enter p-4">
      <CardTitle>Динамика продаж</CardTitle>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Синий — доход, зелёный — продажи · 14 дней
      </p>
      <div className="mt-3">
        <RevenueChart data={data} />
      </div>
    </div>
  );
}
