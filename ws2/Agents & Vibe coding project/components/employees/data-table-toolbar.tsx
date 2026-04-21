"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Plus, Search, X } from "lucide-react";
import type { TenureBracket } from "@/types";

interface ToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  department: string;
  onDepartmentChange: (value: string | null) => void;
  tenure: string;
  onTenureChange: (value: string | null) => void;
  status: string;
  onStatusChange: (value: string | null) => void;
  departments: string[];
  onAddEmployee: () => void;
}

const tenureBrackets: TenureBracket[] = ["<1 year", "1-3 years", "3-5 years", "5+ years"];
const statuses = ["Active", "On Leave", "Offboarded"];

export function DataTableToolbar({
  search,
  onSearchChange,
  department,
  onDepartmentChange,
  tenure,
  onTenureChange,
  status,
  onStatusChange,
  departments,
  onAddEmployee,
}: ToolbarProps) {
  const hasFilters = department || tenure || status || search;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
      <div className="flex flex-1 items-center gap-2 flex-wrap">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 w-64"
          />
        </div>
        <Select value={department} onValueChange={onDepartmentChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            {departments.map((d) => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={tenure} onValueChange={onTenureChange}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Tenure" />
          </SelectTrigger>
          <SelectContent>
            {tenureBrackets.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statuses.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onSearchChange("");
              onDepartmentChange("");
              onTenureChange("");
              onStatusChange("");
            }}
          >
            <X className="mr-1 h-4 w-4" />
            Clear
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <a href="/api/employees/export">
          <Button variant="outline" size="sm">
            <Download className="mr-1 h-4 w-4" />
            Export
          </Button>
        </a>
        <Button size="sm" onClick={onAddEmployee}>
          <Plus className="mr-1 h-4 w-4" />
          Add Employee
        </Button>
      </div>
    </div>
  );
}
