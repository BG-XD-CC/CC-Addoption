"use client";

import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EmploymentTypeCount } from "@/types";

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function EmploymentTypeChart({ data }: { data: EmploymentTypeCount[] }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const total = data.reduce((sum, d) => sum + d.count, 0);

  const hoveredItem = hoveredIndex !== null ? data[hoveredIndex] : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Employment Type</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              dataKey="count"
              nameKey="type"
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {data.map((_, index) => (
                <Cell
                  key={index}
                  fill={COLORS[index % COLORS.length]}
                  onMouseEnter={() => setHoveredIndex(index)}
                  stroke={hoveredIndex === index ? "hsl(var(--foreground))" : "transparent"}
                  strokeWidth={hoveredIndex === index ? 2 : 0}
                  style={{ cursor: "pointer", outline: "none" }}
                />
              ))}
            </Pie>
            <text
              x="50%"
              y="48%"
              textAnchor="middle"
              dominantBaseline="central"
              fill="hsl(var(--foreground))"
              fontSize={hoveredItem ? 14 : 20}
              fontWeight={hoveredItem ? 600 : 700}
            >
              {hoveredItem ? hoveredItem.type : total}
            </text>
            {hoveredItem && (
              <text
                x="50%"
                y="58%"
                textAnchor="middle"
                dominantBaseline="central"
                fill="hsl(var(--muted-foreground))"
                fontSize={12}
              >
                {hoveredItem.percentage}%
              </text>
            )}
          </PieChart>
        </ResponsiveContainer>
        <div className="flex justify-center gap-4 -mt-2">
          {data.map((entry, index) => (
            <div key={entry.type} className="flex items-center gap-1.5 text-xs">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-muted-foreground">
                {entry.type} ({entry.count})
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
