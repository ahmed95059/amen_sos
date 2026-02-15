export type GqlError = { message: string };

export const GRAPHQL_URL =
  process.env.NEXT_PUBLIC_GRAPHQL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:4000/graphql";

export function apiOrigin(): string {
  try {
    return new URL(GRAPHQL_URL).origin;
  } catch {
    return "http://localhost:4000";
  }
}

export async function gqlRequest<T>(params: {
  query: string;
  variables?: Record<string, unknown>;
  token?: string | null;
}): Promise<T> {
  const res = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(params.token ? { authorization: `Bearer ${params.token}` } : {}),
    },
    body: JSON.stringify({ query: params.query, variables: params.variables || {} }),
    cache: "no-store",
  });

  const payload = (await res.json()) as { data?: T; errors?: GqlError[] };
  if (!res.ok) {
    throw new Error(payload?.errors?.[0]?.message || `HTTP_${res.status}`);
  }
  if (payload.errors?.length) {
    throw new Error(payload.errors[0].message);
  }
  if (!payload.data) {
    throw new Error("NO_DATA");
  }
  return payload.data;
}

export function tokenizedFileUrl(downloadUrl: string, token: string, forceDownload = false): string {
  const url = new URL(downloadUrl, apiOrigin());
  if (token) url.searchParams.set("token", token);
  if (forceDownload) url.searchParams.set("download", "1");
  return url.toString();
}

export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      const i = text.indexOf("base64,");
      resolve(i >= 0 ? text.slice(i + 7) : text);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function fmtDate(value?: string | number | null): string {
  if (!value) return "-";
  const normalized = typeof value === "number" || /^\d+$/.test(String(value)) ? Number(value) : value;
  const d = new Date(normalized as string | number);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("fr-FR");
}
