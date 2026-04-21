import { PrismaClient } from "../app/generated/prisma/client.js";

const prisma = new PrismaClient();

async function main() {
  await prisma.employee.deleteMany();
  await prisma.department.deleteMany();

  const engineering = await prisma.department.create({
    data: { name: "Engineering", description: "Software development and infrastructure" },
  });
  const product = await prisma.department.create({
    data: { name: "Product", description: "Product management and strategy" },
  });
  const people = await prisma.department.create({
    data: { name: "People", description: "Human resources and culture" },
  });
  const growth = await prisma.department.create({
    data: { name: "Growth", description: "Marketing, sales, and partnerships" },
  });

  const now = new Date();
  const yearsAgo = (y, monthOffset = 0) => {
    const d = new Date(now);
    d.setFullYear(d.getFullYear() - y);
    d.setMonth(d.getMonth() + monthOffset);
    return d;
  };

  // Engineering team
  const engLead = await prisma.employee.create({
    data: {
      firstName: "Sarah", lastName: "Chen", email: "sarah.chen@exp.io",
      phone: "+1-555-0101", role: "VP of Engineering", departmentId: engineering.id,
      employmentType: "Hybrid", hireDate: yearsAgo(10, 1), salary: 195000,
      contractSigned: true, onboardingComplete: true, status: "Active",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    },
  });

  await prisma.employee.create({
    data: {
      firstName: "Marcus", lastName: "Rodriguez", email: "marcus.rodriguez@exp.io",
      phone: "+1-555-0102", role: "Senior Backend Engineer", departmentId: engineering.id,
      managerId: engLead.id, employmentType: "Remote", hireDate: yearsAgo(5, 2),
      salary: 155000, contractSigned: true, onboardingComplete: true, status: "Active",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus",
    },
  });

  await prisma.employee.create({
    data: {
      firstName: "Aisha", lastName: "Patel", email: "aisha.patel@exp.io",
      phone: "+1-555-0103", role: "Frontend Engineer", departmentId: engineering.id,
      managerId: engLead.id, employmentType: "Hybrid", hireDate: yearsAgo(2, 3),
      salary: 130000, contractSigned: true, onboardingComplete: true, status: "Active",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aisha",
    },
  });

  await prisma.employee.create({
    data: {
      firstName: "Jake", lastName: "Morrison", email: "jake.morrison@exp.io",
      phone: "+1-555-0104", role: "DevOps Engineer", departmentId: engineering.id,
      managerId: engLead.id, employmentType: "Remote", hireDate: yearsAgo(0, -3),
      salary: 120000, contractSigned: false, onboardingComplete: false, status: "Active",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jake",
    },
  });

  await prisma.employee.create({
    data: {
      firstName: "Lina", lastName: "Nakamura", email: "lina.nakamura@exp.io",
      phone: "+1-555-0105", role: "Full Stack Engineer", departmentId: engineering.id,
      managerId: engLead.id, employmentType: "On-site", hireDate: yearsAgo(3, 1),
      salary: 140000, contractSigned: true, onboardingComplete: true, status: "Active",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lina",
    },
  });

  // Product team
  const prodLead = await prisma.employee.create({
    data: {
      firstName: "David", lastName: "Kim", email: "david.kim@exp.io",
      phone: "+1-555-0201", role: "Head of Product", departmentId: product.id,
      employmentType: "On-site", hireDate: yearsAgo(5, -1), salary: 175000,
      contractSigned: true, onboardingComplete: true, status: "Active",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
    },
  });

  await prisma.employee.create({
    data: {
      firstName: "Emma", lastName: "Larsson", email: "emma.larsson@exp.io",
      phone: "+1-555-0202", role: "Product Manager", departmentId: product.id,
      managerId: prodLead.id, employmentType: "Hybrid", hireDate: yearsAgo(2, -2),
      salary: 135000, contractSigned: true, onboardingComplete: true, status: "Active",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma",
    },
  });

  await prisma.employee.create({
    data: {
      firstName: "Tom", lastName: "Bradley", email: "tom.bradley@exp.io",
      phone: "+1-555-0203", role: "UX Designer", departmentId: product.id,
      managerId: prodLead.id, employmentType: "Remote", hireDate: yearsAgo(1, 2),
      salary: 115000, contractSigned: true, onboardingComplete: true, status: "Active",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Tom",
    },
  });

  await prisma.employee.create({
    data: {
      firstName: "Zara", lastName: "Okonkwo", email: "zara.okonkwo@exp.io",
      phone: "+1-555-0204", role: "Product Analyst", departmentId: product.id,
      managerId: prodLead.id, employmentType: "Hybrid", hireDate: yearsAgo(0, -6),
      salary: 105000, contractSigned: true, onboardingComplete: false, status: "Active",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Zara",
    },
  });

  // People team
  const peopleLead = await prisma.employee.create({
    data: {
      firstName: "Rachel", lastName: "Foster", email: "rachel.foster@exp.io",
      phone: "+1-555-0301", role: "Head of People", departmentId: people.id,
      employmentType: "On-site", hireDate: yearsAgo(10, -2), salary: 165000,
      contractSigned: true, onboardingComplete: true, status: "Active",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rachel",
    },
  });

  await prisma.employee.create({
    data: {
      firstName: "Carlos", lastName: "Mendez", email: "carlos.mendez@exp.io",
      phone: "+1-555-0302", role: "HR Specialist", departmentId: people.id,
      managerId: peopleLead.id, employmentType: "Hybrid", hireDate: yearsAgo(1, -3),
      salary: 85000, contractSigned: true, onboardingComplete: true, status: "On Leave",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos",
    },
  });

  await prisma.employee.create({
    data: {
      firstName: "Nina", lastName: "Volkov", email: "nina.volkov@exp.io",
      phone: "+1-555-0303", role: "Recruiter", departmentId: people.id,
      managerId: peopleLead.id, employmentType: "Remote", hireDate: yearsAgo(0, -2),
      salary: 90000, contractSigned: false, onboardingComplete: true, status: "Active",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Nina",
    },
  });

  // Growth team
  const growthLead = await prisma.employee.create({
    data: {
      firstName: "Alex", lastName: "Thompson", email: "alex.thompson@exp.io",
      phone: "+1-555-0401", role: "Head of Growth", departmentId: growth.id,
      employmentType: "Hybrid", hireDate: yearsAgo(5, 3), salary: 170000,
      contractSigned: true, onboardingComplete: true, status: "Active",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
    },
  });

  await prisma.employee.create({
    data: {
      firstName: "Priya", lastName: "Sharma", email: "priya.sharma@exp.io",
      phone: "+1-555-0402", role: "Marketing Manager", departmentId: growth.id,
      managerId: growthLead.id, employmentType: "Remote", hireDate: yearsAgo(2, 1),
      salary: 120000, contractSigned: true, onboardingComplete: true, status: "Active",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Priya",
    },
  });

  await prisma.employee.create({
    data: {
      firstName: "Leo", lastName: "Fernandez", email: "leo.fernandez@exp.io",
      phone: "+1-555-0403", role: "Sales Development Rep", departmentId: growth.id,
      managerId: growthLead.id, employmentType: "On-site", hireDate: yearsAgo(0, -8),
      salary: 75000, contractSigned: true, onboardingComplete: true, status: "Active",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Leo",
    },
  });

  await prisma.employee.create({
    data: {
      firstName: "Maya", lastName: "Washington", email: "maya.washington@exp.io",
      phone: "+1-555-0404", role: "Partnership Lead", departmentId: growth.id,
      managerId: growthLead.id, employmentType: "Hybrid", hireDate: yearsAgo(1, 5),
      salary: 110000, contractSigned: true, onboardingComplete: true, status: "Active",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Maya",
    },
  });

  console.log("✅ Seed complete: 4 departments, 16 employees");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
