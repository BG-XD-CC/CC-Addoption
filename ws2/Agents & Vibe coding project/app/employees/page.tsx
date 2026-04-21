import { getEmployees, getDepartments } from "@/lib/actions";
import { DataTable } from "@/components/employees/data-table";
import { PageHeader } from "@/components/shared/page-header";

export default async function EmployeesPage() {
  const [employees, departments] = await Promise.all([
    getEmployees(),
    getDepartments(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="Employees"
        description="Manage your team members and track their journey"
      />
      <DataTable initialData={employees} departments={departments} />
    </div>
  );
}
