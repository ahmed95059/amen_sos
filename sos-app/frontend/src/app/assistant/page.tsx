'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Badge } from '@/components/ui';
import { MessageCircle, Sparkles, Upload, Image as ImageIcon, Send, ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';

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

export default function AssistantPage() {
  const { permissions } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      role: 'assistant',
      text: "Bonjour, je suis la pour vous aider. Posez vos questions sur la sante mentale de votre enfant.",
      time: '09:14',
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const onSend = () => {
    const value = input.trim();
    if (!value) return;
    const time = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const newMessage: ChatMessage = {
      id: u-${Date.now()},
      role: 'user',
      text: value,
      time,
    };
    setMessages(prev => [...prev, newMessage]);
    setInput('');
    setIsTyping(true);
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          id: a-${Date.now()},
          role: 'assistant',
          text: 'Merci pour votre message. Essayez de nommer les emotions de votre enfant et de proposer une routine calme le soir. Si cela persiste, parlez-en au psychologue du village.',
          time,
        },
      ]);
      setIsTyping(false);
    }, 700);
  };

  const handleImagePick = () => {
    fileInputRef.current?.click();
  };

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(URL.createObjectURL(file));
  };

  const analysis = useMemo(
    () => ({
      mood: 'Calme prudent',
      indicators: ['Couleurs froides dominantes', 'Formes arrondies', 'Espace organise'],
      colors: ['#00abec', '#84ccf1', '#1c325d', '#de5a6c'],
    }),
    []
  );

  return (
    <DashboardLayout>
      {!permissions?.canUseAssistant && (
        <div className="rounded-2xl border border-[#cde8f8] bg-white p-6 text-[#1c325d]">
          <h1 className="text-xl font-semibold">Acces reserve</h1>
          <p className="mt-2 text-sm text-[#5f7290]">
            Cet espace est disponible pour les meres et tantes accompagnees par SOS Villages d Enfants.
          </p>
        </div>
      )}
      {permissions?.canUseAssistant && (
      <div className="space-y-6 animate-fade-in">
        <div className="rounded-[28px] border border-[#cde8f8] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#e4f3fb] px-3 py-1 text-xs font-semibold text-[#1c325d]">
                <ShieldCheck className="h-4 w-4 text-[#00abec]" />
                Espace securise pour les familles
              </div>
              <h1 className="text-2xl font-semibold text-[#1c325d]">Assistant maman et tante</h1>
              <p className="text-sm text-[#5f7290]">
                Posez vos questions et analysez les dessins de votre enfant. Ce module est informatif et ne remplace pas un suivi professionnel.
              </p>
            </div>
            <div className="rounded-2xl bg-[#f4f9fc] px-4 py-3 text-sm text-[#1c325d]">
              <span className="font-semibold">Conseil du jour:</span> encourager l enfant a raconter son dessin avec ses propres mots.
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-[#e4edf5] bg-white">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-[#1c325d]">Chat bienveillant</CardTitle>
                <div className="inline-flex items-center gap-2 text-xs text-[#5f7290]">
                  <MessageCircle className="h-4 w-4 text-[#00abec]" />
                  Reponse sous 1 a 2 secondes (demo)
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
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                        message.role === 'user'
                          ? 'bg-[#00abec] text-white'
                          : 'bg-white text-[#1c325d] border border-[#e4edf5]'
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
                    L assistant prepare une reponse...
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Ecrivez votre question..."
                  className="h-11 rounded-xl border-[#cde8f8] bg-white"
                />
                <Button
                  type="button"
                  onClick={onSend}
                  className="h-11 rounded-xl bg-[#00abec] px-4 text-white hover:bg-[#0096d2]"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader className="border-b border-[#e4edf5] bg-white">
                <CardTitle className="text-lg text-[#1c325d]">Analyse de dessin</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-5">
                <div className="rounded-2xl border-2 border-dashed border-[#cde8f8] bg-[#f8fcff] p-6 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
                    <ImageIcon className="h-6 w-6 text-[#00abec]" />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-[#1c325d]">
                    Telechargez le dessin de votre enfant
                  </p>
                  <p className="mt-1 text-xs text-[#7a8aa4]">PNG ou JPG, analyse locale (demo)</p>
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
                    onChange={onFileChange}
                  />
                </div>

                {imagePreview && (
                  <div className="overflow-hidden rounded-2xl border border-[#e4edf5] bg-white">
                    <Image
                      src={imagePreview}
                      alt="Apercu du dessin"
                      width={520}
                      height={320}
                      className="h-auto w-full"
                    />
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
                  <p className="mt-2 text-xl font-semibold text-[#1c325d]">{analysis.mood}</p>
                </div>
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
                      <span key={color} className="h-6 w-6 rounded-full border border-white shadow-sm" style={{ backgroundColor: color }} />
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-[#00abec] text-white">Calme</Badge>
                  <Badge className="bg-[#84ccf1] text-[#1c325d]">Curiosite</Badge>
                  <Badge className="bg-[#de5a6c] text-white">Vigilance</Badge>
                </div>
                <Button className="w-full rounded-xl bg-[#00abec] text-white hover:bg-[#0096d2]">
                  Partager avec le psychologue
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      )}
    </DashboardLayout>
  );
}