"use client";

import { Badge } from "@/components/ui/badge";
import { getTenureBracket, calculateTenure } from "@/lib/calculations";
import { cn } from "@/lib/utils";

const bracketColors: Record<string, string> = {
  "<1 year": "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  "1-3 years": "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  "3-5 years": "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  "5+ years": "bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

export function TenureBadge({ hireDate }: { hireDate: Date }) {
  const tenure = calculateTenure(hireDate);
  const bracket = getTenureBracket(hireDate);

  return (
    <Badge variant="outline" className={cn("text-xs", bracketColors[bracket])}>
      {tenure.display}
    </Badge>
  );
}
