import { getDashboardData } from "@/lib/actions";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { DepartmentChart } from "@/components/dashboard/department-chart";
import { AnniversaryRadar } from "@/components/dashboard/anniversary-radar";
import { CelebrationConfetti } from "@/components/dashboard/celebration-confetti";
import { ActionItems } from "@/components/dashboard/action-items";
import { EmploymentTypeChart } from "@/components/dashboard/employment-type-chart";
import { DepartmentLeads } from "@/components/dashboard/department-leads";
import { PageHeader } from "@/components/shared/page-header";

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="Intelligence Dashboard"
        description="Real-time employee analytics and milestone tracking"
      />
      <CelebrationConfetti celebrations={data.celebrations} />

      {/* Row 1: Stats Cards */}
      <div className="mb-8">
        <StatsCards
          totalEmployees={data.totalEmployees}
          avgTenureYears={data.avgTenureYears}
          remotePercentage={data.remotePercentage}
          activePercentage={data.activePercentage}
          newHiresLast90Days={data.newHiresLast90Days}
          avgSalary={data.avgSalary}
          onLeaveCount={data.onLeaveCount}
        />
      </div>

      {/* Row 2: Action Items + Employment Type */}
      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <ActionItems items={data.actionItems} />
        <EmploymentTypeChart data={data.employmentTypeCounts} />
      </div>

      {/* Row 3: Department Chart + Anniversary Radar */}
      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <DepartmentChart data={data.departmentStats} />
        <AnniversaryRadar celebrations={data.celebrations} />
      </div>

      {/* Row 4: Department Leads */}
      <DepartmentLeads leads={data.departmentLeads} />
    </div>
  );
}
