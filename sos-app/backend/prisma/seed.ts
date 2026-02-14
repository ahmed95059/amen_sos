import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const v1 = await prisma.village.upsert({
    where: { name: "Village Tunis" },
    update: {},
    create: { name: "Village Tunis" },
  });

  const v2 = await prisma.village.upsert({
    where: { name: "Village Sousse" },
    update: {},
    create: { name: "Village Sousse" },
  });

  const password = await bcrypt.hash("password123", 10);

  await prisma.user.upsert({
    where: { email: "decl1@sos.tn" },
    update: {},
    create: {
      name: "Declarant One",
      email: "decl1@sos.tn",
      passwordHash: password,
      role: Role.DECLARANT,
      villageId: v1.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "psy1@sos.tn" },
    update: {},
    create: {
      name: "Psy One",
      email: "psy1@sos.tn",
      passwordHash: password,
      role: Role.PSY,
      villageId: v1.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "psy2@sos.tn" },
    update: {},
    create: {
      name: "Psy Two",
      email: "psy2@sos.tn",
      passwordHash: password,
      role: Role.PSY,
      villageId: v1.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "psy3@sos.tn" },
    update: {},
    create: {
      name: "Psy Sousse",
      email: "psy3@sos.tn",
      passwordHash: password,
      role: Role.PSY,
      villageId: v2.id,
    },
  });

  console.log("Seed done. Users:");
  console.log("- decl1@sos.tn / password123");
  console.log("- psy1@sos.tn / password123");
  console.log("- psy2@sos.tn / password123");
  console.log("- psy3@sos.tn / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
