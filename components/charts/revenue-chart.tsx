"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatMoney, formatNumber } from "@/lib/utils";

type Point = { label: string; revenue: number; sales: number };

export function RevenueChart({ data }: { data: Point[] }) {
  if (data.every((d) => d.revenue === 0 && d.sales === 0)) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Недостаточно данных для графика
      </p>
    );
  }

  const tickIndexes = data
    .map((_, i) => i)
    .filter((i) => i === 0 || i === data.length - 1 || i % 3 === 0);

  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "#a1a1aa", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            interval={0}
            tickFormatter={(value, index) =>
              tickIndexes.includes(index) ? String(value) : ""
            }
          />
          <YAxis
            yAxisId="revenue"
            tick={{ fill: "#a1a1aa", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={44}
            tickFormatter={(v) => `${Math.round(v / 1000)}k`}
          />
          <YAxis
            yAxisId="sales"
            orientation="right"
            hide
            domain={[0, "auto"]}
          />
          <Tooltip
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--card-border)",
              borderRadius: 12,
            }}
            labelStyle={{ color: "var(--foreground)" }}
            formatter={(value: number, name: string) => {
              if (name === "revenue") return [formatMoney(value), "Доход"];
              return [formatNumber(value), "Продажи"];
            }}
          />
          <Line
            yAxisId="revenue"
            type="monotone"
            dataKey="revenue"
            stroke="var(--chart-accent)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
            connectNulls
          />
          <Line
            yAxisId="sales"
            type="monotone"
            dataKey="sales"
            stroke="var(--chart-success)"
            strokeWidth={1.5}
            strokeOpacity={0.85}
            dot={false}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
