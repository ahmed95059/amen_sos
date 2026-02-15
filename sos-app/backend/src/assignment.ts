import { PrismaClient, Role, CaseStatus } from "@prisma/client";

export async function assignTwoPsychologists(prisma: PrismaClient, caseId: string, villageId: string) {
  const villagePsy = await prisma.user.findMany({
    where: { role: Role.PSY, villageId },
    select: { id: true, name: true },
  });

  if (villagePsy.length === 0) {
    throw new Error("NO_PSY_AVAILABLE");
  }

  const loads = await Promise.all(
    villagePsy.map(async (p) => {
      const count = await prisma.caseAssignment.count({
        where: {
          psychologistId: p.id,
          case: { status: { in: [CaseStatus.PENDING, CaseStatus.IN_PROGRESS] } },
        },
      });
      return { ...p, load: count };
    })
  );

  const selected = loads.sort((a, b) => a.load - b.load).slice(0, 2);
  const primary = selected[0]!;
  const secondary = selected[1] ?? null;

  await prisma.caseAssignment.createMany({
    data: [
      { caseId, psychologistId: primary.id, assignmentRole: "PRIMARY" },
      ...(secondary ? [{ caseId, psychologistId: secondary.id, assignmentRole: "SECONDARY" as const }] : []),
    ],
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: primary.id,
        caseId,
        type: "CASE_ASSIGNED",
        message: "Nouveau signalement assigné (PRIMARY)",
      },
      ...(secondary
        ? [
            {
              userId: secondary.id,
              caseId,
              type: "CASE_ASSIGNED",
              message: "Nouveau signalement assigné (SECONDARY)",
            },
          ]
        : []),
    ],
  });

  return { primaryId: primary.id, secondaryId: secondary?.id ?? null };
}
