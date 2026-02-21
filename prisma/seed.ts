import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL!;
console.log("🔗 Connecting to:", connectionString.replace(/:[^:@]+@/, ":***@"));

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const DEFAULT_PASSWORD = "Test@1234";

async function main() {
  console.log("🌱 Seeding database...\n");

  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  // 1. Student account
  const student = await prisma.user.upsert({
    where: { email: "student@mitsgwalior.in" },
    update: { password: hashedPassword },
    create: {
      email: "student@mitsgwalior.in",
      name: "Love Mishra",
      role: "STUDENT",
      enrollmentNo: "0108CS221001",
      department: "CSE",
      password: hashedPassword,
    },
  });
  console.log(`✅ Student: ${student.email} (id: ${student.id})`);

  // 2. Faculty
  const faculty = await prisma.user.upsert({
    where: { email: "faculty@mitsgwalior.in" },
    update: { password: hashedPassword },
    create: {
      email: "faculty@mitsgwalior.in",
      name: "Dr. Rajesh Kumar",
      role: "FACULTY",
      department: "CSE",
      password: hashedPassword,
    },
  });
  console.log(`✅ Faculty: ${faculty.email}`);

  // 3. Class Coordinator
  const cc = await prisma.user.upsert({
    where: { email: "coordinator@mitsgwalior.in" },
    update: { password: hashedPassword },
    create: {
      email: "coordinator@mitsgwalior.in",
      name: "Prof. Neha Gupta",
      role: "CLASS_COORDINATOR",
      department: "CSE",
      password: hashedPassword,
    },
  });
  console.log(`✅ Class Coordinator: ${cc.email}`);

  // 4. HOD
  const hod = await prisma.user.upsert({
    where: { email: "hod@mitsgwalior.in" },
    update: { password: hashedPassword },
    create: {
      email: "hod@mitsgwalior.in",
      name: "Dr. Amit Sharma",
      role: "HOD",
      department: "CSE",
      password: hashedPassword,
    },
  });
  console.log(`✅ HOD: ${hod.email}`);

  // 5. Hostel Warden
  const warden = await prisma.user.upsert({
    where: { email: "warden@mitsgwalior.in" },
    update: { password: hashedPassword },
    create: {
      email: "warden@mitsgwalior.in",
      name: "Mr. Suresh Patel",
      role: "HOSTEL_WARDEN",
      password: hashedPassword,
    },
  });
  console.log(`✅ Hostel Warden: ${warden.email}`);

  // 6. Library Admin
  const library = await prisma.user.upsert({
    where: { email: "library@mitsgwalior.in" },
    update: { password: hashedPassword },
    create: {
      email: "library@mitsgwalior.in",
      name: "Mrs. Sunita Verma",
      role: "LIBRARY_ADMIN",
      password: hashedPassword,
    },
  });
  console.log(`✅ Library Admin: ${library.email}`);

  // 7. Workshop Admin
  const workshop = await prisma.user.upsert({
    where: { email: "workshop@mitsgwalior.in" },
    update: { password: hashedPassword },
    create: {
      email: "workshop@mitsgwalior.in",
      name: "Mr. Ramesh Yadav",
      role: "WORKSHOP_ADMIN",
      password: hashedPassword,
    },
  });
  console.log(`✅ Workshop Admin: ${workshop.email}`);

  // 8. T&P Officer
  const tp = await prisma.user.upsert({
    where: { email: "tnp@mitsgwalior.in" },
    update: { password: hashedPassword },
    create: {
      email: "tnp@mitsgwalior.in",
      name: "Dr. Priya Singh",
      role: "TP_OFFICER",
      password: hashedPassword,
    },
  });
  console.log(`✅ T&P Officer: ${tp.email}`);

  // 9. General Office
  const office = await prisma.user.upsert({
    where: { email: "office@mitsgwalior.in" },
    update: { password: hashedPassword },
    create: {
      email: "office@mitsgwalior.in",
      name: "Mr. Vikram Joshi",
      role: "GENERAL_OFFICE",
      password: hashedPassword,
    },
  });
  console.log(`✅ General Office: ${office.email}`);

  // 10. Accounts Officer
  const accounts = await prisma.user.upsert({
    where: { email: "accounts@mitsgwalior.in" },
    update: { password: hashedPassword },
    create: {
      email: "accounts@mitsgwalior.in",
      name: "Mrs. Kavita Dubey",
      role: "ACCOUNTS_OFFICER",
      password: hashedPassword,
    },
  });
  console.log(`✅ Accounts Officer: ${accounts.email}`);

  // 11. Super Admin
  const admin = await prisma.user.upsert({
    where: { email: "admin@mitsgwalior.in" },
    update: { password: hashedPassword },
    create: {
      email: "admin@mitsgwalior.in",
      name: "System Admin",
      role: "SUPER_ADMIN",
      password: hashedPassword,
    },
  });
  console.log(`✅ Super Admin: ${admin.email}`);

  console.log(`\n🎉 Seeding complete!`);
  console.log(`📝 All users have password: ${DEFAULT_PASSWORD}\n`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
