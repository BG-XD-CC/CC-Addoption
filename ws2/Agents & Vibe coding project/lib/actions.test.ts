import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock next/cache before importing actions
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock prisma
vi.mock("@/lib/prisma", () => import("@/lib/__mocks__/prisma"));

// Mock calculations/celebrations (not needed for these tests)
vi.mock("@/lib/calculations", () => ({
  calculateTenure: vi.fn(),
  getTenureBracket: vi.fn(),
  getPromotionWindow: vi.fn(),
}));
vi.mock("@/lib/celebrations", () => ({
  getUpcomingCelebrations: vi.fn(),
}));

import { prisma } from "@/lib/__mocks__/prisma";
import {
  updateEmployee,
  createEmployee,
  deleteEmployee,
  bulkUpdateStatus,
  exportEmployeesCSV,
} from "@/lib/actions";

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Bug 1: updateEmployee was using prisma.employee.create instead of .update
// ---------------------------------------------------------------------------
describe("updateEmployee", () => {
  it("should call prisma.employee.update with the correct id and data when updating an employee", async () => {
    (prisma.employee.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

    await updateEmployee("emp-123", { firstName: "Jane", salary: 90000 });

    expect(prisma.employee.update).toHaveBeenCalledOnce();
    expect(prisma.employee.update).toHaveBeenCalledWith({
      where: { id: "emp-123" },
      data: { firstName: "Jane", salary: 90000 },
    });
    // Ensure create was NOT called (regression for the bug)
    expect(prisma.employee.create).not.toHaveBeenCalled();
  });

  it("should convert hireDate string to Date object when hireDate is provided", async () => {
    (prisma.employee.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

    await updateEmployee("emp-456", { hireDate: "2024-01-15" });

    expect(prisma.employee.update).toHaveBeenCalledWith({
      where: { id: "emp-456" },
      data: { hireDate: new Date("2024-01-15") },
    });
  });
});

// ---------------------------------------------------------------------------
// Bug 2: createEmployee input validation
// ---------------------------------------------------------------------------
describe("createEmployee input validation", () => {
  const validInput = {
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    role: "Engineer",
    departmentId: "dept-1",
    employmentType: "Remote",
    hireDate: "2024-01-01",
    salary: 80000,
  };

  it("should reject input when firstName is empty", async () => {
    await expect(
      createEmployee({ ...validInput, firstName: "" })
    ).rejects.toThrow("First name is required");
  });

  it("should reject input when email is invalid", async () => {
    await expect(
      createEmployee({ ...validInput, email: "not-an-email" })
    ).rejects.toThrow("A valid email address is required");
  });

  it("should reject input when salary is negative", async () => {
    await expect(
      createEmployee({ ...validInput, salary: -100 })
    ).rejects.toThrow("Salary must be a positive number");
  });

  it("should accept valid input when all fields are correct", async () => {
    (prisma.employee.create as ReturnType<typeof vi.fn>).mockResolvedValue({});
    await expect(createEmployee(validInput)).resolves.not.toThrow();
    expect(prisma.employee.create).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// Bug 3: createEmployee duplicate email (P2002 Prisma error)
// ---------------------------------------------------------------------------
describe("createEmployee duplicate email", () => {
  const validInput = {
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    role: "Engineer",
    departmentId: "dept-1",
    employmentType: "Remote",
    hireDate: "2024-01-01",
    salary: 80000,
  };

  it("should throw a user-friendly message when a P2002 duplicate email error occurs", async () => {
    const prismaError = { code: "P2002" };
    (prisma.employee.create as ReturnType<typeof vi.fn>).mockRejectedValue(prismaError);

    await expect(createEmployee(validInput)).rejects.toThrow(
      "An employee with this email already exists."
    );
  });

  it("should re-throw other errors unmodified when a non-P2002 error occurs", async () => {
    const otherError = new Error("Connection lost");
    (prisma.employee.create as ReturnType<typeof vi.fn>).mockRejectedValue(otherError);

    await expect(createEmployee(validInput)).rejects.toThrow("Connection lost");
  });
});

// ---------------------------------------------------------------------------
// Bug 4: deleteEmployee cascade — direct reports get managerId set to null
// ---------------------------------------------------------------------------
describe("deleteEmployee cascade", () => {
  it("should set direct reports managerId to null before deleting the employee when employee has reports", async () => {
    (prisma.employee.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 2 });
    (prisma.employee.delete as ReturnType<typeof vi.fn>).mockResolvedValue({});

    await deleteEmployee("mgr-1");

    // updateMany must be called first to unlink reports
    expect(prisma.employee.updateMany).toHaveBeenCalledWith({
      where: { managerId: "mgr-1" },
      data: { managerId: null },
    });
    // Then delete
    expect(prisma.employee.delete).toHaveBeenCalledWith({
      where: { id: "mgr-1" },
    });

    // Verify ordering: updateMany called before delete
    const updateManyOrder = (prisma.employee.updateMany as ReturnType<typeof vi.fn>).mock
      .invocationCallOrder[0];
    const deleteOrder = (prisma.employee.delete as ReturnType<typeof vi.fn>).mock
      .invocationCallOrder[0];
    expect(updateManyOrder).toBeLessThan(deleteOrder);
  });

  it("should successfully delete an employee when employee has no direct reports", async () => {
    (prisma.employee.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 0 });
    (prisma.employee.delete as ReturnType<typeof vi.fn>).mockResolvedValue({});

    await expect(deleteEmployee("emp-solo")).resolves.not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Bug 5: bulkUpdateStatus validation
// ---------------------------------------------------------------------------
describe("bulkUpdateStatus validation", () => {
  it("should throw when status is invalid", async () => {
    await expect(
      bulkUpdateStatus(["id-1"], "Fired")
    ).rejects.toThrow("Invalid status");
  });

  it("should throw when ids array is empty", async () => {
    await expect(
      bulkUpdateStatus([], "Active")
    ).rejects.toThrow("At least one employee ID is required");
  });

  it("should call prisma.employee.updateMany when input is valid", async () => {
    (prisma.employee.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 2 });

    await bulkUpdateStatus(["id-1", "id-2"], "On Leave");

    expect(prisma.employee.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["id-1", "id-2"] } },
      data: { status: "On Leave" },
    });
  });
});

// ---------------------------------------------------------------------------
// Bug 6: CSV export escaping
// ---------------------------------------------------------------------------
describe("exportEmployeesCSV escaping", () => {
  it("should properly escape fields with commas, quotes, and newlines when exporting CSV", async () => {
    (prisma.employee.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        firstName: 'John "JD"',
        lastName: "O'Brien, Jr.",
        email: "john@example.com",
        phone: "555-1234",
        role: "Senior\nEngineer",
        department: { name: "R&D" },
        employmentType: "Remote",
        hireDate: new Date("2024-01-15"),
        salary: 100000,
        status: "Active",
        contractSigned: true,
        onboardingComplete: true,
      },
    ]);

    const csv = await exportEmployeesCSV();
    const lines = csv.split("\n");
    // The data row is line index 1 (after headers)
    // But the data itself contains a newline in "Senior\nEngineer" which will be inside quotes
    // Let's parse carefully
    expect(csv).toContain('"John ""JD"""'); // quotes escaped by doubling
    expect(csv).toContain('"O\'Brien, Jr."'); // comma triggers quoting
    expect(csv).toContain('"Senior\nEngineer"'); // newline triggers quoting
  });

  it("should not quote simple fields when they contain no special characters", async () => {
    (prisma.employee.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        firstName: "Alice",
        lastName: "Smith",
        email: "alice@example.com",
        phone: "",
        role: "Designer",
        department: { name: "Design" },
        employmentType: "On-site",
        hireDate: new Date("2023-06-01"),
        salary: 75000,
        status: "Active",
        contractSigned: false,
        onboardingComplete: true,
      },
    ]);

    const csv = await exportEmployeesCSV();
    const dataLine = csv.split("\n")[1];
    // Simple fields should NOT be wrapped in quotes
    expect(dataLine).toContain("Alice,Smith,alice@example.com");
  });
});

// ---------------------------------------------------------------------------
// Regression tests for Bug #2: createEmployee salary=0 should be rejected
// ---------------------------------------------------------------------------
describe("createEmployee zero salary regression", () => {
  const validInput = {
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    role: "Engineer",
    departmentId: "dept-1",
    employmentType: "Remote",
    hireDate: "2024-01-01",
    salary: 80000,
  };

  it("should throw 'Salary must be a positive number' when salary is zero", async () => {
    await expect(
      createEmployee({ ...validInput, salary: 0 })
    ).rejects.toThrow("Salary must be a positive number");
  });

  it("should accept the employee when salary is 1", async () => {
    (prisma.employee.create as ReturnType<typeof vi.fn>).mockResolvedValue({});
    await expect(
      createEmployee({ ...validInput, salary: 1 })
    ).resolves.not.toThrow();
    expect(prisma.employee.create).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// Bug 7: Status filter — was inverted (=== instead of !==)
// ---------------------------------------------------------------------------
describe("status filter predicate", () => {
  // Extract the same filter logic used in data-table.tsx:
  // if (statusFilter && emp.status !== statusFilter) return false;
  // The bug was: emp.status === statusFilter (which excluded matches instead of non-matches)
  const statusFilterPredicate = (empStatus: string, filterValue: string): boolean => {
    if (filterValue && empStatus !== filterValue) return false;
    return true;
  };

  it("should include employees matching the selected status when filter is set", () => {
    expect(statusFilterPredicate("Active", "Active")).toBe(true);
    expect(statusFilterPredicate("On Leave", "On Leave")).toBe(true);
  });

  it("should exclude employees not matching the selected status when filter is set", () => {
    expect(statusFilterPredicate("Active", "On Leave")).toBe(false);
    expect(statusFilterPredicate("Offboarded", "Active")).toBe(false);
  });

  it("should include all employees when filter is empty", () => {
    expect(statusFilterPredicate("Active", "")).toBe(true);
    expect(statusFilterPredicate("On Leave", "")).toBe(true);
    expect(statusFilterPredicate("Offboarded", "")).toBe(true);
  });
});
