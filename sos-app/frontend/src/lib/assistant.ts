import { getAuthToken } from "./backend";

export type AssistantHistoryMessage = {
  role: "user" | "assistant";
  text: string;
};

export type AssistantSentiment = {
  sentiment: "positive" | "neutral" | "negative";
  emotion: string;
  intensity: number;
  riskLevel: "low" | "medium" | "high";
  explanation: string;
};

export type AssistantChatResponse = {
  answer: string;
  sentiment: AssistantSentiment;
  rag: {
    sources: string[];
    snippets: string[];
  };
};

export type AssistantDrawingAnalysis = {
  mood: string;
  indicators: string[];
  colors: string[];
  tags: string[];
  summary: string;
  caution: string;
  source: "emotional-model-local";
};

const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL || "http://localhost:4000/graphql";
const ASSISTANT_API_BASE =
  process.env.NEXT_PUBLIC_ASSISTANT_API_URL || GRAPHQL_URL.replace(/\/graphql\/?$/, "");

async function assistantPost<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const token = getAuthToken();
  if (!token) throw new Error("SESSION_EXPIRED");

  const res = await fetch(`${ASSISTANT_API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) {
    throw new Error(data.error || "ASSISTANT_API_ERROR");
  }

  return data as T;
}

export async function assistantChat(params: {
  message: string;
  history: AssistantHistoryMessage[];
}) {
  return assistantPost<AssistantChatResponse>("/assistant/chat", params);
}

export async function assistantAnalyzeDrawing(params: {
  imageBase64: string;
  mimeType: string;
  note?: string;
}) {
  return assistantPost<AssistantDrawingAnalysis>("/assistant/drawing-analysis", params);
}
