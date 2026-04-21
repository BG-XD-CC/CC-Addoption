"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  type SortingState,
  type RowSelectionState,
  flexRender,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { columns } from "./columns";
import { DataTableToolbar } from "./data-table-toolbar";
import { DataTablePagination } from "./data-table-pagination";
import { BulkActionsBar } from "./bulk-actions-bar";
import { EmployeeForm } from "./employee-form";
import type { EmployeeWithDepartment } from "@/types";
import type { Department } from "@prisma/client";
import { getTenureBracket } from "@/lib/calculations";
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  bulkUpdateStatus,
} from "@/lib/actions";

interface DataTableProps {
  initialData: EmployeeWithDepartment[];
  departments: Department[];
}

export function DataTable({ initialData, departments }: DataTableProps) {
  const [data, setData] = useState(initialData);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [tenureFilter, setTenureFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeWithDepartment | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Debounce search input — only update filtered view after 250ms of no typing
  useEffect(() => {
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 250);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  // Pure client-side filtering on the initial dataset — no server calls on filter change
  const filteredData = useMemo(() => {
    return data.filter((emp) => {
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        if (
          !emp.firstName.toLowerCase().includes(q) &&
          !emp.lastName.toLowerCase().includes(q) &&
          !emp.email.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      if (deptFilter && emp.department.name !== deptFilter) return false;
      if (statusFilter && emp.status !== statusFilter) return false;
      if (tenureFilter && getTenureBracket(emp.hireDate) !== tenureFilter) return false;
      return true;
    });
  }, [data, debouncedSearch, deptFilter, statusFilter, tenureFilter]);

  const refreshData = async () => {
    try {
      const fresh = await getEmployees();
      setData(fresh);
    } catch (error) {
      console.error("Failed to refresh employee data:", error);
    }
  };

  const table = useReactTable({
    data: filteredData,
    columns,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    state: { sorting, rowSelection },
    meta: {
      onEdit: (emp: EmployeeWithDepartment) => {
        setEditingEmployee(emp);
        setFormOpen(true);
      },
      onDelete: async (id: string) => {
        try {
          await deleteEmployee(id);
          await refreshData();
        } catch (error) {
          console.error("Failed to delete employee:", error);
        }
      },
    },
  });

  const selectedIds = Object.keys(rowSelection)
    .filter((k) => rowSelection[k]);

  const handleBulkAction = async (status: string) => {
    await bulkUpdateStatus(selectedIds, status);
    setRowSelection({});
    await refreshData();
  };

  const handleFormSubmit = async (formData: Record<string, unknown>) => {
    try {
      if (editingEmployee) {
        await updateEmployee(editingEmployee.id, formData);
      } else {
        await createEmployee(formData as Parameters<typeof createEmployee>[0]);
      }
      setEditingEmployee(null);
      await refreshData();
    } catch (error) {
      console.error("Failed to save employee:", error);
    }
  };

  return (
    <>
      <DataTableToolbar
        search={search}
        onSearchChange={setSearch}
        department={deptFilter}
        onDepartmentChange={(v) => setDeptFilter(v ?? "")}
        tenure={tenureFilter}
        onTenureChange={(v) => setTenureFilter(v ?? "")}
        status={statusFilter}
        onStatusChange={(v) => setStatusFilter(v ?? "")}
        departments={departments.map((d) => d.name)}
        onAddEmployee={() => {
          setEditingEmployee(null);
          setFormOpen(true);
        }}
      />
      <Card>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? "selected" : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No employees found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
      <DataTablePagination table={table} />
      <BulkActionsBar
        selectedCount={selectedIds.length}
        onBulkAction={handleBulkAction}
      />
      <EmployeeForm
        open={formOpen}
        onOpenChange={setFormOpen}
        employee={editingEmployee}
        departments={departments}
        onSubmit={handleFormSubmit}
      />
    </>
  );
}
