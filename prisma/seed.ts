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
const SUPER_ADMIN_PASSWORD = "Admin@mits2024";

async function main() {
  console.log("🌱 Seeding database...\n");

  // Clean up existing data in correct order to respect foreign keys
  try {
    await prisma.approval.deleteMany({});
    await prisma.application.deleteMany({});
    await prisma.user.deleteMany({});
    console.log("🧹 Cleared existing data");
  } catch (e) {
    console.log("⚠️ Could not clear data", e);
  }

  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  const hashedAdminPassword = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 10);

  // ─── 1. Super Admin (dedicated separate account with its own password) ───
  const admin = await prisma.user.upsert({
    where: { email: "superadmin@mitsgwl.ac.in" },
    update: { password: hashedAdminPassword },
    create: {
      email: "superadmin@mitsgwl.ac.in",
      name: "System Admin",
      role: "SUPER_ADMIN",
      password: hashedAdminPassword,
    },
  });
  console.log(`✅ Super Admin: ${admin.email} (password: ${SUPER_ADMIN_PASSWORD})`);

  // ─── 2. Student (role detected from email) ───
  const student = await prisma.user.upsert({
    where: { email: "student@mitsgwl.ac.in" },
    update: { password: hashedPassword },
    create: {
      email: "student@mitsgwl.ac.in",
      name: "Love Mishra",
      role: "STUDENT",
      enrollmentNo: "0108CS221001",
      department: "CSE",
      password: hashedPassword,
    },
  });
  console.log(`✅ Student: ${student.email}`);

  // ─── 3. Faculty (role detected from email) ───
  const faculty = await prisma.user.upsert({
    where: { email: "faculty@mitsgwl.ac.in" },
    update: { password: hashedPassword },
    create: {
      email: "faculty@mitsgwl.ac.in",
      name: "Dr. Rajesh Kumar",
      role: "FACULTY",
      department: "CSE",
      password: hashedPassword,
    },
  });
  console.log(`✅ Faculty: ${faculty.email}`);

  // ─── Below users demonstrate roles assigned by Super Admin ───
  // In production, these would first register as FACULTY,
  // then the Super Admin promotes them to their specific role.

  const cc = await prisma.user.upsert({
    where: { email: "coordinator@mitsgwl.ac.in" },
    update: { password: hashedPassword },
    create: {
      email: "coordinator@mitsgwl.ac.in",
      name: "Prof. Neha Gupta",
      role: "CLASS_COORDINATOR",
      department: "CSE",
      password: hashedPassword,
    },
  });
  console.log(`✅ Class Coordinator: ${cc.email}`);

  const hod = await prisma.user.upsert({
    where: { email: "hod@mitsgwl.ac.in" },
    update: { password: hashedPassword },
    create: {
      email: "hod@mitsgwl.ac.in",
      name: "Dr. Amit Sharma",
      role: "HOD",
      department: "CSE",
      password: hashedPassword,
    },
  });
  console.log(`✅ HOD: ${hod.email}`);

  const warden = await prisma.user.upsert({
    where: { email: "warden@mitsgwl.ac.in" },
    update: { password: hashedPassword },
    create: {
      email: "warden@mitsgwl.ac.in",
      name: "Mr. Suresh Patel",
      role: "HOSTEL_WARDEN",
      password: hashedPassword,
    },
  });
  console.log(`✅ Hostel Warden: ${warden.email}`);

  const library = await prisma.user.upsert({
    where: { email: "library@mitsgwl.ac.in" },
    update: { password: hashedPassword },
    create: {
      email: "library@mitsgwl.ac.in",
      name: "Mrs. Sunita Verma",
      role: "LIBRARY_ADMIN",
      password: hashedPassword,
    },
  });
  console.log(`✅ Library Admin: ${library.email}`);

  const workshop = await prisma.user.upsert({
    where: { email: "workshop@mitsgwl.ac.in" },
    update: { password: hashedPassword },
    create: {
      email: "workshop@mitsgwl.ac.in",
      name: "Mr. Ramesh Yadav",
      role: "WORKSHOP_ADMIN",
      password: hashedPassword,
    },
  });
  console.log(`✅ Workshop Admin: ${workshop.email}`);

  const tp = await prisma.user.upsert({
    where: { email: "tnp@mitsgwl.ac.in" },
    update: { password: hashedPassword },
    create: {
      email: "tnp@mitsgwl.ac.in",
      name: "Dr. Priya Singh",
      role: "TP_OFFICER",
      password: hashedPassword,
    },
  });
  console.log(`✅ T&P Officer: ${tp.email}`);

  const office = await prisma.user.upsert({
    where: { email: "office@mitsgwl.ac.in" },
    update: { password: hashedPassword },
    create: {
      email: "office@mitsgwl.ac.in",
      name: "Mr. Vikram Joshi",
      role: "GENERAL_OFFICE",
      password: hashedPassword,
    },
  });
  console.log(`✅ General Office: ${office.email}`);

  const accounts = await prisma.user.upsert({
    where: { email: "accounts@mitsgwl.ac.in" },
    update: { password: hashedPassword },
    create: {
      email: "accounts@mitsgwl.ac.in",
      name: "Mrs. Kavita Dubey",
      role: "ACCOUNTS_OFFICER",
      password: hashedPassword,
    },
  });
  console.log(`✅ Accounts Officer: ${accounts.email}`);

  console.log(`\n🎉 Seeding complete!`);
  console.log(`📝 Default users password: ${DEFAULT_PASSWORD}`);
  console.log(`📝 Super Admin password: ${SUPER_ADMIN_PASSWORD}\n`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
