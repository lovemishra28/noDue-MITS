import "dotenv/config";
import { PrismaClient, Prisma, UserRole } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { createClient } from "@supabase/supabase-js";

const connectionString = process.env.DATABASE_URL!;
console.log("🔗 Connecting to:", connectionString.replace(/:[^:@]+@/, ":***@"));

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Supabase Admin client (service role key) to create auth users
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DEFAULT_PASSWORD = "Test@1234";
const SUPER_ADMIN_PASSWORD = "Admin@mits2024";

/**
 * Create a user in both Supabase Auth and Prisma.
 * If the Supabase Auth user already exists, reuse their UID.
 */
async function createUser(opts: {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  department?: string;
  enrollmentNo?: string;
}) {
  // 1. Create or fetch Supabase Auth user
  let supabaseUid: string;

  const { data: createData, error: createError } =
    await supabaseAdmin.auth.admin.createUser({
      email: opts.email,
      password: opts.password,
      email_confirm: true, // auto-confirm so they can login immediately
    });

  if (createError) {
    // User might already exist — try to find them
    const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
    const existing = listData?.users?.find(
      (u) => u.email === opts.email
    );
    if (existing) {
      supabaseUid = existing.id;
      // Update password in case it changed
      await supabaseAdmin.auth.admin.updateUserById(supabaseUid, {
        password: opts.password,
      });
    } else {
      throw new Error(
        `Failed to create Supabase user ${opts.email}: ${createError.message}`
      );
    }
  } else {
    supabaseUid = createData.user.id;
  }

  // 2. Upsert in Prisma using the Supabase UID
  const prismaData: Record<string, unknown> = {
    id: supabaseUid,
    email: opts.email,
    name: opts.name,
    role: opts.role,
  };
  if (opts.department) prismaData.department = opts.department;
  if (opts.enrollmentNo) prismaData.enrollmentNo = opts.enrollmentNo;

  await prisma.user.upsert({
    where: { email: opts.email },
    update: prismaData as Prisma.UserUpdateInput,
    create: prismaData as Prisma.UserCreateInput,
  });

  return supabaseUid;
}

async function main() {
  console.log("🌱 Seeding database...\n");

  // Clean up existing Prisma data in correct order to respect foreign keys
  try {
    await prisma.approval.deleteMany({});
    await prisma.application.deleteMany({});
    await prisma.user.deleteMany({});
    console.log("🧹 Cleared existing Prisma data");
  } catch (e) {
    console.log("⚠️ Could not clear data", e);
  }

  // ─── 1. Super Admin ───
  await createUser({
    email: "superadmin@mitsgwl.ac.in",
    password: SUPER_ADMIN_PASSWORD,
    name: "System Admin",
    role: "SUPER_ADMIN",
  });
  console.log(`✅ Super Admin: superadmin@mitsgwl.ac.in (password: ${SUPER_ADMIN_PASSWORD})`);

  // ─── 2. Student ───
  await createUser({
    email: "student@mitsgwl.ac.in",
    password: DEFAULT_PASSWORD,
    name: "Love Mishra",
    role: "STUDENT",
    enrollmentNo: "0108CS221001",
    department: "CSE",
  });
  console.log(`✅ Student: student@mitsgwl.ac.in`);

  // ─── 3. Faculty ───
  await createUser({
    email: "faculty@mitsgwl.ac.in",
    password: DEFAULT_PASSWORD,
    name: "Dr. Rajesh Kumar",
    role: "FACULTY",
    department: "CSE",
  });
  console.log(`✅ Faculty: faculty@mitsgwl.ac.in`);

  // ─── Below users demonstrate roles assigned by Super Admin ───
  await createUser({
    email: "coordinator@mitsgwl.ac.in",
    password: DEFAULT_PASSWORD,
    name: "Prof. Neha Gupta",
    role: "CLASS_COORDINATOR",
    department: "CSE",
  });
  console.log(`✅ Class Coordinator: coordinator@mitsgwl.ac.in`);

  await createUser({
    email: "hod@mitsgwl.ac.in",
    password: DEFAULT_PASSWORD,
    name: "Dr. Amit Sharma",
    role: "HOD",
    department: "CSE",
  });
  console.log(`✅ HOD: hod@mitsgwl.ac.in`);

  await createUser({
    email: "warden@mitsgwl.ac.in",
    password: DEFAULT_PASSWORD,
    name: "Mr. Suresh Patel",
    role: "HOSTEL_WARDEN",
  });
  console.log(`✅ Hostel Warden: warden@mitsgwl.ac.in`);

  await createUser({
    email: "library@mitsgwl.ac.in",
    password: DEFAULT_PASSWORD,
    name: "Mrs. Sunita Verma",
    role: "LIBRARY_ADMIN",
  });
  console.log(`✅ Library Admin: library@mitsgwl.ac.in`);

  await createUser({
    email: "workshop@mitsgwl.ac.in",
    password: DEFAULT_PASSWORD,
    name: "Mr. Ramesh Yadav",
    role: "WORKSHOP_ADMIN",
  });
  console.log(`✅ Workshop Admin: workshop@mitsgwl.ac.in`);

  await createUser({
    email: "tnp@mitsgwl.ac.in",
    password: DEFAULT_PASSWORD,
    name: "Dr. Priya Singh",
    role: "TP_OFFICER",
  });
  console.log(`✅ T&P Officer: tnp@mitsgwl.ac.in`);

  await createUser({
    email: "office@mitsgwl.ac.in",
    password: DEFAULT_PASSWORD,
    name: "Mr. Vikram Joshi",
    role: "GENERAL_OFFICE",
  });
  console.log(`✅ General Office: office@mitsgwl.ac.in`);

  await createUser({
    email: "accounts@mitsgwl.ac.in",
    password: DEFAULT_PASSWORD,
    name: "Mrs. Kavita Dubey",
    role: "ACCOUNTS_OFFICER",
  });
  console.log(`✅ Accounts Officer: accounts@mitsgwl.ac.in`);

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
