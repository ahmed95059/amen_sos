import { IncidentType, Urgency } from "@prisma/client";

const keywordRules: Array<{ re: RegExp; points: number }> = [
  { re: /\b(suicide|viol|agression|arme|menace de mort|étrangler)\b/i, points: 10 },
  { re: /\b(saignement|fracture|hospital|abus|harcèlement|peur)\b/i, points: 5 },
  { re: /\b(fugue|crise|angoisse|insomnie)\b/i, points: 2 },
];

export function urgencyPoints(u: Urgency) {
  switch (u) {
    case "LOW": return 0;
    case "MEDIUM": return 10;
    case "HIGH": return 20;
    case "CRITICAL": return 30;
  }
}

export function typePoints(t: IncidentType) {
  switch (t) {
    case "VIOLENCE": return 35;
    case "HEALTH": return 25;
    case "SEXUAL_ABUSE": return 45;
    case "NEGLECT": return 30;
    case "BEHAVIOR": return 15;
    case "CONFLICT": return 10;
    case "OTHER": return 5;
  }
}

export function keywordPoints(text?: string | null) {
  if (!text) return 0;
  let pts = 0;
  for (const r of keywordRules) if (r.re.test(text)) pts += r.points;
  return Math.min(20, pts);
}

export function agingPoints(createdAt: Date) {
  const hours = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60));
  return Math.min(20, hours * 2);
}

export function computeScore(params: {
  urgency: Urgency;
  incidentType: IncidentType;
  description?: string | null;
  hasAttachment: boolean;
  recurrence: boolean;
  createdAt: Date;
}) {
  const base =
    urgencyPoints(params.urgency) +
    typePoints(params.incidentType) +
    keywordPoints(params.description) +
    (params.hasAttachment ? 5 : 0) +
    (params.recurrence ? 10 : 0) +
    agingPoints(params.createdAt);

  return Math.min(100, base);
}
