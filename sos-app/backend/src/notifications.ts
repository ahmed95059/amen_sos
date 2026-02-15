import { PrismaClient, Role, DocumentType, CaseStatus } from "@prisma/client";
import nodemailer from "nodemailer";
import twilio from "twilio";

function getMailer() {
  const host = process.env.SMTP_SERVER;
  const port = Number(process.env.SMTP_PORT || "587");
  const user = process.env.EMAIL_ADDRESS;
  const pass = process.env.EMAIL_PASSWORD;
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({
    host,
    port,
    secure: false,
    auth: { user, pass },
  });
}

async function sendEmail(to: string, subject: string, text: string) {
  const mailer = getMailer();
  if (!mailer) return;
  await mailer.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_ADDRESS,
    to,
    subject,
    text,
  });
}

function getTwilioClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_NUMBER;
  if (!sid || !token || !from) return null;
  return {
    client: twilio(sid, token),
    from,
  };
}

function toWhatsappAddress(number?: string | null) {
  if (!number) return "";
  if (number.startsWith("whatsapp:")) return number;
  return `whatsapp:${number}`;
}

async function sendWhatsapp(to: string, body: string) {
  const t = getTwilioClient();
  if (!t) return;
  await t.client.messages.create({
    from: t.from,
    to,
    body,
  });
}

export async function notifyPsychologistsOnCaseCreated(prisma: PrismaClient, caseId: string) {
  const c = await prisma.case.findUnique({
    where: { id: caseId },
    include: {
      village: true,
      assignments: { include: { psychologist: true } },
    },
  });
  if (!c) return;

  for (const a of c.assignments) {
    const psy = a.psychologist;
    if (psy?.email) {
      await sendEmail(
        psy.email,
        "Nouveau signalement assigné",
        `Un nouveau signalement (${c.id}) du ${c.village.name} vous a été assigné.`
      );
    }
  }
}

export async function notifyDirectorWhenPsyDocsReady(prisma: PrismaClient, caseId: string) {
  const c = await prisma.case.findUnique({
    where: { id: caseId },
    include: { documents: true, village: true },
  });
  if (!c) return;
  const hasFiche = c.documents.some((d) => d.docType === DocumentType.FICHE_INITIALE);
  const hasRapport = c.documents.some((d) => d.docType === DocumentType.RAPPORT_DPE);
  if (!hasFiche || !hasRapport) return;

  const directors = await prisma.user.findMany({
    where: { role: Role.DIR_VILLAGE, villageId: c.villageId },
    select: { id: true, email: true },
  });

  for (const d of directors) {
    const already = await prisma.notification.findFirst({
      where: { userId: d.id, caseId: c.id, type: "DIR_VILLAGE_EMAIL_SENT" },
      select: { id: true },
    });
    if (already) continue;

    if (d.email) {
      await sendEmail(
        d.email,
        "Signalement prêt pour validation Directeur",
        `Le signalement ${c.id} (${c.village.name}) a maintenant FICHE_INITIALE + RAPPORT_DPE.`
      );
    }
    await prisma.notification.create({
      data: {
        userId: d.id,
        caseId: c.id,
        type: "DIR_VILLAGE_EMAIL_SENT",
        message: "Email envoyé au directeur après upload fiche + rapport.",
      },
    });
  }
}

export async function notifySauvegardeAfterDirectorValidation(prisma: PrismaClient, caseId: string) {
  const c = await prisma.case.findUnique({
    where: { id: caseId },
    include: { village: true },
  });
  if (!c) return;

  const users = await prisma.user.findMany({
    where: { role: Role.RESPONSABLE_SAUVEGARDE },
    select: { id: true, email: true },
  });

  for (const u of users) {
    const already = await prisma.notification.findFirst({
      where: { userId: u.id, caseId: c.id, type: "SAUVEGARDE_EMAIL_SENT" },
      select: { id: true },
    });
    if (already) continue;

    if (u.email) {
      await sendEmail(
        u.email,
        "Signalement validé Directeur - action requise",
        `Le directeur a validé le signalement ${c.id} (${c.village.name}).`
      );
    }
    await prisma.notification.create({
      data: {
        userId: u.id,
        caseId: c.id,
        type: "SAUVEGARDE_EMAIL_SENT",
        message: "Email envoyé au responsable sauvegarde après validation directeur.",
      },
    });
  }
}

export async function sendPending24hWhatsappReminders(prisma: PrismaClient) {
  const threshold = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const pendingCases = await prisma.case.findMany({
    where: {
      status: CaseStatus.PENDING,
      createdAt: { lte: threshold },
    },
    include: {
      village: true,
      assignments: {
        include: {
          psychologist: { select: { id: true, name: true, whatsappNumber: true } },
        },
      },
    },
  });

  for (const c of pendingCases) {
    for (const a of c.assignments) {
      const psy = a.psychologist;
      const to = toWhatsappAddress(psy?.whatsappNumber);
      if (!to) continue;

      const already = await prisma.notification.findFirst({
        where: {
          userId: psy.id,
          caseId: c.id,
          type: "PSY_WHATSAPP_PENDING_24H_SENT",
        },
        select: { id: true },
      });
      if (already) continue;

      await sendWhatsapp(
        to,
        `Rappel: le signalement ${c.id} (${c.village.name}) est en attente depuis plus de 24h.`
      );

      await prisma.notification.create({
        data: {
          userId: psy.id,
          caseId: c.id,
          type: "PSY_WHATSAPP_PENDING_24H_SENT",
          message: "WhatsApp de rappel 24h envoyé au psychologue.",
        },
      });
    }
  }
}

export function startPendingReminderScheduler(prisma: PrismaClient) {
  const minutes = Number(process.env.PENDING_REMINDER_INTERVAL_MIN || "15");
  const intervalMs = Math.max(1, minutes) * 60 * 1000;

  sendPending24hWhatsappReminders(prisma).catch((e) => console.error("[ReminderScheduler]", e));
  setInterval(() => {
    sendPending24hWhatsappReminders(prisma).catch((e) => console.error("[ReminderScheduler]", e));
  }, intervalMs);
}
