"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function RevenueChart({
  data,
}: {
  data: { month: string; receita: number; gastos: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="receitaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C8FF4D" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#C8FF4D" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gastosFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5C8A7C" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#5C8A7C" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#262A32" vertical={false} />
        <XAxis
          dataKey="month"
          stroke="#9A9FAA"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#9A9FAA"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v / 100}k`}
        />
        <Tooltip
          contentStyle={{
            background: "#181B21",
            border: "1px solid #262A32",
            borderRadius: 8,
            fontSize: 13,
          }}
          labelStyle={{ color: "#EDEEF0" }}
          formatter={(value: number) =>
            value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
          }
        />
        <Area
          type="monotone"
          dataKey="receita"
          stroke="#C8FF4D"
          strokeWidth={2}
          fill="url(#receitaFill)"
          name="Receita"
        />
        <Area
          type="monotone"
          dataKey="gastos"
          stroke="#5C8A7C"
          strokeWidth={2}
          fill="url(#gastosFill)"
          name="Gastos"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
