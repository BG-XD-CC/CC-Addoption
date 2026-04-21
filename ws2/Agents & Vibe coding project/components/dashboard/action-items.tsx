"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, AlertCircle, FileWarning, UserX, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ActionItem } from "@/types";

const typeConfig = {
  "missing-contract": { icon: FileWarning, color: "text-red-500" },
  "incomplete-onboarding": { icon: AlertCircle, color: "text-red-500" },
  "on-leave": { icon: UserX, color: "text-amber-500" },
  "promotion-overdue": { icon: TrendingUp, color: "text-amber-500" },
} as const;

const typeLabels: Record<ActionItem["type"], string> = {
  "missing-contract": "Contract",
  "incomplete-onboarding": "Onboarding",
  "on-leave": "On Leave",
  "promotion-overdue": "Promotion",
};

export function ActionItems({ items }: { items: ActionItem[] }) {
  const [activeFilters, setActiveFilters] = useState<Set<ActionItem["type"]>>(new Set());

  const types = Array.from(new Set(items.map((i) => i.type)));

  const filtered =
    activeFilters.size === 0
      ? items
      : items.filter((i) => activeFilters.has(i.type));

  function toggleFilter(type: ActionItem["type"]) {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle>Action Required</CardTitle>
            <Badge variant="destructive">{filtered.length}</Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 pt-2">
          {types.map((type) => {
            const active = activeFilters.has(type);
            return (
              <button
                key={type}
                onClick={() => toggleFilter(type)}
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors cursor-pointer ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {typeLabels[type]}
                <span className="ml-1 opacity-70">
                  ({items.filter((i) => i.type === type).length})
                </span>
              </button>
            );
          })}
        </div>
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No action items — everything looks good!
          </p>
        ) : (
          <div className="space-y-1 max-h-[360px] overflow-y-auto">
            {filtered.map((item) => {
              const config = typeConfig[item.type];
              const Icon = config.icon;
              return (
                <Link
                  key={item.id}
                  href={`/employees/${item.employeeId}`}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-accent group"
                >
                  <span
                    className={`h-2 w-2 rounded-full shrink-0 ${
                      item.urgency === "high" ? "bg-red-500" : "bg-amber-500"
                    }`}
                  />
                  <Icon className={`h-4 w-4 shrink-0 ${config.color}`} />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium truncate block">
                      {item.employeeName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {item.label}
                    </span>
                  </div>
                  <Badge variant="outline" className="shrink-0 text-xs">
                    {item.department}
                  </Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
