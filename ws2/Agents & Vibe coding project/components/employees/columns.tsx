"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, ArrowUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TenureBadge } from "./tenure-badge";
import { PromotionIndicator } from "./promotion-window";
import type { EmployeeWithDepartment } from "@/types";
import Link from "next/link";

const statusColors: Record<string, string> = {
  Active: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  "On Leave": "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  Offboarded: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
};

const typeColors: Record<string, string> = {
  Remote: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  Hybrid: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  "On-site": "bg-teal-500/10 text-teal-600 dark:text-teal-400",
};

export const columns: ColumnDef<EmployeeWithDepartment>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "firstName",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const emp = row.original;
      return (
        <Link href={`/employees/${emp.id}`} className="flex items-center gap-3 hover:underline">
          <Avatar className="h-8 w-8">
            <AvatarImage src={emp.avatar || undefined} alt={`${emp.firstName} ${emp.lastName}`} />
            <AvatarFallback className="text-xs">
              {emp.firstName[0]}{emp.lastName[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">{emp.firstName} {emp.lastName}</p>
            <p className="text-xs text-muted-foreground">{emp.email}</p>
          </div>
        </Link>
      );
    },
  },
  {
    accessorKey: "department",
    header: "Department",
    cell: ({ row }) => (
      <Badge variant="secondary">{row.original.department.name}</Badge>
    ),
    filterFn: (row, id, value) => {
      return value === row.original.department.name;
    },
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => (
      <span className="text-sm">{row.original.role}</span>
    ),
  },
  {
    accessorKey: "hireDate",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Tenure
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <TenureBadge hireDate={row.original.hireDate} />,
    sortingFn: (rowA, rowB) => {
      return new Date(rowA.original.hireDate).getTime() - new Date(rowB.original.hireDate).getTime();
    },
  },
  {
    id: "promotion",
    header: "Promo",
    cell: ({ row }) => <PromotionIndicator hireDate={row.original.hireDate} />,
  },
  {
    accessorKey: "employmentType",
    header: "Type",
    cell: ({ row }) => (
      <Badge variant="outline" className={typeColors[row.original.employmentType] || ""}>
        {row.original.employmentType}
      </Badge>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant="outline" className={statusColors[row.original.status] || ""}>
        {row.original.status}
      </Badge>
    ),
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const emp = row.original;
      const meta = table.options.meta as { onEdit?: (emp: EmployeeWithDepartment) => void; onDelete?: (id: string) => void } | undefined;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md h-8 w-8 p-0 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2">
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <Link href={`/employees/${emp.id}`}>
              <DropdownMenuItem>View Profile</DropdownMenuItem>
            </Link>
            <DropdownMenuItem onClick={() => meta?.onEdit?.(emp)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => meta?.onDelete?.(emp.id)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
