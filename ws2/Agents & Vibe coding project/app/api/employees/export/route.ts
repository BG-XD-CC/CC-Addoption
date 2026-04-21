import { exportEmployeesCSV } from "@/lib/actions";

export async function GET() {
  const csv = await exportEmployeesCSV();

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="employees-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
