import type { Employee, Department } from "@prisma/client";

export type EmploymentType = "Remote" | "Hybrid" | "On-site";
export type EmployeeStatus = "Active" | "On Leave" | "Offboarded";
export type TenureBracket = "<1 year" | "1-3 years" | "3-5 years" | "5+ years";

export type EmployeeWithDepartment = Employee & {
  department: Department;
};

export type EmployeeWithRelations = Employee & {
  department: Department;
  manager: Employee | null;
  directReports: Employee[];
};

export interface TenureInfo {
  years: number;
  months: number;
  display: string;
}

export interface PromotionWindow {
  eligible: boolean;
  yearsInRole: number;
  urgency: "not-yet" | "approaching" | "overdue";
}

export interface CelebrationItem {
  employee: EmployeeWithDepartment;
  milestone: number;
  daysUntil: number;
  anniversaryDate: Date;
  type: string;
}

export interface ActionItem {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  type: "missing-contract" | "incomplete-onboarding" | "on-leave" | "promotion-overdue";
  label: string;
  urgency: "high" | "medium";
}

export interface EmploymentTypeCount {
  type: string;
  count: number;
  percentage: number;
}

export interface DepartmentStat {
  name: string;
  count: number;
  avgSalary: number;
}

export interface DepartmentLead {
  id: string;
  name: string;
  role: string;
  avatar: string | null;
  department: string;
  reportsCount: number;
}

export interface DashboardData {
  totalEmployees: number;
  avgTenureYears: number;
  remotePercentage: number;
  activePercentage: number;
  departmentCounts: { name: string; count: number }[];
  celebrations: CelebrationItem[];
  actionItems: ActionItem[];
  employmentTypeCounts: EmploymentTypeCount[];
  departmentStats: DepartmentStat[];
  departmentLeads: DepartmentLead[];
  onLeaveCount: number;
  newHiresLast90Days: number;
  avgSalary: number;
}
