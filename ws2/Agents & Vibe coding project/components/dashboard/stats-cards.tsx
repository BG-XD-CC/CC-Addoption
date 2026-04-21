"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Users, Clock, Wifi, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedContainer, AnimatedItem } from "@/components/shared/animated-container";

interface StatsCardsProps {
  totalEmployees: number;
  avgTenureYears: number;
  remotePercentage: number;
  activePercentage: number;
  newHiresLast90Days: number;
  avgSalary: number;
  onLeaveCount: number;
}

const ACCENT_COLORS = [
  "border-t-blue-500",
  "border-t-violet-500",
  "border-t-cyan-500",
  "border-t-emerald-500",
];

export function StatsCards(props: StatsCardsProps) {
  const cards = [
    {
      label: "Total Employees",
      icon: Users,
      value: props.totalEmployees.toString(),
      sub: `${props.newHiresLast90Days} hired last 90d`,
      href: "/employees",
      accent: ACCENT_COLORS[0],
    },
    {
      label: "Avg Tenure",
      icon: Clock,
      value: `${props.avgTenureYears} yrs`,
      sub: `$${(props.avgSalary / 1000).toFixed(0)}k avg salary`,
      href: "/employees",
      accent: ACCENT_COLORS[1],
    },
    {
      label: "Remote",
      icon: Wifi,
      value: `${props.remotePercentage}%`,
      sub: `${Math.round((props.remotePercentage / 100) * props.totalEmployees)} employees`,
      href: "/employees",
      accent: ACCENT_COLORS[2],
    },
    {
      label: "Active",
      icon: Activity,
      value: `${props.activePercentage}%`,
      sub: `${props.onLeaveCount} on leave`,
      href: "/employees",
      accent: ACCENT_COLORS[3],
      subHighlight: props.onLeaveCount > 0,
    },
  ];

  return (
    <AnimatedContainer className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <AnimatedItem key={card.label}>
          <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
            <Link href={card.href}>
              <Card className={`border-t-2 ${card.accent} cursor-pointer transition-colors hover:border-primary/50`}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {card.label}
                  </CardTitle>
                  <card.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{card.value}</div>
                  <p
                    className={`text-xs mt-1 ${
                      card.subHighlight
                        ? "text-amber-500 font-medium"
                        : "text-muted-foreground"
                    }`}
                  >
                    {card.sub}
                  </p>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        </AnimatedItem>
      ))}
    </AnimatedContainer>
  );
}
