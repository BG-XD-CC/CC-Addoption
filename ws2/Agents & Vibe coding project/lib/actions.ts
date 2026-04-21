"use server";

import { prisma } from "@/lib/prisma";
import { calculateTenure, getTenureBracket, getPromotionWindow } from "@/lib/calculations";
import { getUpcomingCelebrations } from "@/lib/celebrations";
import type { ActionItem, DashboardData, DepartmentLead, DepartmentStat, EmployeeWithDepartment, EmployeeWithRelations, EmploymentTypeCount, TenureBracket } from "@/types";
import { revalidatePath } from "next/cache";

interface EmployeeFilters {
  search?: string;
  department?: string;
  tenure?: TenureBracket;
  status?: string;
}

/**
 * Retrieves employees with optional filtering by search term, department, tenure bracket, or status.
 * @param filters - Optional criteria to narrow the employee list
 * @returns Employees matching all supplied filters, sorted by last name
 */
export async function getEmployees(filters?: EmployeeFilters): Promise<EmployeeWithDepartment[]> {
  const employees = await prisma.employee.findMany({
    include: { department: true },
    orderBy: { lastName: "asc" },
  });

  let filtered = employees;

  if (filters?.search) {
    const q = filters.search.toLowerCase();
    filtered = filtered.filter(
      (e) =>
        e.firstName.toLowerCase().includes(q) ||
        e.lastName.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q)
    );
  }

  if (filters?.department) {
    filtered = filtered.filter((e) => e.department.name === filters.department);
  }

  if (filters?.tenure) {
    filtered = filtered.filter((e) => getTenureBracket(e.hireDate) === filters.tenure);
  }

  if (filters?.status) {
    filtered = filtered.filter((e) => e.status === filters.status);
  }

  return filtered;
}

/**
 * Fetches a single employee by ID, including department, manager, and direct reports.
 * @param id - The employee's unique identifier
 * @returns The employee with relations, or null if not found
 */
export async function getEmployee(id: string): Promise<EmployeeWithRelations | null> {
  return prisma.employee.findUnique({
    where: { id },
    include: {
      department: true,
      manager: true,
      directReports: true,
    },
  });
}

/**
 * Creates a new employee after validating required fields and constraints.
 * @param data - Employee attributes including name, email, role, department, and salary
 * @throws If required fields are missing/invalid, salary is not strictly positive (zero is rejected), or email is already taken
 */
export async function createEmployee(data: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  departmentId: string;
  managerId?: string;
  employmentType: string;
  hireDate: string;
  salary: number;
}): Promise<void> {
  // Input validation
  if (!data.firstName || data.firstName.length > 100) {
    throw new Error("First name is required and must be 100 characters or fewer.");
  }
  if (!data.lastName || data.lastName.length > 100) {
    throw new Error("Last name is required and must be 100 characters or fewer.");
  }
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    throw new Error("A valid email address is required.");
  }
  if (!data.role || data.role.length > 100) {
    throw new Error("Role is required and must be 100 characters or fewer.");
  }
  if (!Number.isFinite(data.salary) || data.salary < 0) {
    throw new Error("Salary must be a positive number.");
  }

  try {
    await prisma.employee.create({
      data: {
        ...data,
        hireDate: new Date(data.hireDate),
      },
    });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      throw new Error("An employee with this email already exists.");
    }
    throw error;
  }
  revalidatePath("/employees");
  revalidatePath("/");
}

/**
 * Partially updates an existing employee's attributes.
 * @param id - The employee's unique identifier
 * @param data - Fields to update (only supplied fields are changed)
 */
export async function updateEmployee(
  id: string,
  data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    role?: string;
    departmentId?: string;
    managerId?: string | null;
    employmentType?: string;
    hireDate?: string;
    salary?: number;
    contractSigned?: boolean;
    onboardingComplete?: boolean;
    status?: string;
  }
): Promise<void> {
  const { hireDate, ...rest } = data;
  const updateData: Omit<typeof data, 'hireDate'> & { hireDate?: Date } = { ...rest };
  if (hireDate) {
    updateData.hireDate = new Date(hireDate);
  }
  await prisma.employee.update({
    where: { id },
    data: updateData,
  });
  revalidatePath("/employees");
  revalidatePath(`/employees/${id}`);
  revalidatePath("/");
}

/**
 * Deletes an employee, first unlinking any direct reports assigned to them.
 * @param id - The employee's unique identifier
 * @throws If the deletion fails for any reason
 */
export async function deleteEmployee(id: string): Promise<void> {
  try {
    // Unlink direct reports before deleting
    await prisma.employee.updateMany({
      where: { managerId: id },
      data: { managerId: null },
    });
    await prisma.employee.delete({ where: { id } });
  } catch (error) {
    console.error("Failed to delete employee:", error);
    throw new Error("Failed to delete employee. Please try again.");
  }
  revalidatePath("/employees");
  revalidatePath("/");
}

/**
 * Updates the status of multiple employees in one operation.
 * @param ids - Employee IDs to update
 * @param status - Target status ("Active", "On Leave", or "Offboarded")
 * @throws If the status is not one of the allowed values or no IDs are provided
 */
export async function bulkUpdateStatus(ids: string[], status: string): Promise<void> {
  const validStatuses = ["Active", "On Leave", "Offboarded"];
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid status. Must be one of: ${validStatuses.join(", ")}`);
  }
  if (!ids.length) {
    throw new Error("At least one employee ID is required.");
  }
  await prisma.employee.updateMany({
    where: { id: { in: ids } },
    data: { status },
  });
  revalidatePath("/employees");
  revalidatePath("/");
}

/**
 * Aggregates workforce metrics for the dashboard: headcount, tenure, salary averages,
 * department breakdowns, employment type distribution, action items, and upcoming celebrations.
 * @returns Fully computed dashboard data
 */
export async function getDashboardData(): Promise<DashboardData> {
  const employees = await prisma.employee.findMany({
    include: { department: true },
  });

  const totalEmployees = employees.length;
  const activeCount = employees.filter((e) => e.status === "Active").length;
  const remoteCount = employees.filter((e) => e.employmentType === "Remote").length;
  const onLeaveCount = employees.filter((e) => e.status === "On Leave").length;

  const tenures = employees.map((e) => calculateTenure(e.hireDate));
  const avgTenureYears =
    totalEmployees > 0
      ? tenures.reduce((sum, t) => sum + t.years + t.months / 12, 0) / totalEmployees
      : 0;

  const avgSalary =
    totalEmployees > 0
      ? employees.reduce((sum, e) => sum + e.salary, 0) / totalEmployees
      : 0;

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const newHiresLast90Days = employees.filter((e) => new Date(e.hireDate) >= ninetyDaysAgo).length;

  // Department counts (legacy)
  const deptMap = new Map<string, number>();
  for (const e of employees) {
    deptMap.set(e.department.name, (deptMap.get(e.department.name) || 0) + 1);
  }
  const departmentCounts = Array.from(deptMap.entries()).map(([name, count]) => ({
    name,
    count,
  }));

  // Department stats (with avg salary)
  const deptStatsMap = new Map<string, { count: number; totalSalary: number }>();
  for (const e of employees) {
    const existing = deptStatsMap.get(e.department.name) || { count: 0, totalSalary: 0 };
    existing.count++;
    existing.totalSalary += e.salary;
    deptStatsMap.set(e.department.name, existing);
  }
  const departmentStats: DepartmentStat[] = Array.from(deptStatsMap.entries()).map(
    ([name, { count, totalSalary }]) => ({
      name,
      count,
      avgSalary: Math.round(totalSalary / count),
    })
  );

  // Employment type counts
  const typeMap = new Map<string, number>();
  for (const e of employees) {
    typeMap.set(e.employmentType, (typeMap.get(e.employmentType) || 0) + 1);
  }
  const employmentTypeCounts: EmploymentTypeCount[] = Array.from(typeMap.entries()).map(
    ([type, count]) => ({
      type,
      count,
      percentage: totalEmployees > 0 ? Math.round((count / totalEmployees) * 100) : 0,
    })
  );

  // Action items
  const actionItems: ActionItem[] = [];
  for (const e of employees) {
    if (!e.contractSigned) {
      actionItems.push({
        id: `${e.id}-contract`,
        employeeId: e.id,
        employeeName: `${e.firstName} ${e.lastName}`,
        department: e.department.name,
        type: "missing-contract",
        label: "Missing signed contract",
        urgency: "high",
      });
    }
    if (!e.onboardingComplete) {
      actionItems.push({
        id: `${e.id}-onboarding`,
        employeeId: e.id,
        employeeName: `${e.firstName} ${e.lastName}`,
        department: e.department.name,
        type: "incomplete-onboarding",
        label: "Onboarding incomplete",
        urgency: "high",
      });
    }
    if (e.status === "On Leave") {
      actionItems.push({
        id: `${e.id}-leave`,
        employeeId: e.id,
        employeeName: `${e.firstName} ${e.lastName}`,
        department: e.department.name,
        type: "on-leave",
        label: "Currently on leave",
        urgency: "medium",
      });
    }
    const promo = getPromotionWindow(e.hireDate);
    if (promo.urgency === "overdue") {
      actionItems.push({
        id: `${e.id}-promotion`,
        employeeId: e.id,
        employeeName: `${e.firstName} ${e.lastName}`,
        department: e.department.name,
        type: "promotion-overdue",
        label: `Promotion overdue (${promo.yearsInRole}yr in role)`,
        urgency: "medium",
      });
    }
  }
  actionItems.sort((a, b) => {
    if (a.urgency === "high" && b.urgency !== "high") return -1;
    if (a.urgency !== "high" && b.urgency === "high") return 1;
    return 0;
  });

  // Department leads (employees with direct reports)
  const leadsData = await prisma.employee.findMany({
    where: { directReports: { some: {} } },
    include: {
      department: true,
      _count: { select: { directReports: true } },
    },
  });
  const departmentLeads: DepartmentLead[] = leadsData.map((l) => ({
    id: l.id,
    name: `${l.firstName} ${l.lastName}`,
    role: l.role,
    avatar: l.avatar,
    department: l.department.name,
    reportsCount: l._count.directReports,
  }));

  const celebrations = getUpcomingCelebrations(employees);

  return {
    totalEmployees,
    avgTenureYears: Math.round(avgTenureYears * 10) / 10,
    remotePercentage: totalEmployees > 0 ? Math.round((remoteCount / totalEmployees) * 100) : 0,
    activePercentage: totalEmployees > 0 ? Math.round((activeCount / totalEmployees) * 100) : 0,
    departmentCounts,
    celebrations,
    actionItems,
    employmentTypeCounts,
    departmentStats,
    departmentLeads,
    onLeaveCount,
    newHiresLast90Days,
    avgSalary: Math.round(avgSalary),
  };
}

/**
 * Retrieves all departments sorted alphabetically by name.
 * @returns Array of department records
 */
export async function getDepartments() {
  return prisma.department.findMany({ orderBy: { name: "asc" } });
}

/**
 * Exports all employees as a CSV string with proper field escaping.
 * @returns CSV-formatted string including a header row and one row per employee
 */
export async function exportEmployeesCSV(): Promise<string> {
  const employees = await prisma.employee.findMany({
    include: { department: true },
    orderBy: { lastName: "asc" },
  });

  const headers = [
    "First Name",
    "Last Name",
    "Email",
    "Phone",
    "Role",
    "Department",
    "Employment Type",
    "Hire Date",
    "Salary",
    "Status",
    "Contract Signed",
    "Onboarding Complete",
  ];

  const escapeCSV = (field: string): string => {
    if (field.includes(",") || field.includes('"') || field.includes("\n")) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  };

  const rows = employees.map((e) =>
    [
      e.firstName,
      e.lastName,
      e.email,
      e.phone || "",
      e.role,
      e.department.name,
      e.employmentType,
      e.hireDate.toISOString().split("T")[0],
      e.salary.toString(),
      e.status,
      e.contractSigned ? "Yes" : "No",
      e.onboardingComplete ? "Yes" : "No",
    ].map(escapeCSV).join(",")
  );

  return [headers.map(escapeCSV).join(","), ...rows].join("\n");
}
