import { Role, CaseStatus, DocumentType } from "@prisma/client";
import { Context, requireAuth, requireRole } from "./context";
import { verifyPassword, signJwt } from "./auth";
import { computeScore } from "./scoring";
import { assignTwoPsychologists } from "./assignment";
import { saveFileToDisk, FileInput } from "./storage";

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

      return c;
    },

    psyAssignedCases: async (_: any, args: { status?: CaseStatus }, ctx: Context) => {
      const u = requireRole(ctx, [Role.PSY]);

      return ctx.prisma.case.findMany({
        where: {
          assignments: { some: { psychologistId: u.id } },
          ...(args.status ? { status: args.status } : {}),
        },
        orderBy: [{ score: "desc" }, { createdAt: "asc" }],
        include: baseCaseIncludes(),
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

      return doc;
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
};

function baseCaseIncludes() {
  return {
    village: true,
    attachments: true,
    documents: true,
    assignments: { include: { psychologist: { include: { village: true } } } },
    createdBy: true,
  };
}
