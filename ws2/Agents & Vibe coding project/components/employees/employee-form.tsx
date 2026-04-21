"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import type { EmployeeWithDepartment } from "@/types";
import type { Department } from "@prisma/client";

interface EmployeeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: EmployeeWithDepartment | null;
  departments: Department[];
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
}

export function EmployeeForm({
  open,
  onOpenChange,
  employee,
  departments,
  onSubmit,
}: EmployeeFormProps) {
  const [loading, setLoading] = useState(false);
  const isEdit = !!employee;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const salaryValue = parseFloat(formData.get("salary") as string);
    if (!Number.isFinite(salaryValue) || salaryValue <= 0) {
      setLoading(false);
      return;
    }

    const data: Record<string, unknown> = {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      email: formData.get("email") as string,
      phone: (formData.get("phone") as string) || undefined,
      role: formData.get("role") as string,
      departmentId: formData.get("departmentId") as string,
      employmentType: formData.get("employmentType") as string,
      hireDate: formData.get("hireDate") as string,
      salary: salaryValue,
    };

    try {
      await onSubmit(data);
      onOpenChange(false);
    } catch (error) {
      console.error("Form submission failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Employee" : "Add Employee"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">First Name</label>
              <Input name="firstName" defaultValue={employee?.firstName} required />
            </div>
            <div>
              <label className="text-sm font-medium">Last Name</label>
              <Input name="lastName" defaultValue={employee?.lastName} required />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <Input name="email" type="email" defaultValue={employee?.email} required />
          </div>
          <div>
            <label className="text-sm font-medium">Phone</label>
            <Input name="phone" defaultValue={employee?.phone || ""} />
          </div>
          <div>
            <label className="text-sm font-medium">Role</label>
            <Input name="role" defaultValue={employee?.role} required />
          </div>
          <div>
            <label className="text-sm font-medium">Department</label>
            <Select name="departmentId" defaultValue={employee?.departmentId}>
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Employment Type</label>
            <Select name="employmentType" defaultValue={employee?.employmentType || "Hybrid"}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Remote">Remote</SelectItem>
                <SelectItem value="Hybrid">Hybrid</SelectItem>
                <SelectItem value="On-site">On-site</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Hire Date</label>
              <Input
                name="hireDate"
                type="date"
                defaultValue={
                  employee?.hireDate
                    ? new Date(employee.hireDate).toISOString().split("T")[0]
                    : new Date().toISOString().split("T")[0]
                }
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Salary</label>
              <Input
                name="salary"
                type="number"
                defaultValue={employee?.salary}
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
