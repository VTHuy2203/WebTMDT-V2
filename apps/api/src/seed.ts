import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
import { hash } from "argon2";
import { resolve } from "path";

config({ path: resolve(process.cwd(), "apps/api/.env") });

const db = new PrismaClient();

async function main() {
  const roleKeys = [
    "BUYER", "SELLER_OWNER", "SELLER_MANAGER", "ADMIN", "MODERATOR",
    "FINANCE_ADMIN", "SUPER_ADMIN",
  ];
  const roles = await Promise.all(
    roleKeys.map((key) => db.role.upsert({ where: { key }, create: { key }, update: {} })),
  );
  const email = (process.env.ADMIN_EMAIL ?? "admin@marketplace.local").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "Marketplace@123";
  const passwordHash = await hash(password);
  const admin = await db.user.upsert({
    where: { emailNormalized: email },
    create: { emailNormalized: email, fullName: "System Admin", passwordHash, emailVerifiedAt: new Date() },
    update: { fullName: "System Admin", passwordHash },
  });
  for (const key of ["ADMIN", "SUPER_ADMIN"]) {
    const role = roles.find((item) => item.key === key)!;
    await db.userRole.upsert({
      where: { userId_roleId: { userId: admin.id, roleId: role.id } },
      create: { userId: admin.id, roleId: role.id },
      update: {},
    });
  }
  console.log(`Seed complete. Only default account: ${email}`);
}

main()
  .catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(() => db.$disconnect());
