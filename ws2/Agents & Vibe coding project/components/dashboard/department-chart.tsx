"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DepartmentStat } from "@/types";

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

type View = "headcount" | "salary";

export function DepartmentChart({ data }: { data: DepartmentStat[] }) {
  const [view, setView] = useState<View>("headcount");
  const router = useRouter();

  const dataKey = view === "headcount" ? "count" : "avgSalary";
  const formatter =
    view === "salary"
      ? (value: number) => `$${(value / 1000).toFixed(0)}k`
      : (value: number) => value.toString();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Employees by Department</CardTitle>
          <div className="flex rounded-lg border border-border overflow-hidden text-xs">
            <button
              onClick={() => setView("headcount")}
              className={`px-3 py-1 transition-colors cursor-pointer ${
                view === "headcount"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent"
              }`}
            >
              Headcount
            </button>
            <button
              onClick={() => setView("salary")}
              className={`px-3 py-1 transition-colors cursor-pointer ${
                view === "salary"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent"
              }`}
            >
              Avg Salary
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={data}
            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
            onClick={(state) => {
              if (state?.activeLabel) {
                router.push(`/employees?department=${encodeURIComponent(state.activeLabel)}`);
              }
            }}
            style={{ cursor: "pointer" }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="name"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              tickFormatter={view === "salary" ? (v: number) => `$${(v / 1000).toFixed(0)}k` : undefined}
            />
            <Tooltip
              formatter={(value) => [formatter(Number(value)), view === "headcount" ? "Employees" : "Avg Salary"]}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                color: "hsl(var(--card-foreground))",
              }}
            />
            <Bar dataKey={dataKey} radius={[4, 4, 0, 0]}>
              {data.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
