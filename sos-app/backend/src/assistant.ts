import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

type AssistantRole = "user" | "assistant";

export type AssistantHistoryMessage = {
  role: AssistantRole;
  text: string;
};

export type AssistantSentiment = {
  sentiment: "positive" | "neutral" | "negative";
  emotion: string;
  intensity: number;
  riskLevel: "low" | "medium" | "high";
  explanation: string;
};

export type AssistantChatResult = {
  answer: string;
  sentiment: AssistantSentiment;
  rag: {
    sources: string[];
    snippets: string[];
  };
};

export type DrawingAnalysisResult = {
  mood: string;
  indicators: string[];
  colors: string[];
  tags: string[];
  summary: string;
  caution: string;
  source: "emotional-model-local";
};

type RagChatResponse = {
  response?: string;
  sources?: Array<{ metadata?: Record<string, unknown>; preview?: string }>;
};

type EmotionalResult = {
  label?: string;
  confidence?: number;
};

function truncate(value: string, n: number) {
  if (value.length <= n) return value;
  return `${value.slice(0, n - 3)}...`;
}

function analyzeSentimentHeuristic(text: string): AssistantSentiment {
  const t = text.toLowerCase();

  const negativeLexicon = ["triste", "angoisse", "anxieux", "peur", "colere", "crise", "violent", "insomnie", "stresse"];
  const positiveLexicon = ["calme", "mieux", "content", "heureux", "rassure", "confiance"];
  const riskLexicon = ["danger", "suicide", "abus", "violence", "urgence", "se faire mal", "automutilation"];

  const neg = negativeLexicon.reduce((acc, w) => acc + (t.includes(w) ? 1 : 0), 0);
  const pos = positiveLexicon.reduce((acc, w) => acc + (t.includes(w) ? 1 : 0), 0);
  const risk = riskLexicon.reduce((acc, w) => acc + (t.includes(w) ? 1 : 0), 0);

  let sentiment: AssistantSentiment["sentiment"] = "neutral";
  if (neg > pos) sentiment = "negative";
  if (pos > neg) sentiment = "positive";

  const emotion =
    risk > 0 ? "alerte" : neg >= 2 ? "detresse" : sentiment === "positive" ? "apaisement" : "preoccupation";
  const intensity = Math.min(1, Math.max(0.2, (neg + pos + risk) / 5));
  const riskLevel: AssistantSentiment["riskLevel"] = risk > 0 ? "high" : neg >= 2 ? "medium" : "low";

  return {
    sentiment,
    emotion,
    intensity: Number(intensity.toFixed(2)),
    riskLevel,
    explanation:
      risk > 0
        ? "Des termes de risque eleve ont ete detectes."
        : neg > pos
        ? "Le message exprime surtout de l inquietude ou de la detresse."
        : pos > neg
        ? "Le message exprime surtout des signes d apaisement."
        : "Le message est neutre ou mixte.",
  };
}

function resolveModelsPaths() {
  const projectRoot = path.resolve(process.cwd(), "..");
  const modelsRoot = process.env.MODELS_ROOT || path.join(projectRoot, "models");
  const emotionalRoot = process.env.EMOTIONAL_MODEL_ROOT || path.join(modelsRoot, "model");

  return {
    modelsRoot,
    emotionalRoot,
    emotionalScript: path.join(emotionalRoot, "emotional_classification", "run_yolo_EMCLS.py"),
    emotionalInput: path.join(emotionalRoot, "shared_memory", "0_BE_input", "original_input.png"),
    emotionalOutput: path.join(emotionalRoot, "shared_memory", "1_EC_out", "EC_result.json"),
  };
}

function resolvePythonCommands() {
  if (process.env.EMOTIONAL_MODEL_PYTHON) return [process.env.EMOTIONAL_MODEL_PYTHON];
  return process.platform === "win32" ? ["python", "py"] : ["python3", "python"];
}

async function executeEmotionalClassifier() {
  const paths = resolveModelsPaths();
  if (!fs.existsSync(paths.emotionalScript)) throw new Error("EMOTIONAL_MODEL_SCRIPT_NOT_FOUND");

  const commands = resolvePythonCommands();
  const timeoutMs = Number(process.env.EMOTIONAL_MODEL_TIMEOUT_MS || "180000");

  let lastError: unknown = null;
  for (const cmd of commands) {
    try {
      await execFileAsync(cmd, [paths.emotionalScript], {
        cwd: paths.emotionalRoot,
        timeout: timeoutMs,
        windowsHide: true,
        maxBuffer: 8 * 1024 * 1024,
      });
      return;
    } catch (e) {
      lastError = e;
    }
  }

  console.error("[emotional-model] execution failed", lastError);
  throw new Error("EMOTIONAL_MODEL_EXEC_FAILED");
}

function mapEmotionLabel(label: string) {
  const value = String(label || "").toLowerCase();

  if (value === "anger") {
    return {
      mood: "Colere / tension",
      tags: ["tension", "impulsivite", "vigilance"],
      colors: ["#de5a6c", "#b63a4a", "#1c325d"],
    };
  }
  if (value === "calm") {
    return {
      mood: "Calme",
      tags: ["apaisement", "stabilite", "regulation"],
      colors: ["#00abec", "#84ccf1", "#1c325d"],
    };
  }
  if (value === "fear") {
    return {
      mood: "Peur / insecurite",
      tags: ["anxiete", "reassurance", "protection"],
      colors: ["#4b5d78", "#1c325d", "#de5a6c"],
    };
  }
  if (value === "happiness") {
    return {
      mood: "Joie",
      tags: ["energie", "ouverture", "interaction"],
      colors: ["#f6c85f", "#84ccf1", "#00abec"],
    };
  }
  if (value === "sadness") {
    return {
      mood: "Tristesse",
      tags: ["retrait", "soutien", "ecoute"],
      colors: ["#6d83a5", "#1c325d", "#84ccf1"],
    };
  }
  if (value === "surprise") {
    return {
      mood: "Surprise",
      tags: ["reaction", "curiosite", "ajustement"],
      colors: ["#f6c85f", "#00abec", "#de5a6c"],
    };
  }

  return {
    mood: "Observation generale",
    tags: ["observation", "prudence"],
    colors: ["#00abec", "#84ccf1", "#1c325d"],
  };
}

export async function runAssistantChat(params: {
  message: string;
  history: AssistantHistoryMessage[];
}) {
  const message = String(params.message || "").trim();
  if (!message) throw new Error("ASSISTANT_MESSAGE_REQUIRED");

  const history = Array.isArray(params.history) ? params.history.slice(-10) : [];
  const ragUrl = process.env.MODELE_RAG_CHAT_URL || "http://127.0.0.1:5000/chat";

  const payload = {
    message,
    conversationHistory: history.map((h) => ({
      role: h.role,
      content: h.text,
    })),
  };

  const ragRes = await fetch(ragUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!ragRes.ok) {
    console.error("[modele-rag] http error", ragRes.status, ragUrl);
    throw new Error("MODELE_RAG_UNREACHABLE");
  }

  const ragBody = (await ragRes.json()) as RagChatResponse;
  const answer = String(ragBody.response || "").trim();
  if (!answer) throw new Error("MODELE_RAG_EMPTY_RESPONSE");

  const sources = Array.isArray(ragBody.sources)
    ? ragBody.sources.map((s) => JSON.stringify(s.metadata || {})).filter(Boolean)
    : [];
  const snippets = Array.isArray(ragBody.sources)
    ? ragBody.sources
        .map((s) => String(s.preview || "").trim())
        .filter(Boolean)
        .map((v) => truncate(v.replace(/\s+/g, " "), 220))
    : [];

  const result: AssistantChatResult = {
    answer,
    sentiment: analyzeSentimentHeuristic(message),
    rag: {
      sources,
      snippets,
    },
  };

  return result;
}

export async function runDrawingAnalysis(params: {
  imageBase64: string;
  mimeType: string;
  note?: string;
}) {
  const maxMb = Number(process.env.ASSISTANT_MAX_IMAGE_MB || "8");
  const maxBytes = Math.max(1, maxMb) * 1024 * 1024;
  const imageBase64 = String(params.imageBase64 || "").trim();
  const imageBytes = Buffer.from(imageBase64, "base64").byteLength;

  if (!imageBytes) throw new Error("ASSISTANT_IMAGE_REQUIRED");
  if (imageBytes > maxBytes) throw new Error("ASSISTANT_IMAGE_TOO_LARGE");

  const paths = resolveModelsPaths();
  fs.mkdirSync(path.dirname(paths.emotionalInput), { recursive: true });
  fs.mkdirSync(path.dirname(paths.emotionalOutput), { recursive: true });

  fs.writeFileSync(paths.emotionalInput, Buffer.from(imageBase64, "base64"));
  await executeEmotionalClassifier();

  if (!fs.existsSync(paths.emotionalOutput)) throw new Error("EMOTIONAL_MODEL_OUTPUT_NOT_FOUND");

  const parsed = JSON.parse(fs.readFileSync(paths.emotionalOutput, "utf-8")) as EmotionalResult;
  const label = String(parsed.label || "Unknown");
  const confidence = Number(parsed.confidence || 0);
  const mapped = mapEmotionLabel(label);

  const indicators = [
    `Emotion detectee par le modele: ${label}`,
    `Niveau de confiance: ${(confidence * 100).toFixed(1)}%`,
    "Sortie issue du dossier models/model/emotional_classification.",
  ];

  const result: DrawingAnalysisResult = {
    mood: `${mapped.mood}`,
    indicators,
    colors: mapped.colors,
    tags: mapped.tags,
    summary: `Le modele emotionnel a detecte l etat '${label}' avec une confiance de ${(confidence * 100).toFixed(1)}%.`,
    caution:
      "Cette sortie est une aide d orientation. Pour une evaluation clinique, valider avec le psychologue du village.",
    source: "emotional-model-local",
  };

  return result;
}
