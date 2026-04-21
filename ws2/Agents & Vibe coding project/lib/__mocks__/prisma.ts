import { vi } from "vitest";

export const prisma = {
  employee: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
  },
  department: {
    findMany: vi.fn(),
  },
};
