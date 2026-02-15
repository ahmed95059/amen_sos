import { decodeBase64 } from "./storage";

export type SpeechToTextResult = {
  text: string;
  segments?: unknown[];
  language?: string;
  filename?: string;
};

export async function transcribeWithSpeechService(params: {
  serviceUrl: string;
  filename: string;
  mimeType: string;
  base64: string;
  language?: string;
}) {
  const serviceUrl = String(params.serviceUrl || "").trim();
  if (!serviceUrl) throw new Error("SPEECH2TEXT_URL_NOT_CONFIGURED");

  const bytes = decodeBase64(String(params.base64 || ""));
  if (bytes.byteLength === 0) throw new Error("SPEECH2TEXT_AUDIO_REQUIRED");

  const language = params.language || "ar-tn";
  const endpoint = new URL(serviceUrl.replace(/\/+$/, "") + "/transcribe");
  endpoint.searchParams.set("language", language);

  const form = new FormData();
  const blob = new Blob([bytes], { type: params.mimeType || "application/octet-stream" });
  form.append("file", blob, params.filename || "recording.webm");

  let response: Response;
  try {
    response = await fetch(endpoint.toString(), {
      method: "POST",
      body: form,
    });
  } catch {
    throw new Error("SPEECH2TEXT_SERVICE_UNREACHABLE");
  }

  const raw = await response.text();
  let payload: any = {};
  try {
    payload = raw ? JSON.parse(raw) : {};
  } catch {
    payload = {};
  }

  if (!response.ok) {
    const detail = payload?.detail || payload?.error || `SPEECH2TEXT_HTTP_${response.status}`;
    throw new Error(String(detail));
  }

  const text = String(payload?.text || "").trim();
  if (!text) throw new Error("SPEECH2TEXT_EMPTY_TRANSCRIPT");

  const out: SpeechToTextResult = {
    text,
    segments: Array.isArray(payload?.segments) ? payload.segments : [],
    language: payload?.language || language,
    filename: payload?.filename || params.filename,
  };

  return out;
}

