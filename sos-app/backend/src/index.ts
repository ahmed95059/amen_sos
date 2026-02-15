import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { Role } from "@prisma/client";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { typeDefs } from "./schema";
import { resolvers } from "./resolvers";
import { buildContext, prisma } from "./context";
import { verifyJwt } from "./auth";
import { startPendingReminderScheduler } from "./notifications";
import { runAssistantChat, runDrawingAnalysis } from "./assistant";
import { transcribeWithSpeechService } from "./speech2text";

function getRequestToken(req: any) {
  const authHeader = req.headers?.authorization || "";
  if (authHeader.startsWith("Bearer ")) return authHeader.slice(7);
  if (typeof req.query?.token === "string") return req.query.token;
  return "";
}

async function getAuthUser(req: any, jwtSecret: string) {
  const token = getRequestToken(req);
  const payload = token ? verifyJwt(token, jwtSecret) : null;
  if (!payload?.sub) return null;
  return prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, role: true, villageId: true },
  });
}

async function canReadCase(user: { id: string; role: Role; villageId?: string | null }, caseId: string) {
  if (user.role === Role.DECLARANT) {
    const ownCase = await prisma.case.findFirst({
      where: { id: caseId, createdById: user.id },
      select: { id: true },
    });
    return !!ownCase;
  }

  if (user.role === Role.PSY) {
    const assignment = await prisma.caseAssignment.findFirst({
      where: { caseId, psychologistId: user.id },
      select: { id: true },
    });
    return !!assignment;
  }

  if (user.role === Role.DIR_VILLAGE) {
    if (!user.villageId) return false;
    const inVillage = await prisma.case.findFirst({
      where: { id: caseId, villageId: user.villageId },
      select: { id: true },
    });
    return !!inVillage;
  }

  if (user.role === Role.RESPONSABLE_SAUVEGARDE) return true;
  if (user.role === Role.ADMIN_IT) return false;

  return true;
}

async function main() {
  const app = express();
  app.use(cors());
  const maxUploadMb = Number(process.env.MAX_UPLOAD_MB || "50");
  // Base64 payload is larger than raw file bytes, keep a safe margin.
  const jsonLimitMb = Math.max(100, Math.ceil(maxUploadMb * 2));
  app.use(express.json({ limit: `${jsonLimitMb}mb` }));

  const uploadDir = process.env.UPLOAD_DIR || "./uploads";
  fs.mkdirSync(uploadDir, { recursive: true });

  const httpServer = http.createServer(app);
  const jwtSecret = process.env.JWT_SECRET || "";

  app.get("/files/attachments/:id", async (req, res) => {
    try {
      const user = jwtSecret ? await getAuthUser(req, jwtSecret) : null;
      if (!user) return res.status(401).json({ error: "UNAUTHENTICATED" });

      const attachment = await prisma.attachment.findUnique({
        where: { id: req.params.id },
        select: { caseId: true, filename: true, mimeType: true, path: true },
      });
      if (!attachment) return res.status(404).json({ error: "NOT_FOUND" });

      const allowed = await canReadCase(user, attachment.caseId);
      if (!allowed) return res.status(403).json({ error: "FORBIDDEN" });
      if (!fs.existsSync(attachment.path)) return res.status(404).json({ error: "FILE_NOT_FOUND" });

      const mode = req.query.download === "1" ? "attachment" : "inline";
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.setHeader("Content-Type", attachment.mimeType || "application/octet-stream");
      res.setHeader("Content-Disposition", `${mode}; filename="${attachment.filename.replace(/"/g, "")}"`);
      return res.sendFile(path.resolve(attachment.path));
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "INTERNAL_ERROR" });
    }
  });

  app.get("/files/documents/:id", async (req, res) => {
    try {
      const user = jwtSecret ? await getAuthUser(req, jwtSecret) : null;
      if (!user) return res.status(401).json({ error: "UNAUTHENTICATED" });

      const doc = await prisma.caseDocument.findUnique({
        where: { id: req.params.id },
        select: { caseId: true, filename: true, mimeType: true, path: true },
      });
      if (!doc) return res.status(404).json({ error: "NOT_FOUND" });

      const allowed = await canReadCase(user, doc.caseId);
      if (!allowed) return res.status(403).json({ error: "FORBIDDEN" });
      if (!fs.existsSync(doc.path)) return res.status(404).json({ error: "FILE_NOT_FOUND" });

      const mode = req.query.download === "1" ? "attachment" : "inline";
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.setHeader("Content-Type", doc.mimeType || "application/octet-stream");
      res.setHeader("Content-Disposition", `${mode}; filename="${doc.filename.replace(/"/g, "")}"`);
      return res.sendFile(path.resolve(doc.path));
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "INTERNAL_ERROR" });
    }
  });

  app.post("/assistant/chat", async (req, res) => {
    try {
      const user = jwtSecret ? await getAuthUser(req, jwtSecret) : null;
      if (!user) return res.status(401).json({ error: "UNAUTHENTICATED" });
      if (user.role !== Role.DECLARANT) return res.status(403).json({ error: "FORBIDDEN" });

      const body = req.body as { message?: string; history?: Array<{ role: "user" | "assistant"; text: string }> };
      const result = await runAssistantChat({
        message: body?.message || "",
        history: Array.isArray(body?.history) ? body.history : [],
      });

      return res.json(result);
    } catch (e: any) {
      const code = e instanceof Error ? e.message : "ASSISTANT_CHAT_FAILED";
      if (code === "ASSISTANT_MESSAGE_REQUIRED") {
        return res.status(400).json({ error: code });
      }
      if (code === "MODELE_RAG_UNREACHABLE" || code === "MODELE_RAG_EMPTY_RESPONSE") {
        return res.status(503).json({ error: code });
      }
      console.error("[assistant/chat]", e);
      return res.status(500).json({ error: code || "ASSISTANT_CHAT_FAILED" });
    }
  });

  app.post("/assistant/drawing-analysis", async (req, res) => {
    try {
      const user = jwtSecret ? await getAuthUser(req, jwtSecret) : null;
      if (!user) return res.status(401).json({ error: "UNAUTHENTICATED" });
      if (user.role !== Role.DECLARANT) return res.status(403).json({ error: "FORBIDDEN" });

      const body = req.body as { imageBase64?: string; mimeType?: string; note?: string };
      const result = await runDrawingAnalysis({
        imageBase64: body?.imageBase64 || "",
        mimeType: body?.mimeType || "image/png",
        note: body?.note || "",
      });

      return res.json(result);
    } catch (e: any) {
      const code = e instanceof Error ? e.message : "ASSISTANT_DRAWING_ANALYSIS_FAILED";
      if (code === "ASSISTANT_IMAGE_REQUIRED" || code === "ASSISTANT_IMAGE_TOO_LARGE") {
        return res.status(400).json({ error: code });
      }
      if (
        code === "EMOTIONAL_MODEL_SCRIPT_NOT_FOUND" ||
        code === "EMOTIONAL_MODEL_EXEC_FAILED" ||
        code === "EMOTIONAL_MODEL_OUTPUT_NOT_FOUND"
      ) {
        return res.status(503).json({ error: code });
      }
      console.error("[assistant/drawing-analysis]", e);
      return res.status(500).json({ error: code || "ASSISTANT_DRAWING_ANALYSIS_FAILED" });
    }
  });

  app.post("/speech2text/transcribe", async (req, res) => {
    try {
      const user = jwtSecret ? await getAuthUser(req, jwtSecret) : null;
      if (!user) return res.status(401).json({ error: "UNAUTHENTICATED" });
      if (user.role === Role.ADMIN_IT || user.role === Role.DIR_NATIONAL) {
        return res.status(403).json({ error: "FORBIDDEN" });
      }

      const body = req.body as {
        filename?: string;
        mimeType?: string;
        base64?: string;
        language?: string;
      };

      const serviceUrl = process.env.SPEECH2TEXT_API_URL || "http://127.0.0.1:7001";
      const result = await transcribeWithSpeechService({
        serviceUrl,
        filename: body?.filename || "recording.webm",
        mimeType: body?.mimeType || "audio/webm",
        base64: body?.base64 || "",
        language: body?.language || "ar-tn",
      });

      return res.json(result);
    } catch (e: any) {
      const code = e instanceof Error ? e.message : "SPEECH2TEXT_FAILED";
      const status =
        code === "SPEECH2TEXT_AUDIO_REQUIRED" ? 400 :
        code === "SPEECH2TEXT_EMPTY_TRANSCRIPT" ? 422 :
        code === "SPEECH2TEXT_SERVICE_UNREACHABLE" ? 503 :
        code === "SPEECH2TEXT_URL_NOT_CONFIGURED" ? 500 :
        502;
      console.error("[speech2text/transcribe]", e);
      return res.status(status).json({ error: code });
    }
  });

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  });

  await server.start();

  app.use(
    "/graphql",
    expressMiddleware(server, {
      context: async ({ req }) => buildContext(req),
    })
  );

  const port = Number(process.env.PORT || "4000");
  await new Promise<void>((resolve) => httpServer.listen({ port }, resolve));
  startPendingReminderScheduler(prisma);
  console.log(`GraphQL ready at http://localhost:${port}/graphql`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
