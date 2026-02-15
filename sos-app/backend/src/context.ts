import { PrismaClient, Role, User } from "@prisma/client";
import { verifyJwt } from "./auth";

export const prisma = new PrismaClient();

export type Context = {
  prisma: PrismaClient;
  user: (Pick<User, "id" | "role" | "villageId" | "name" | "email">) | null;
  jwtSecret: string;
  uploadDir: string;
  maxUploadBytes: number;
};

export async function buildContext(req: any): Promise<Context> {
  const jwtSecret = process.env.JWT_SECRET!;
  const uploadDir = process.env.UPLOAD_DIR || "./uploads";
  const maxUploadMb = Number(process.env.MAX_UPLOAD_MB || "50");
  const maxUploadBytes = maxUploadMb * 1024 * 1024;

  const authHeader = req.headers?.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  const payload = token ? verifyJwt(token, jwtSecret) : null;

  let user = null as Context["user"];
  if (payload?.sub) {
    const dbUser = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, role: true, villageId: true, name: true, email: true },
    });
    user = dbUser ?? null;
  }

  return { prisma, user, jwtSecret, uploadDir, maxUploadBytes };
}

export function requireAuth(ctx: Context) {
  if (!ctx.user) throw new Error("UNAUTHENTICATED");
  return ctx.user;
}

export function requireRole(ctx: Context, roles: Role[]) {
  const u = requireAuth(ctx);
  if (!roles.includes(u.role)) throw new Error("FORBIDDEN");
  return u;
}
