"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["#C8FF4D", "#5C8A7C", "#3E6259", "#4A4F5A"];

export default function PaymentDonut({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  return (
    <div className="flex items-center gap-6">
      <div className="h-[160px] w-[160px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={48}
              outerRadius={72}
              paddingAngle={3}
              stroke="none"
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "#181B21",
                border: "1px solid #262A32",
                borderRadius: 8,
                fontSize: 13,
              }}
              formatter={(value: number) => `${value}%`}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="space-y-2 text-sm">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center gap-2 text-ink-soft">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            />
            {d.name}
            <span className="text-ink ml-auto">{d.value}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
