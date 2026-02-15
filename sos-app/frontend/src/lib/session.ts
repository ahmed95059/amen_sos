export type Role =
  | "DECLARANT"
  | "PSY"
  | "ADMIN_IT"
  | "DIR_VILLAGE"
  | "RESPONSABLE_SAUVEGARDE"
  | "DIR_NATIONAL";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  village?: { id: string; name: string } | null;
};

const TOKEN_KEY = "sos_token";
const USER_KEY = "sos_user";

export function readToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function readUser(): SessionUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export function storeSession(token: string, user: SessionUser) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function roleLabel(role: Role): string {
  if (role === "DECLARANT") return "Déclarant";
  if (role === "PSY") return "Psychologue";
  if (role === "DIR_VILLAGE") return "Directeur de village";
  if (role === "RESPONSABLE_SAUVEGARDE") return "Responsable sauvegarde";
  if (role === "ADMIN_IT") return "Admin IT";
  if (role === "DIR_NATIONAL") return "Directeur national";
  return role;
}

export function statusLabel(status: string): string {
  if (status === "PENDING") return "En attente";
  if (status === "IN_PROGRESS") return "En cours de traitement";
  if (status === "SIGNED") return "Signé";
  if (status === "FALSE_REPORT") return "Faux signalement";
  if (status === "CLOSED") return "Clôturé";
  return status;
}
