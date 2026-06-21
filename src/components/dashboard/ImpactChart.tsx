"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface ImpactChartPoint {
  name: string;
  attendance: number;
  quiz: number;
  employability: number;
}

export interface ImpactChartProps {
  data: ImpactChartPoint[];
}

export function ImpactChart({ data }: ImpactChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
        No impact data available yet.
      </div>
    );
  }

  return (
    <div className="h-80 w-full" aria-label="Learner impact metrics chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tickLine={false} axisLine={false} />
          <YAxis domain={[0, 100]} tickLine={false} axisLine={false} />
          <Tooltip cursor={{ fill: "rgba(0, 0, 0, 0.04)" }} />
          <Legend />
          <Bar
            dataKey="attendance"
            name="Attendance %"
            fill="#f97316"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="quiz"
            name="Quiz %"
            fill="#2563eb"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="employability"
            name="Employability"
            fill="#059669"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
