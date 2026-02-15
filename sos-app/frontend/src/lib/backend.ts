export const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql';

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('sos_token');
}

export async function gql<T>(query: string, variables: Record<string, unknown> = {}, token?: string): Promise<T> {
  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });
  const body = await res.json();
  if (!res.ok || body?.errors?.length) {
    throw new Error(body?.errors?.[0]?.message || 'GRAPHQL_ERROR');
  }
  return body.data as T;
}

export function urgencyFromPriority(priority: 'low' | 'medium' | 'high' | 'urgent') {
  if (priority === 'low') return 'LOW';
  if (priority === 'medium') return 'MEDIUM';
  if (priority === 'high') return 'HIGH';
  return 'CRITICAL';
}

export function incidentTypeFromProblem(problemType: string) {
  if (problemType === 'health') return 'HEALTH';
  if (problemType === 'violence' || problemType === 'abuse') return 'VIOLENCE';
  if (problemType === 'exploitation') return 'SEXUAL_ABUSE';
  if (problemType === 'familial') return 'CONFLICT';
  if (problemType === 'schooling' || problemType === 'psychological' || problemType === 'cyberbullying') return 'BEHAVIOR';
  if (problemType === 'runaway') return 'NEGLECT';
  return 'OTHER';
}

export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || '');
      const i = text.indexOf('base64,');
      resolve(i >= 0 ? text.slice(i + 7) : text);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function backendStatusLabel(status: string) {
  if (status === 'PENDING') return 'En attente';
  if (status === 'IN_PROGRESS') return 'En cours';
  if (status === 'SIGNED') return 'Signé';
  if (status === 'FALSE_REPORT') return 'Faux signalement';
  if (status === 'CLOSED') return 'Clôturé';
  return status;
}

export function backendUrgencyLabel(urgency: string) {
  if (urgency === 'LOW') return 'Faible';
  if (urgency === 'MEDIUM') return 'Moyenne';
  if (urgency === 'HIGH') return 'Élevée';
  if (urgency === 'CRITICAL') return 'Critique';
  return urgency;
}

export function formatDateTimeFR(value?: string | Date | null) {
  if (!value) return '-';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
