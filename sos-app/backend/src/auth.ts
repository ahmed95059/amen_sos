import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

export type JwtPayload = {
  sub: string;
  role: Role;
};

export function signJwt(payload: JwtPayload, secret: string) {
  return jwt.sign(payload, secret, { expiresIn: "12h" });
}

export function verifyJwt(token: string, secret: string): JwtPayload | null {
  try {
    return jwt.verify(token, secret) as JwtPayload;
  } catch {
    return null;
  }
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}
