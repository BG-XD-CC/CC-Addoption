"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { AnimatedContainer, AnimatedItem } from "@/components/shared/animated-container";
import type { DepartmentLead } from "@/types";

export function DepartmentLeads({ leads }: { leads: DepartmentLead[] }) {
  if (leads.length === 0) return null;

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Team Leads</h3>
      <AnimatedContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {leads.map((lead) => (
          <AnimatedItem key={lead.id}>
            <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
              <Link href={`/employees/${lead.id}`}>
                <Card className="cursor-pointer transition-colors hover:border-primary/50">
                  <CardContent className="flex flex-col items-center gap-3 pt-6 pb-4 text-center">
                    <Avatar size="lg">
                      {lead.avatar && <AvatarImage src={lead.avatar} alt={lead.name} />}
                      <AvatarFallback>
                        {lead.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold">{lead.name}</p>
                      <p className="text-xs text-muted-foreground">{lead.role}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {lead.department}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>{lead.reportsCount} direct reports</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          </AnimatedItem>
        ))}
      </AnimatedContainer>
    </div>
  );
}
