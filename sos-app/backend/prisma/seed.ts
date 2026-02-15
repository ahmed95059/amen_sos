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
    update: {
      name: "Declarant One",
      passwordHash: password,
      role: Role.DECLARANT,
      villageId: v1.id,
    },
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
    update: {
      name: "Psy One",
      passwordHash: password,
      role: Role.PSY,
      villageId: v1.id,
    },
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
    update: {
      name: "Psy Two",
      passwordHash: password,
      role: Role.PSY,
      villageId: v2.id,
    },
    create: {
      name: "Psy Two",
      email: "psy2@sos.tn",
      passwordHash: password,
      role: Role.PSY,
      villageId: v2.id,
    },
  });

  await prisma.user.deleteMany({
    where: { email: "psy3@sos.tn" },
  });

  await prisma.user.upsert({
    where: { email: "dir.tunis@sos.tn" },
    update: {
      name: "Directeur Tunis",
      passwordHash: password,
      role: Role.DIR_VILLAGE,
      villageId: v1.id,
    },
    create: {
      name: "Directeur Tunis",
      email: "dir.tunis@sos.tn",
      passwordHash: password,
      role: Role.DIR_VILLAGE,
      villageId: v1.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "dir.sousse@sos.tn" },
    update: {
      name: "Directeur Sousse",
      passwordHash: password,
      role: Role.DIR_VILLAGE,
      villageId: v2.id,
    },
    create: {
      name: "Directeur Sousse",
      email: "dir.sousse@sos.tn",
      passwordHash: password,
      role: Role.DIR_VILLAGE,
      villageId: v2.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "resp.sauvegarde@sos.tn" },
    update: {
      name: "Responsable Sauvegarde",
      passwordHash: password,
      role: Role.RESPONSABLE_SAUVEGARDE,
      villageId: null,
    },
    create: {
      name: "Responsable Sauvegarde",
      email: "resp.sauvegarde@sos.tn",
      passwordHash: password,
      role: Role.RESPONSABLE_SAUVEGARDE,
      villageId: null,
    },
  });

  console.log("Seed done. Users:");
  console.log("- decl1@sos.tn / password123");
  console.log("- psy1@sos.tn / password123");
  console.log("- psy2@sos.tn / password123");
  console.log("- dir.tunis@sos.tn / password123");
  console.log("- dir.sousse@sos.tn / password123");
  console.log("- resp.sauvegarde@sos.tn / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
