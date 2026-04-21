"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarHeart, PartyPopper } from "lucide-react";
import type { CelebrationItem } from "@/types";
import { cn } from "@/lib/utils";

function getMilestoneBadgeColor(milestone: number): string {
  switch (milestone) {
    case 1: return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
    case 3: return "bg-green-500/10 text-green-600 dark:text-green-400";
    case 5: return "bg-purple-500/10 text-purple-600 dark:text-purple-400";
    case 10: return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
    case 15: return "bg-rose-500/10 text-rose-600 dark:text-rose-400";
    case 20: return "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400";
    default: return "bg-muted text-muted-foreground";
  }
}

export function AnniversaryRadar({
  celebrations,
}: {
  celebrations: CelebrationItem[];
}) {
  if (celebrations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarHeart className="h-5 w-5" />
            Anniversary Radar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No upcoming anniversaries in the next 90 days.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarHeart className="h-5 w-5" />
          Anniversary Radar
          <Badge variant="secondary" className="ml-auto">
            {celebrations.length} upcoming
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {celebrations.map((item, idx) => (
          <div
            key={idx}
            className={cn(
              "flex items-center justify-between rounded-lg border p-3 transition-colors",
              item.daysUntil <= 0 && "border-primary/50 bg-primary/5",
              item.daysUntil > 0 && item.daysUntil <= 30 && "border-amber-500/30"
            )}
          >
            <div className="flex items-center gap-3">
              {item.daysUntil <= 0 ? (
                <PartyPopper className="h-5 w-5 text-primary animate-pulse" />
              ) : (
                <CalendarHeart className={cn(
                  "h-5 w-5",
                  item.daysUntil <= 30 ? "text-amber-500 animate-pulse" : "text-muted-foreground"
                )} />
              )}
              <div>
                <p className="font-medium text-sm">
                  {item.employee.firstName} {item.employee.lastName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {item.employee.department.name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={cn("text-xs", getMilestoneBadgeColor(item.milestone))}
              >
                {item.type}
              </Badge>
              <span className="text-xs text-muted-foreground w-16 text-right">
                {item.daysUntil <= 0 ? "Today!" : `${item.daysUntil}d`}
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
