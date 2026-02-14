import { PrismaClient, Role, CaseStatus } from "@prisma/client";

export async function assignTwoPsychologists(prisma: PrismaClient, caseId: string, villageId: string) {
  const psyUsers = await prisma.user.findMany({
    where: { role: Role.PSY, villageId },
    select: { id: true, name: true }
  });

  if (psyUsers.length < 2) {
    throw new Error("NOT_ENOUGH_PSY_IN_VILLAGE");
  }

  const loads = await Promise.all(
    psyUsers.map(async (p) => {
      const count = await prisma.caseAssignment.count({
        where: {
          psychologistId: p.id,
          case: { status: { in: [CaseStatus.PENDING, CaseStatus.IN_PROGRESS] } }
        }
      });
      return { ...p, load: count };
    })
  );

  loads.sort((a, b) => a.load - b.load);

  const primary = loads[0]!;
  const secondary = loads[1]!;

  await prisma.caseAssignment.createMany({
    data: [
      { caseId, psychologistId: primary.id, assignmentRole: "PRIMARY" },
      { caseId, psychologistId: secondary.id, assignmentRole: "SECONDARY" }
    ]
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: primary.id,
        caseId,
        type: "CASE_ASSIGNED",
        message: "Nouveau signalement assigné (PRIMARY)"
      },
      {
        userId: secondary.id,
        caseId,
        type: "CASE_ASSIGNED",
        message: "Nouveau signalement assigné (SECONDARY)"
      }
    ]
  });

  return { primaryId: primary.id, secondaryId: secondary.id };
}
