'use client';

import { useEffect, useRef, useState } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Badge } from '@/components/ui';
import { MessageCircle, Sparkles, Upload, Image as ImageIcon, Send, ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import {
  assistantAnalyzeDrawing,
  assistantChat,
  type AssistantDrawingAnalysis,
  type AssistantSentiment,
} from '@/lib/assistant';
import { fileToBase64 } from '@/lib/backend';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  time: string;
};

const quickPrompts = [
  'Mon enfant est anxieux le soir, que faire ?',
  'Comment parler des emotions avec un enfant de 6 ans ?',
  'Signes de stress apres un changement d ecole ?',
];

function nowTime() {
  return new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function mapAssistantError(code: string) {
  if (code === 'MODELE_RAG_UNREACHABLE') return 'Modele RAG indisponible. Lancez models/Modele_rag/app.py.';
  if (code === 'MODELE_RAG_EMPTY_RESPONSE') return 'Le modele RAG n a pas retourne de reponse.';
  if (code === 'EMOTIONAL_MODEL_SCRIPT_NOT_FOUND') return 'Script emotion non trouve dans models/model.';
  if (code === 'EMOTIONAL_MODEL_EXEC_FAILED') return 'Execution du modele emotion echouee. Verifiez l environnement Python du dossier models/model.';
  if (code === 'EMOTIONAL_MODEL_OUTPUT_NOT_FOUND') return 'Resultat emotion introuvable apres execution du modele.';
  if (code === 'ASSISTANT_IMAGE_TOO_LARGE') return 'Image trop lourde pour analyse.';
  if (code === 'SESSION_EXPIRED') return 'Session expiree. Reconnectez-vous.';
  return code || 'Erreur assistant.';
}

export default function AssistantPage() {
  const { user } = useAuth();
  const canUseAssistant = user?.role === 'normal';

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      role: 'assistant',
      text: 'Bonjour, je suis connecte au modele RAG. Posez votre question.',
      time: nowTime(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isAnalyzingDrawing, setIsAnalyzingDrawing] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AssistantDrawingAnalysis | null>(null);
  const [sentiment, setSentiment] = useState<AssistantSentiment | null>(null);
  const [ragSnippets, setRagSnippets] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  async function onSend() {
    const value = input.trim();
    if (!value || isTyping) return;

    const userMessage: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: value,
      time: nowTime(),
    };

    const nextHistory = [...messages, userMessage];
    setMessages(nextHistory);
    setInput('');
    setIsTyping(true);
    setError('');

    try {
      const result = await assistantChat({
        message: value,
        history: nextHistory.slice(-10).map((m) => ({ role: m.role, text: m.text })),
      });

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: result.answer,
          time: nowTime(),
        },
      ]);

      setSentiment(result.sentiment);
      setRagSnippets(result.rag.snippets || []);
    } catch (e) {
      const code = e instanceof Error ? e.message : 'ASSISTANT_CHAT_FAILED';
      setError(mapAssistantError(code));
      setMessages((prev) => [
        ...prev,
        {
          id: `a-err-${Date.now()}`,
          role: 'assistant',
          text: 'Je n ai pas pu joindre le chatbot RAG pour le moment.',
          time: nowTime(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }

  function handleImagePick() {
    fileInputRef.current?.click();
  }

  async function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(URL.createObjectURL(file));
    setError('');
    setIsAnalyzingDrawing(true);

    try {
      const base64 = await fileToBase64(file);
      const result = await assistantAnalyzeDrawing({
        imageBase64: base64,
        mimeType: file.type || 'image/png',
        note: input || undefined,
      });
      setAnalysis(result);
    } catch (e) {
      const code = e instanceof Error ? e.message : 'ASSISTANT_DRAWING_ANALYSIS_FAILED';
      setError(mapAssistantError(code));
      setAnalysis(null);
    } finally {
      setIsAnalyzingDrawing(false);
    }
  }

  return (
    <DashboardLayout>
      {!canUseAssistant && (
        <div className="rounded-2xl border border-[#cde8f8] bg-white p-6 text-[#1c325d]">
          <h1 className="text-xl font-semibold">Acces reserve</h1>
          <p className="mt-2 text-sm text-[#5f7290]">
            Cet espace est disponible pour les meres et tantes accompagnees par SOS Villages d Enfants.
          </p>
        </div>
      )}

      {canUseAssistant && (
        <div className="space-y-6 animate-fade-in">
          <div className="rounded-[28px] border border-[#cde8f8] bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-[#e4f3fb] px-3 py-1 text-xs font-semibold text-[#1c325d]">
                  <ShieldCheck className="h-4 w-4 text-[#00abec]" />
                  Assistant connecte aux modeles locaux
                </div>
                <h1 className="text-2xl font-semibold text-[#1c325d]">Assistant maman et tante</h1>
                <p className="text-sm text-[#5f7290]">
                  Chat: `models/Modele_rag` | Analyse emotion: `models/model/emotional_classification`.
                </p>
              </div>
              <div className="rounded-2xl bg-[#f4f9fc] px-4 py-3 text-sm text-[#1c325d]">
                <span className="font-semibold">Conseil:</span> combinez la reponse chat et l analyse emotionnelle du dessin.
              </div>
            </div>
          </div>

          {error && (
            <Card>
              <CardContent className="p-4 text-sm text-[#de5a6c]">{error}</CardContent>
            </Card>
          )}

          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <Card className="overflow-hidden">
              <CardHeader className="border-b border-[#e4edf5] bg-white">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg text-[#1c325d]">Chatbot RAG</CardTitle>
                  <div className="inline-flex items-center gap-2 text-xs text-[#5f7290]">
                    <MessageCircle className="h-4 w-4 text-[#00abec]" />
                    Modele: Modele_rag
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 p-5">
                <div className="flex flex-wrap gap-2">
                  {quickPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => setInput(prompt)}
                      className="rounded-full border border-[#cde8f8] bg-white px-3 py-1 text-xs text-[#1c325d] hover:bg-[#eaf6fd]"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>

                <div className="h-[380px] space-y-4 overflow-y-auto rounded-2xl border border-[#e4edf5] bg-[#f8fcff] p-4">
                  {messages.map((message) => (
                    <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                          message.role === 'user'
                            ? 'bg-[#00abec] text-white'
                            : 'border border-[#e4edf5] bg-white text-[#1c325d]'
                        }`}
                      >
                        <p>{message.text}</p>
                        <p className={`mt-2 text-[11px] ${message.role === 'user' ? 'text-white/80' : 'text-[#7a8aa4]'}`}>
                          {message.time}
                        </p>
                      </div>
                    </div>
                  ))}

                  {isTyping && (
                    <div className="flex items-center gap-2 text-xs text-[#5f7290]">
                      <Sparkles className="h-4 w-4 text-[#00abec]" />
                      Le modele RAG prepare une reponse...
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Input
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    placeholder="Ecrivez votre question..."
                    className="h-11 rounded-xl border-[#cde8f8] bg-white"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        void onSend();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={() => void onSend()}
                    disabled={isTyping}
                    className="h-11 rounded-xl bg-[#00abec] px-4 text-white hover:bg-[#0096d2]"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>

                {ragSnippets.length > 0 && (
                  <div className="rounded-xl border border-[#e4edf5] bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#5f7290]">Contexte RAG utilise</p>
                    <ul className="mt-2 space-y-2 text-xs text-[#5f7290]">
                      {ragSnippets.slice(0, 3).map((s, i) => (
                        <li key={`${s}-${i}`}>- {s}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader className="border-b border-[#e4edf5] bg-white">
                  <CardTitle className="text-lg text-[#1c325d]">Analyse emotionnelle du dessin</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-5">
                  <div className="rounded-2xl border-2 border-dashed border-[#cde8f8] bg-[#f8fcff] p-6 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
                      <ImageIcon className="h-6 w-6 text-[#00abec]" />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-[#1c325d]">Telechargez le dessin de votre enfant</p>
                    <p className="mt-1 text-xs text-[#7a8aa4]">Le backend execute models/model/emotional_classification</p>
                    <div className="mt-4 flex justify-center">
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-full border-[#cde8f8] text-[#1c325d]"
                        onClick={handleImagePick}
                      >
                        <Upload className="mr-2 h-4 w-4 text-[#00abec]" />
                        Choisir une image
                      </Button>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => void onFileChange(e)}
                    />
                  </div>

                  {imagePreview && (
                    <div className="overflow-hidden rounded-2xl border border-[#e4edf5] bg-white">
                      <Image src={imagePreview} alt="Apercu du dessin" width={520} height={320} className="h-auto w-full" />
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="border-b border-[#e4edf5] bg-white">
                  <CardTitle className="text-lg text-[#1c325d]">Resultat preliminaire</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-5">
                  <div className="rounded-2xl bg-[#eaf6fd] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[#5f7290]">Etat global</p>
                    <p className="mt-2 text-xl font-semibold text-[#1c325d]">
                      {isAnalyzingDrawing ? 'Analyse en cours...' : analysis?.mood || 'Aucune analyse image'}
                    </p>
                  </div>

                  {analysis && (
                    <>
                      <div>
                        <p className="text-sm font-semibold text-[#1c325d]">Indicateurs detectes</p>
                        <ul className="mt-2 space-y-2 text-sm text-[#5f7290]">
                          {analysis.indicators.map((item) => (
                            <li key={item} className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-[#00abec]" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#1c325d]">Couleurs dominantes</p>
                        <div className="mt-2 flex items-center gap-2">
                          {analysis.colors.map((color) => (
                            <span
                              key={color}
                              className="h-6 w-6 rounded-full border border-white shadow-sm"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {analysis.tags.map((tag) => (
                          <Badge key={tag} className="bg-[#00abec] text-white">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-[#5f7290]">{analysis.summary}</p>
                      <p className="text-xs text-[#7a8aa4]">{analysis.caution}</p>
                    </>
                  )}

                  {sentiment && (
                    <div className="rounded-xl border border-[#e4edf5] bg-white p-3 text-xs text-[#5f7290]">
                      <p>
                        Sentiment du dernier message: <strong>{sentiment.sentiment}</strong> ({sentiment.emotion})
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
