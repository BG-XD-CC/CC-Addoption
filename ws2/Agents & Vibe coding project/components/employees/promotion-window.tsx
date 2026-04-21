"use client";

import { TrendingUp, Clock, AlertTriangle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getPromotionWindow } from "@/lib/calculations";

export function PromotionIndicator({ hireDate }: { hireDate: Date }) {
  const { yearsInRole, urgency } = getPromotionWindow(hireDate);

  if (urgency === "not-yet") {
    return (
      <Tooltip>
        <TooltipTrigger>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </TooltipTrigger>
        <TooltipContent>
          <p>{yearsInRole < 1 ? "Less than 1 year" : `${yearsInRole} years`} in role</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  if (urgency === "approaching") {
    return (
      <Tooltip>
        <TooltipTrigger>
          <TrendingUp className="h-4 w-4 text-amber-500" />
        </TooltipTrigger>
        <TooltipContent>
          <p>Promotion window approaching ({yearsInRole}yr in role)</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger>
        <AlertTriangle className="h-4 w-4 text-red-500" />
      </TooltipTrigger>
      <TooltipContent>
        <p>Overdue for promotion review ({yearsInRole}yr in role)</p>
      </TooltipContent>
    </Tooltip>
  );
}
