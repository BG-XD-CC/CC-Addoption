import type { CelebrationItem, EmployeeWithDepartment } from "@/types";

const MILESTONES = [1, 3, 5, 10, 15, 20];

function getMilestoneType(years: number): string {
  switch (years) {
    case 1: return "1st Anniversary";
    case 3: return "3rd Anniversary";
    case 5: return "5th Anniversary";
    case 10: return "Decade Milestone";
    case 15: return "15th Anniversary";
    case 20: return "20th Anniversary";
    default: return `${years}yr Anniversary`;
  }
}

/**
 * Finds employees with work-anniversary milestones (1, 3, 5, 10, 15, 20 years) falling within a rolling window.
 * @param employees - Employee records to evaluate
 * @param windowDays - Number of days ahead to look for upcoming anniversaries (default 90)
 * @returns Milestone celebrations sorted by days until the anniversary (soonest first)
 */
export function getUpcomingCelebrations(
  employees: EmployeeWithDepartment[],
  windowDays = 90
): CelebrationItem[] {
  const now = new Date();
  const celebrations: CelebrationItem[] = [];

  for (const employee of employees) {
    const hireDate = new Date(employee.hireDate);

    for (const milestone of MILESTONES) {
      const anniversaryDate = new Date(hireDate);
      anniversaryDate.setFullYear(hireDate.getFullYear() + milestone);

      const diffMs = anniversaryDate.getTime() - now.getTime();
      const daysUntil = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (daysUntil >= -1 && daysUntil <= windowDays) {
        celebrations.push({
          employee,
          milestone,
          daysUntil,
          anniversaryDate,
          type: getMilestoneType(milestone),
        });
      }
    }
  }

  return celebrations.sort((a, b) => a.daysUntil - b.daysUntil);
}
