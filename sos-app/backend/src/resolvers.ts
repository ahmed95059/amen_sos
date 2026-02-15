import { Role, CaseStatus, DocumentType } from "@prisma/client";
import { Context, requireAuth, requireRole } from "./context";
import { verifyPassword, signJwt } from "./auth";
import { computeScore } from "./scoring";
import { assignTwoPsychologists } from "./assignment";
import { saveFileToDisk, FileInput } from "./storage";
import bcrypt from "bcryptjs";
import {
  notifyPsychologistsOnCaseCreated,
  notifyDirectorWhenPsyDocsReady,
  notifySauvegardeAfterDirectorValidation,
} from "./notifications";

export const resolvers = {
  Query: {
    me: async (_: any, __: any, ctx: Context) => ctx.user,

    villages: async (_: any, __: any, ctx: Context) => {
      requireAuth(ctx);
      return ctx.prisma.village.findMany({ orderBy: { name: "asc" } });
    },

    myCases: async (_: any, __: any, ctx: Context) => {
      const u = requireRole(ctx, [Role.DECLARANT]);
      return ctx.prisma.case.findMany({
        where: { createdById: u.id },
        orderBy: { createdAt: "desc" },
        include: baseCaseIncludes(),
      });
    },

    caseById: async (_: any, args: { id: string }, ctx: Context) => {
      const u = requireAuth(ctx);
      if (u.role === Role.ADMIN_IT) throw new Error("FORBIDDEN");
      const c = await ctx.prisma.case.findUnique({
        where: { id: args.id },
        include: baseCaseIncludes(),
      });
      if (!c) return null;

      if (u.role === Role.DECLARANT && c.createdById !== u.id) throw new Error("FORBIDDEN");

      if (u.role === Role.PSY) {
        const assigned = await ctx.prisma.caseAssignment.findFirst({
          where: { caseId: c.id, psychologistId: u.id },
        });
        if (!assigned) throw new Error("FORBIDDEN");
      }

      if (u.role === Role.DIR_VILLAGE && u.villageId !== c.villageId) throw new Error("FORBIDDEN");

      return c;
    },

    psyAssignedCases: async (_: any, args: { status?: CaseStatus }, ctx: Context) => {
      const u = requireRole(ctx, [Role.PSY]);
      if (!u.villageId) return [];

      return ctx.prisma.case.findMany({
        where: {
          villageId: u.villageId,
          assignments: { some: { psychologistId: u.id } },
          ...(args.status
            ? { status: args.status }
            : { status: { in: [CaseStatus.PENDING, CaseStatus.IN_PROGRESS, CaseStatus.SIGNED] } }),
        },
        orderBy: [{ score: "desc" }, { createdAt: "asc" }],
        include: baseCaseIncludes(),
      });
    },

    dirVillageCases: async (_: any, __: any, ctx: Context) => {
      const u = requireRole(ctx, [Role.DIR_VILLAGE]);
      if (!u.villageId) return [];

      return ctx.prisma.case.findMany({
        where: {
          villageId: u.villageId,
          status: CaseStatus.IN_PROGRESS,
        },
        orderBy: [{ score: "desc" }, { createdAt: "asc" }],
        include: baseCaseIncludes(),
      });
    },

    sauvegardeCases: async (_: any, __: any, ctx: Context) => {
      requireRole(ctx, [Role.RESPONSABLE_SAUVEGARDE]);

      return ctx.prisma.case.findMany({
        where: {
          dirVillageValidatedAt: { not: null },
        },
        orderBy: [{ score: "desc" }, { createdAt: "asc" }],
        include: baseCaseIncludes(),
      });
    },

    adminStats: async (_: any, __: any, ctx: Context) => {
      requireRole(ctx, [Role.ADMIN_IT]);

      const [totalCases, totalUsers, byStatusRaw, byVillageRaw] = await Promise.all([
        ctx.prisma.case.count(),
        ctx.prisma.user.count(),
        ctx.prisma.case.groupBy({
          by: ["status"],
          _count: { status: true },
        }),
        ctx.prisma.case.groupBy({
          by: ["villageId"],
          _count: { villageId: true },
        }),
      ]);

      const villages = await ctx.prisma.village.findMany({
        select: { id: true, name: true },
      });
      const villageNameById = new Map(villages.map((v) => [v.id, v.name]));

      return {
        totalCases,
        totalUsers,
        byStatus: byStatusRaw.map((x) => ({ status: x.status, count: x._count.status })),
        byVillage: byVillageRaw.map((x) => ({
          villageId: x.villageId,
          villageName: villageNameById.get(x.villageId) || x.villageId,
          count: x._count.villageId,
        })),
      };
    },

    adminLogs: async (_: any, args: { limit?: number }, ctx: Context) => {
      requireRole(ctx, [Role.ADMIN_IT]);
      const limit = Math.max(1, Math.min(500, Number(args.limit || 100)));

      const logs = await ctx.prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
        include: {
          actor: {
            select: { name: true, email: true },
          },
        },
      });

      return logs.map((l) => ({
        id: l.id,
        createdAt: l.createdAt.toISOString(),
        action: l.action,
        entity: l.entity,
        entityId: l.entityId,
        actorName: l.actor?.name ?? null,
        actorEmail: l.actor?.email ?? null,
        metaJson: l.metaJson ?? null,
      }));
    },

    adminUsers: async (_: any, __: any, ctx: Context) => {
      requireRole(ctx, [Role.ADMIN_IT]);
      return ctx.prisma.user.findMany({
        orderBy: [{ role: "asc" }, { email: "asc" }],
        include: { village: true },
      });
    },

    myNotifications: async (_: any, __: any, ctx: Context) => {
      const u = requireAuth(ctx);
      return ctx.prisma.notification.findMany({
        where: { userId: u.id },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
    },
  },

  Mutation: {
    login: async (_: any, args: { email: string; password: string }, ctx: Context) => {
      const user = await ctx.prisma.user.findUnique({
        where: { email: args.email },
        include: { village: true },
      });
      if (!user) throw new Error("INVALID_CREDENTIALS");
      const ok = await verifyPassword(args.password, user.passwordHash);
      if (!ok) throw new Error("INVALID_CREDENTIALS");

      const token = signJwt({ sub: user.id, role: user.role }, ctx.jwtSecret);
      return { token, user };
    },

    createCase: async (_: any, args: { input: any }, ctx: Context) => {
      const u = requireRole(ctx, [Role.DECLARANT]);

      const input = args.input as {
        isAnonymous: boolean;
        villageId: string;
        incidentType: any;
        urgency: any;
        abuserName?: string | null;
        childName?: string | null;
        description?: string | null;
        attachments?: FileInput[];
      };

      const recurrence = await ctx.prisma.case.findFirst({
        where: {
          villageId: input.villageId,
          OR: [
            input.childName ? { childName: input.childName } : undefined,
            input.abuserName ? { abuserName: input.abuserName } : undefined,
          ].filter(Boolean) as any,
          createdAt: { gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 180) }
        }
      });

      const createdAt = new Date();
      const hasAttachment = !!(input.attachments && input.attachments.length > 0);

      const score = computeScore({
        urgency: input.urgency,
        incidentType: input.incidentType,
        description: input.description,
        hasAttachment,
        recurrence: !!recurrence,
        createdAt,
      });

      const created = await ctx.prisma.case.create({
        data: {
          createdById: u.id,
          isAnonymous: input.isAnonymous,
          villageId: input.villageId,
          incidentType: input.incidentType,
          urgency: input.urgency,
          abuserName: input.abuserName ?? null,
          childName: input.childName ?? null,
          description: input.description ?? null,
          score,
          status: CaseStatus.PENDING,
          createdAt,
        },
      });

      if (input.attachments?.length) {
        for (const f of input.attachments) {
          const saved = saveFileToDisk({
            uploadRoot: ctx.uploadDir,
            subdir: `cases/${created.id}/attachments`,
            file: f,
            maxBytes: ctx.maxUploadBytes,
          });
          await ctx.prisma.attachment.create({
            data: {
              caseId: created.id,
              filename: saved.filename,
              mimeType: saved.mimeType,
              path: saved.path,
              sizeBytes: saved.sizeBytes,
              uploadedById: u.id,
            },
          });
        }
      }

      await assignTwoPsychologists(ctx.prisma, created.id, created.villageId);
      await notifyPsychologistsOnCaseCreated(ctx.prisma, created.id);

      await ctx.prisma.auditLog.create({
        data: {
          actorId: u.id,
          action: "CREATE_CASE",
          entity: "Case",
          entityId: created.id,
        },
      });

      return ctx.prisma.case.findUnique({
        where: { id: created.id },
        include: baseCaseIncludes(),
      });
    },

    psyUpdateCaseStatus: async (_: any, args: { caseId: string; status: CaseStatus }, ctx: Context) => {
      const u = requireRole(ctx, [Role.PSY]);

      const assigned = await ctx.prisma.caseAssignment.findFirst({
        where: { caseId: args.caseId, psychologistId: u.id },
      });
      if (!assigned) throw new Error("FORBIDDEN");

      const current = await ctx.prisma.case.findUnique({
        where: { id: args.caseId },
        select: { id: true, status: true },
      });
      if (!current) throw new Error("NOT_FOUND");
      if (current.status === CaseStatus.SIGNED && args.status !== CaseStatus.CLOSED) {
        throw new Error("SIGNED_CASE_CAN_ONLY_BE_CLOSED");
      }
      if (args.status === CaseStatus.CLOSED && current.status !== CaseStatus.SIGNED) {
        throw new Error("ONLY_SIGNED_CASE_CAN_BE_CLOSED");
      }

      const updated = await ctx.prisma.case.update({
        where: { id: args.caseId },
        data: { status: args.status },
        include: baseCaseIncludes(),
      });

      await ctx.prisma.auditLog.create({
        data: {
          actorId: u.id,
          action: "PSY_UPDATE_STATUS",
          entity: "Case",
          entityId: updated.id,
          metaJson: JSON.stringify({ status: args.status }),
        },
      });

      return updated;
    },

    psyUploadDocument: async (
      _: any,
      args: { caseId: string; docType: DocumentType; file: FileInput },
      ctx: Context
    ) => {
      const u = requireRole(ctx, [Role.PSY]);

      const assigned = await ctx.prisma.caseAssignment.findFirst({
        where: { caseId: args.caseId, psychologistId: u.id },
      });
      if (!assigned) throw new Error("FORBIDDEN");

      const saved = saveFileToDisk({
        uploadRoot: ctx.uploadDir,
        subdir: `cases/${args.caseId}/documents`,
        file: args.file,
        maxBytes: ctx.maxUploadBytes,
      });

      const doc = await ctx.prisma.caseDocument.create({
        data: {
          caseId: args.caseId,
          docType: args.docType,
          filename: saved.filename,
          mimeType: saved.mimeType,
          path: saved.path,
          sizeBytes: saved.sizeBytes,
          uploadedById: u.id,
        },
      });

      await ctx.prisma.auditLog.create({
        data: {
          actorId: u.id,
          action: "PSY_UPLOAD_DOCUMENT",
          entity: "CaseDocument",
          entityId: doc.id,
          metaJson: JSON.stringify({ caseId: args.caseId, docType: args.docType }),
        },
      });

      await notifyDirectorWhenPsyDocsReady(ctx.prisma, args.caseId);

      return doc;
    },

    dirVillageValidateCase: async (_: any, args: { caseId: string; signatureFile: FileInput }, ctx: Context) => {
      const u = requireRole(ctx, [Role.DIR_VILLAGE]);
      if (!u.villageId) throw new Error("FORBIDDEN");
      if (!args.signatureFile?.base64) throw new Error("SIGNATURE_REQUIRED");
      if (!isSupportedSignatureFile(args.signatureFile)) throw new Error("SIGNATURE_FILE_UNSUPPORTED");

      const c = await ctx.prisma.case.findUnique({
        where: { id: args.caseId },
        include: { documents: true },
      });
      if (!c || c.villageId !== u.villageId) throw new Error("FORBIDDEN");
      if (c.status !== CaseStatus.IN_PROGRESS) throw new Error("INVALID_CASE_STATUS");
      if (!hasRequiredDocuments(c.documents)) throw new Error("MISSING_REQUIRED_DOCUMENTS");

      const savedSignature = saveFileToDisk({
        uploadRoot: ctx.uploadDir,
        subdir: `cases/${args.caseId}/signatures/dir_village`,
        file: args.signatureFile,
        maxBytes: ctx.maxUploadBytes,
      });

      const updated = await ctx.prisma.case.update({
        where: { id: args.caseId },
        data: {
          dirVillageValidatedAt: new Date(),
          dirVillageSignature: savedSignature.path,
          dirVillageValidatedById: u.id,
        },
        include: baseCaseIncludes(),
      });

      await ctx.prisma.auditLog.create({
        data: {
          actorId: u.id,
          action: "DIR_VILLAGE_VALIDATE_CASE",
          entity: "Case",
          entityId: updated.id,
          metaJson: JSON.stringify({ signatureFile: savedSignature.filename }),
        },
      });

      await notifySauvegardeAfterDirectorValidation(ctx.prisma, args.caseId);

      return updated;
    },

    sauvegardeValidateCase: async (_: any, args: { caseId: string; signatureFile: FileInput }, ctx: Context) => {
      const u = requireRole(ctx, [Role.RESPONSABLE_SAUVEGARDE]);
      if (!args.signatureFile?.base64) throw new Error("SIGNATURE_REQUIRED");
      if (!isSupportedSignatureFile(args.signatureFile)) throw new Error("SIGNATURE_FILE_UNSUPPORTED");

      const c = await ctx.prisma.case.findUnique({
        where: { id: args.caseId },
        include: { documents: true },
      });
      if (!c) throw new Error("NOT_FOUND");
      if (c.status !== CaseStatus.IN_PROGRESS) throw new Error("INVALID_CASE_STATUS");
      if (!c.dirVillageValidatedAt) throw new Error("DIR_VILLAGE_VALIDATION_REQUIRED");
      if (!hasRequiredDocuments(c.documents)) throw new Error("MISSING_REQUIRED_DOCUMENTS");
      if (!c.dirVillageSignature) throw new Error("DIR_VILLAGE_SIGNATURE_REQUIRED");

      const savedSignature = saveFileToDisk({
        uploadRoot: ctx.uploadDir,
        subdir: `cases/${args.caseId}/signatures/sauvegarde`,
        file: args.signatureFile,
        maxBytes: ctx.maxUploadBytes,
      });

      const updated = await ctx.prisma.case.update({
        where: { id: args.caseId },
        data: {
          status: CaseStatus.SIGNED,
          sauvegardeValidatedAt: new Date(),
          sauvegardeSignature: savedSignature.path,
          sauvegardeValidatedById: u.id,
        },
        include: baseCaseIncludes(),
      });

      const villagePsychologists = await ctx.prisma.user.findMany({
        where: { role: Role.PSY, villageId: c.villageId },
        select: { id: true },
      });
      if (villagePsychologists.length > 0) {
        await ctx.prisma.notification.createMany({
          data: villagePsychologists.map((p) => ({
            userId: p.id,
            caseId: c.id,
            type: "CASE_SIGNED",
            message: "Signalement signé par Responsable Sauvegarde. Prêt à clôturer.",
          })),
        });
      }

      await ctx.prisma.auditLog.create({
        data: {
          actorId: u.id,
          action: "SAUVEGARDE_VALIDATE_CASE",
          entity: "Case",
          entityId: updated.id,
          metaJson: JSON.stringify({ signatureFile: savedSignature.filename }),
        },
      });

      return updated;
    },

    adminCreateUser: async (_: any, args: { input: any }, ctx: Context) => {
      requireRole(ctx, [Role.ADMIN_IT]);
      const input = args.input as {
        name: string;
        email: string;
        password: string;
        role: Role;
        villageId?: string | null;
        whatsappNumber?: string | null;
      };

      const email = String(input.email || "").trim().toLowerCase();
      const name = String(input.name || "").trim();
      const password = String(input.password || "");
      if (!email || !name || !password) throw new Error("INVALID_INPUT");
      if (password.length < 8) throw new Error("PASSWORD_TOO_SHORT");
      if (input.role === Role.ADMIN_IT) throw new Error("ADMIN_CREATE_ADMIN_FORBIDDEN");

      const villageRequiredRoles = [Role.DECLARANT, Role.PSY, Role.DIR_VILLAGE];
      const villageId = input.villageId ?? null;
      const whatsappNumber = input.whatsappNumber ? String(input.whatsappNumber).trim() : null;
      if (villageRequiredRoles.includes(input.role) && !villageId) throw new Error("VILLAGE_REQUIRED");
      if (!villageRequiredRoles.includes(input.role) && villageId) throw new Error("VILLAGE_NOT_ALLOWED_FOR_ROLE");

      const passwordHash = await bcrypt.hash(password, 10);

      try {
        return await ctx.prisma.user.create({
          data: {
            name,
            email,
            passwordHash,
            role: input.role,
            villageId,
            whatsappNumber,
          },
          include: { village: true },
        });
      } catch {
        throw new Error("USER_CREATE_FAILED");
      }
    },

    adminDeleteUser: async (_: any, args: { userId: string }, ctx: Context) => {
      const admin = requireRole(ctx, [Role.ADMIN_IT]);
      if (args.userId === admin.id) throw new Error("CANNOT_DELETE_SELF");

      const target = await ctx.prisma.user.findUnique({
        where: { id: args.userId },
        select: { id: true, email: true },
      });
      if (!target) return false;

      const relatedCount =
        (await ctx.prisma.case.count({ where: { createdById: args.userId } })) +
        (await ctx.prisma.caseAssignment.count({ where: { psychologistId: args.userId } })) +
        (await ctx.prisma.caseDocument.count({ where: { uploadedById: args.userId } })) +
        (await ctx.prisma.attachment.count({ where: { uploadedById: args.userId } })) +
        (await ctx.prisma.notification.count({ where: { userId: args.userId } })) +
        (await ctx.prisma.auditLog.count({ where: { actorId: args.userId } }));
      if (relatedCount > 0) throw new Error("USER_HAS_RELATED_DATA");

      await ctx.prisma.user.delete({ where: { id: args.userId } });
      return true;
    },

    markNotificationRead: async (_: any, args: { id: string }, ctx: Context) => {
      const u = requireAuth(ctx);
      const notif = await ctx.prisma.notification.findUnique({ where: { id: args.id } });
      if (!notif || notif.userId !== u.id) throw new Error("FORBIDDEN");
      return ctx.prisma.notification.update({
        where: { id: args.id },
        data: { readAt: new Date() },
      });
    },
  },

  Case: {
    village: (parent: any, _: any, ctx: Context) =>
      ctx.prisma.village.findUnique({ where: { id: parent.villageId } }),

    createdBy: async (parent: any, _: any, ctx: Context) => {
      const u = requireAuth(ctx);
      if (parent.isAnonymous && u.role !== Role.DECLARANT) return null;
      return ctx.prisma.user.findUnique({ where: { id: parent.createdById } });
    },

    attachments: (parent: any, _: any, ctx: Context) =>
      ctx.prisma.attachment.findMany({ where: { caseId: parent.id }, orderBy: { createdAt: "desc" } }),

    assignments: (parent: any, _: any, ctx: Context) =>
      ctx.prisma.caseAssignment.findMany({
        where: { caseId: parent.id },
        include: { psychologist: { include: { village: true } } },
        orderBy: { assignedAt: "asc" },
      }),

    documents: (parent: any, _: any, ctx: Context) =>
      ctx.prisma.caseDocument.findMany({ where: { caseId: parent.id }, orderBy: { createdAt: "desc" } }),
  },

  Attachment: {
    downloadUrl: (parent: any) => `/files/attachments/${parent.id}`,
  },

  CaseDocument: {
    downloadUrl: (parent: any) => `/files/documents/${parent.id}`,
  },
};

function hasRequiredDocuments(docs: Array<{ docType: DocumentType }>) {
  let hasFiche = false;
  let hasRapport = false;
  for (const d of docs) {
    if (d.docType === DocumentType.FICHE_INITIALE) hasFiche = true;
    if (d.docType === DocumentType.RAPPORT_DPE) hasRapport = true;
  }
  return hasFiche && hasRapport;
}

function isSupportedSignatureFile(file: FileInput) {
  const mime = file.mimeType || "";
  const name = (file.filename || "").toLowerCase();
  if (mime.startsWith("image/")) return true;
  if (mime === "application/pdf") return true;
  return name.endsWith(".pdf");
}

function baseCaseIncludes() {
  return {
    village: true,
    attachments: true,
    documents: true,
    assignments: { include: { psychologist: { include: { village: true } } } },
    createdBy: true,
  };
}
