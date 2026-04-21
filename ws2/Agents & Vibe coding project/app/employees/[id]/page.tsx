import { notFound } from "next/navigation";
import { getEmployee } from "@/lib/actions";
import { calculateTenure, getPromotionWindow } from "@/lib/calculations";
import { getUpcomingCelebrations } from "@/lib/celebrations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Mail,
  Phone,
  Building2,
  Calendar,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Users,
  MapPin,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";


const statusColors: Record<string, string> = {
  Active: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  "On Leave": "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  Offboarded: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
};

export default async function EmployeeProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const employee = await getEmployee(id);

  if (!employee) {
    notFound();
  }

  const tenure = calculateTenure(employee.hireDate);
  const promotion = getPromotionWindow(employee.hireDate);
  const celebrations = getUpcomingCelebrations(
    [{ ...employee, department: employee.department }],
    365
  );
  const nextAnniversary = celebrations[0];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/employees">
        <Button variant="ghost" size="sm" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Employees
        </Button>
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Info - spans 2 cols */}
        <Card className="lg:col-span-2">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <Avatar className="h-20 w-20">
                <AvatarImage
                  src={employee.avatar || undefined}
                  alt={`${employee.firstName} ${employee.lastName}`}
                />
                <AvatarFallback className="text-2xl">
                  {employee.firstName[0]}{employee.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold">
                      {employee.firstName} {employee.lastName}
                    </h1>
                    <Badge variant="outline" className={statusColors[employee.status] || ""}>
                      {employee.status}
                    </Badge>
                  </div>
                  <p className="text-lg text-muted-foreground">{employee.role}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    {employee.email}
                  </div>
                  {employee.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      {employee.phone}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    {employee.department.name}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {employee.employmentType}
                  </div>
                </div>
                {employee.manager && (
                  <div className="text-sm text-muted-foreground">
                    Reports to:{" "}
                    <Link
                      href={`/employees/${employee.manager.id}`}
                      className="font-medium text-foreground hover:underline"
                    >
                      {employee.manager.firstName} {employee.manager.lastName}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tenure Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4" />
              Tenure & Growth
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-3xl font-bold">{tenure.display}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Hired {new Date(employee.hireDate).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium mb-1">Promotion Window</p>
              <div className="flex items-center gap-2">
                {promotion.urgency === "not-yet" && (
                  <>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Not yet eligible ({promotion.yearsInRole}yr in role)
                    </span>
                  </>
                )}
                {promotion.urgency === "approaching" && (
                  <>
                    <TrendingUp className="h-4 w-4 text-amber-500" />
                    <span className="text-sm text-amber-600 dark:text-amber-400">
                      Approaching ({promotion.yearsInRole}yr in role)
                    </span>
                  </>
                )}
                {promotion.urgency === "overdue" && (
                  <>
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-red-600 dark:text-red-400">
                      Overdue ({promotion.yearsInRole}yr in role)
                    </span>
                  </>
                )}
              </div>
            </div>
            {nextAnniversary && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-medium mb-1">Next Anniversary</p>
                  <p className="text-sm text-muted-foreground">
                    {nextAnniversary.type} in {nextAnniversary.daysUntil} days
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Document Status */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Document Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                {employee.contractSigned ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span className="text-sm">Contract Signed</span>
              </div>
              <div className="flex items-center gap-2">
                {employee.onboardingComplete ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span className="text-sm">Onboarding Complete</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Direct Reports */}
        {employee.directReports.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4" />
                Direct Reports ({employee.directReports.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {employee.directReports.map((report) => (
                <Link
                  key={report.id}
                  href={`/employees/${report.id}`}
                  className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted transition-colors"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={report.avatar || undefined} />
                    <AvatarFallback className="text-xs">
                      {report.firstName[0]}{report.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{report.firstName} {report.lastName}</p>
                    <p className="text-xs text-muted-foreground">{report.role}</p>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
