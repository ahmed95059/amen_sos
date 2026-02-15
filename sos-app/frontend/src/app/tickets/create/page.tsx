'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Textarea, Select } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, Save, AlertCircle, CheckCircle, Upload, Mic, Square, X, Play, Pause, Volume2 } from 'lucide-react';
import Link from 'next/link';
import { gql, getAuthToken, fileToBase64, formatDateTimeFR, incidentTypeFromProblem, urgencyFromPriority } from '@/lib/backend';

export default function CreateTicketPage() {
  const { user, permissions } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [villages, setVillages] = useState<Array<{ id: string; name: string }>>([]);
  const [villageId, setVillageId] = useState('');
  
  // Media upload states
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  
  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribingMediaIndex, setTranscribingMediaIndex] = useState<number | null>(null);
  const [transcriptError, setTranscriptError] = useState('');
  const [mediaTranscriptError, setMediaTranscriptError] = useState('');
  const [lastTranscript, setLastTranscript] = useState('');
  const [lastImportedTranscript, setLastImportedTranscript] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    isSensitive: false,
    severity: '', // P0, P1, P2, P3
    problemType: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadVillages() {
      try {
        const token = getAuthToken();
        if (!token) return;
        const data = await gql<{ villages: Array<{ id: string; name: string }> }>(
          `query Villages { villages { id name } }`,
          {},
          token
        );
        setVillages(data.villages || []);
      } catch {
        // ignore village loading failure here
      }
    }
    void loadVillages();
  }, []);

  const priorityOptions = [
    { value: 'low', label: 'Faible - Peut attendre' },
    { value: 'medium', label: 'Moyen - Traitement normal' },
    { value: 'high', label: 'Élevé - Requiert une attention rapide' },
    { value: 'urgent', label: 'Urgent - Action immédiate requise' },
  ];

  const problemTypeOptions = [
    { value: 'abuse', label: 'Abus / Maltraitance' },
    { value: 'cyberbullying', label: 'Cyberharcèlement' },
    { value: 'violence', label: 'Violence' },
    { value: 'schooling', label: 'Difficultés scolaires' },
    { value: 'psychological', label: 'Problèmes psychologiques' },
    { value: 'familial', label: 'Conflit familial' },
    { value: 'health', label: 'Problème de santé' },
    { value: 'exploitation', label: 'Exploitation / Trafic' },
    { value: 'runaway', label: 'Fugue' },
    { value: 'other', label: 'Autre' },
  ];

  const severityLevels = [
    {
      value: 'P0',
      label: 'P0 – CRITIQUE (Danger immédiat)',
      color: 'bg-[#de5a6c]',
      borderColor: 'border-[#de5a6c]',
      textColor: 'text-[#de5a6c]',
      bgLight: 'bg-[#f9e5e4]',
      definition: 'Risque grave et immédiat pour la sécurité ou la vie de l\'enfant',
      examples: [
        'Abus sexuel en cours ou récent',
        'Violence physique grave (blessure visible)',
        'Menace directe de mort',
        'Tentative de suicide / auto-mutilation',
        'Fugue en cours',
        'Suspicion de trafic / exploitation'
      ],
      sla: 'SLA ouverture < 15 minutes',
      action: 'Notification immédiate + Escalade automatique'
    },
    {
      value: 'P1',
      label: 'P1 – HAUTE PRIORITÉ',
      color: 'bg-orange-500',
      borderColor: 'border-orange-500',
      textColor: 'text-orange-600',
      bgLight: 'bg-orange-50',
      definition: 'Situation grave mais sans danger vital immédiat',
      examples: [
        'Cyberbullying sévère et répétitif',
        'Grooming suspect',
        'Violence physique légère',
        'Harcèlement psychologique répété',
        'Suspicion d\'abus non confirmé',
        'Détresse émotionnelle intense'
      ],
      sla: 'SLA ouverture < 1h',
      action: 'Fiche initiale < 24h'
    },
    {
      value: 'P2',
      label: 'P2 – PRIORITÉ MOYENNE',
      color: 'bg-blue-500',
      borderColor: 'border-blue-500',
      textColor: 'text-blue-600',
      bgLight: 'bg-blue-50',
      definition: 'Problème nécessitant suivi, sans urgence immédiate',
      examples: [
        'Dispute entre frères',
        'Conflit éducatif',
        'Difficulté scolaire',
        'Isolement social',
        'Comportement agressif modéré'
      ],
      sla: 'Suivi planifié',
      action: 'Fiche initiale < 24h'
    },
    {
      value: 'P3',
      label: 'P3 – PRIORITÉ BASSE',
      color: 'bg-gray-400',
      borderColor: 'border-gray-400',
      textColor: 'text-gray-600',
      bgLight: 'bg-gray-50',
      definition: 'Situation informative / préventive',
      examples: [
        'Incident ponctuel mineur',
        'Signalement préventif',
        'Observation comportementale simple'
      ],
      sla: 'Traitement normal',
      action: 'Pas d\'escalade'
    }
  ];

  const severityOptions = severityLevels.map(level => ({
    value: level.value,
    label: level.label
  }));

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Le titre est requis';
    } else if (formData.title.length < 10) {
      newErrors.title = 'Le titre doit contenir au moins 10 caractères';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La description est requise';
    } else if (formData.description.length < 30) {
      newErrors.description = 'La description doit contenir au moins 30 caractères';
    }

    if (!formData.severity) {
      newErrors.severity = 'Veuillez sélectionner un niveau de gravité';
    }

    if (!formData.problemType) {
      newErrors.problemType = 'Veuillez sélectionner un type de problème';
    }
    if (!villageId) {
      newErrors.villageId = 'Veuillez sélectionner un village';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Media Upload Handler
  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files) {
      const newFiles = Array.from(files).filter(file => {
        return file.size <= 150 * 1024 * 1024; // Max 150MB
      });
      setMediaFiles([...mediaFiles, ...newFiles]);
    }
  };

  const removeMediaFile = (index: number) => {
    setMediaFiles(mediaFiles.filter((_, i) => i !== index));
  };

  // Voice Recording Handlers
  const startRecording = async () => {
    try {
      setTranscriptError('');
      setLastTranscript('');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Erreur d\'accès au microphone:', error);
      alert('Impossible d\'accéder au microphone. Vérifiez les permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const playAudio = () => {
    if (audioBlob && audioRef.current) {
      const url = URL.createObjectURL(audioBlob);
      audioRef.current.src = url;
      audioRef.current.play();
      setIsPlayingAudio(true);
      audioRef.current.onended = () => setIsPlayingAudio(false);
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    }
  };

  const deleteRecording = () => {
    setAudioBlob(null);
    setIsPlayingAudio(false);
    setTranscriptError('');
    setLastTranscript('');
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
  };

  const mapSpeechToTextError = (code: string) => {
    if (code === 'SPEECH2TEXT_SERVICE_UNREACHABLE') {
      return 'Service Speech-to-Text indisponible. Lancez models/speech2text.';
    }
    if (code === 'SPEECH2TEXT_EMPTY_TRANSCRIPT') {
      return 'Aucune parole detectee dans cet audio.';
    }
    if (code === 'SESSION_EXPIRED') {
      return 'Session expiree. Reconnectez-vous.';
    }
    return code || 'SPEECH2TEXT_FAILED';
  };

  const requestSpeechToText = async (audioFile: File) => {
    const token = getAuthToken();
    if (!token) throw new Error('SESSION_EXPIRED');

    const base64 = await fileToBase64(audioFile);
    const graphUrl = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql';
    const apiBase = process.env.NEXT_PUBLIC_API_URL || graphUrl.replace(/\/graphql\/?$/, '');

    const response = await fetch(`${apiBase}/speech2text/transcribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        filename: audioFile.name,
        mimeType: audioFile.type || 'audio/webm',
        base64,
        language: 'ar-tn',
      }),
    });

    const payload = (await response.json().catch(() => ({}))) as { text?: string; error?: string; detail?: string };
    if (!response.ok) {
      throw new Error(payload.error || payload.detail || 'SPEECH2TEXT_FAILED');
    }

    const text = String(payload.text || '').trim();
    if (!text) throw new Error('SPEECH2TEXT_EMPTY_TRANSCRIPT');
    return text;
  };

  const isAudioFile = (file: File) => {
    const name = file.name.toLowerCase();
    if ((file.type || '').startsWith('audio/')) return true;
    return ['.mp3', '.wav', '.m4a', '.ogg', '.webm', '.aac', '.flac', '.opus'].some((ext) => name.endsWith(ext));
  };

  const transcribeRecording = async () => {
    if (!audioBlob) return;
    setIsTranscribing(true);
    setTranscriptError('');

    try {
      const audioFile = new File([audioBlob], `recording-${Date.now()}.webm`, {
        type: audioBlob.type || 'audio/webm',
      });
      const text = await requestSpeechToText(audioFile);

      setLastTranscript(text);
      setFormData((prev) => ({
        ...prev,
        description: prev.description
          ? `${prev.description}\n\n[Transcription enregistrement vocal]\n${text}`
          : `[Transcription enregistrement vocal]\n${text}`,
      }));
    } catch (error) {
      const code = error instanceof Error ? error.message : 'SPEECH2TEXT_FAILED';
      setTranscriptError(mapSpeechToTextError(code));
    } finally {
      setIsTranscribing(false);
    }
  };

  const transcribeImportedAudio = async (file: File, index: number) => {
    if (!isAudioFile(file)) return;
    setTranscribingMediaIndex(index);
    setMediaTranscriptError('');

    try {
      const text = await requestSpeechToText(file);
      setLastImportedTranscript(text);
      setFormData((prev) => ({
        ...prev,
        description: prev.description
          ? `${prev.description}\n\n[Transcription audio: ${file.name}]\n${text}`
          : `[Transcription audio: ${file.name}]\n${text}`,
      }));
    } catch (error) {
      const code = error instanceof Error ? error.message : 'SPEECH2TEXT_FAILED';
      setMediaTranscriptError(mapSpeechToTextError(code));
    } finally {
      setTranscribingMediaIndex(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitError('');
    try {
      const token = getAuthToken();
      if (!token) throw new Error('SESSION_EXPIRED');

      const allFiles = [...mediaFiles];
      if (audioBlob) {
        allFiles.push(
          new File([audioBlob], `recording-${Date.now()}.webm`, {
            type: audioBlob.type || 'audio/webm',
          })
        );
      }

      const attachments = await Promise.all(
        allFiles.map(async (f) => ({
          filename: f.name,
          mimeType: f.type || 'application/octet-stream',
          base64: await fileToBase64(f),
        }))
      );

      await gql(
        `mutation CreateCase($input: CreateCaseInput!) {
          createCase(input: $input) { id }
        }`,
        {
          input: {
            isAnonymous: !!formData.isSensitive,
            villageId,
            incidentType: incidentTypeFromProblem(formData.problemType),
            urgency: urgencyFromPriority(formData.priority as 'low' | 'medium' | 'high' | 'urgent'),
            description: `${formData.title}\n\n${formData.description}`.trim(),
            childName: null,
            abuserName: null,
            attachments,
          },
        },
        token
      );

      setShowSuccess(true);
      setTimeout(() => {
        router.push('/tickets');
      }, 1200);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'CREATE_CASE_FAILED');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!permissions?.canCreateTicket) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="max-w-md w-full">
            <CardContent className="p-6 text-center">
              <AlertCircle className="h-12 w-12 text-[#de5a6c] mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Accès Refusé</h2>
              <p className="text-gray-500">
                Vous n&apos;avez pas la permission de créer des tickets.
              </p>
              <Link href="/dashboard">
                <Button className="mt-4">Retour au tableau de bord</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (showSuccess) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="max-w-md w-full">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Ticket Créé!</h2>
              <p className="text-gray-500">
                Votre ticket a été créé avec succès. Vous allez être redirigé...
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/tickets">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Créer un Ticket</h1>
            <p className="text-gray-500 mt-1">Soumettez un nouveau ticket pour suivi</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Informations du Ticket</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Village */}
              <div className="space-y-2">
                <label htmlFor="village" className="text-sm font-medium text-gray-700">
                  Village <span className="text-[#de5a6c]">*</span>
                </label>
                <Select
                  id="village"
                  options={[
                    { value: '', label: 'Sélectionnez un village' },
                    ...villages.map((v) => ({ value: v.id, label: v.name })),
                  ]}
                  value={villageId}
                  onChange={(e) => setVillageId(e.target.value)}
                  className={errors.villageId ? 'border-red-500' : ''}
                />
                {errors.villageId && (
                  <p className="text-sm text-[#de5a6c] flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.villageId}
                  </p>
                )}
              </div>

              {/* Title */}
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium text-gray-700">
                  Titre <span className="text-[#de5a6c]">*</span>
                </label>
                <Input
                  id="title"
                  placeholder="Ex: Demande de suivi psychologique pour un enfant"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className={errors.title ? 'border-red-500' : ''}
                />
                {errors.title && (
                  <p className="text-sm text-[#de5a6c] flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.title}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium text-gray-700">
                  Description <span className="text-[#de5a6c]">*</span>
                </label>
                <Textarea
                  id="description"
                  placeholder="Décrivez en détail la situation, le contexte et vos observations..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={`min-h-[150px] ${errors.description ? 'border-red-500' : ''}`}
                />
                {errors.description && (
                  <p className="text-sm text-[#de5a6c] flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.description}
                  </p>
                )}
                <p className="text-xs text-gray-400">
                  {formData.description.length} / 30 caractères minimum
                </p>
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <label htmlFor="priority" className="text-sm font-medium text-gray-700">
                  Priorité
                </label>
                <Select
                  id="priority"
                  options={priorityOptions}
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                />
              </div>

              {/* Severity Classification */}
              <div className="space-y-4">
                <label htmlFor="severity" className="text-sm font-medium text-gray-700">
                  Classification de Gravité <span className="text-[#de5a6c]">*</span>
                </label>
                <Select
                  id="severity"
                  options={severityOptions}
                  value={formData.severity}
                  onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                />
                {errors.severity && (
                  <p className="text-sm text-[#de5a6c] flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.severity}
                  </p>
                )}

                {/* Severity Details */}
                {formData.severity && (
                  <div className={`p-4 rounded-lg ${severityLevels.find(l => l.value === formData.severity)?.bgLight}`}>
                    {severityLevels.find(l => l.value === formData.severity) && (
                      <div className="space-y-3">
                        <div>
                          <p className={`text-sm font-semibold ${severityLevels.find(l => l.value === formData.severity)?.textColor}`}>
                            {severityLevels.find(l => l.value === formData.severity)?.definition}
                          </p>
                        </div>
                        <div>
                          <p className={`text-xs font-semibold ${severityLevels.find(l => l.value === formData.severity)?.textColor} mb-2`}>
                            Exemples :
                          </p>
                          <ul className="text-xs text-gray-700 space-y-1 list-disc list-inside">
                            {severityLevels.find(l => l.value === formData.severity)?.examples.map((example, idx) => (
                              <li key={idx}>{example}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="pt-2 border-t border-current border-opacity-20">
                          <p className={`text-xs font-medium ${severityLevels.find(l => l.value === formData.severity)?.textColor}`}>
                            📋 {severityLevels.find(l => l.value === formData.severity)?.sla}
                          </p>
                          <p className={`text-xs ${severityLevels.find(l => l.value === formData.severity)?.textColor} mt-1`}>
                            ⚡ {severityLevels.find(l => l.value === formData.severity)?.action}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Problem Type */}
              <div className="space-y-2">
                <label htmlFor="problemType" className="text-sm font-medium text-gray-700">
                  Type de Problème <span className="text-[#de5a6c]">*</span>
                </label>
                <Select
                  id="problemType"
                  options={problemTypeOptions}
                  value={formData.problemType}
                  onChange={(e) => setFormData({ ...formData, problemType: e.target.value })}
                />
                {errors.problemType && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.problemType}
                  </p>
                )}
              </div>

              {/* Sensitive Content Toggle */}
              <div className="flex items-start gap-3 p-4 border border-[#00abec]/30 bg-[#e4f3fb] rounded-xl">
                <input
                  type="checkbox"
                  id="isSensitive"
                  checked={formData.isSensitive}
                  onChange={(e) => setFormData({ ...formData, isSensitive: e.target.checked })}
                  className="mt-1 rounded border-gray-300 text-[#00abec] focus:ring-[#00abec]"
                />
                <div>
                  <label htmlFor="isSensitive" className="text-sm font-medium text-[#1c325d] cursor-pointer">
                    Contenu Sensible
                  </label>
                  <p className="text-xs text-[#00abec] mt-1">
                    Cochez cette case si le ticket contient des informations sensibles qui nécessitent 
                    des restrictions d&apos;accès particulières.
                  </p>
                </div>
              </div>

              {/* Media Upload Section */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">
                  Ajouter des fichiers (Images/Vidéos)
                </label>
                <div className="border-2 border-dashed border-[#00abec]/30 rounded-xl p-6 text-center hover:bg-[#e4f3fb]/30 transition-colors">
                  <input
                    ref={mediaInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*,audio/*,.pdf,.txt,.doc,.docx"
                    onChange={handleMediaUpload}
                    className="hidden"
                  />
                  <Upload className="h-8 w-8 text-[#00abec] mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-700">
                    Cliquez pour uploader ou glissez-déposez
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Image, vidéo, audio, PDF, texte, documents (Max 150MB)
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => mediaInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    Sélectionner des fichiers
                  </Button>
                </div>

                {/* Uploaded Files List */}
                {mediaFiles.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">{mediaFiles.length} fichier(s) sélectionné(s)</p>
                    <div className="space-y-2">
                      {mediaFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center gap-2 flex-1">
                            <div className="w-8 h-8 bg-[#00abec]/10 rounded flex items-center justify-center">
                              <Upload className="h-4 w-4 text-[#00abec]" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                              <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {isAudioFile(file) && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => void transcribeImportedAudio(file, index)}
                                disabled={transcribingMediaIndex === index}
                                className="border-[#00abec] text-[#00abec] hover:bg-[#e4f3fb]"
                              >
                                <Mic className="h-4 w-4 mr-1" />
                                {transcribingMediaIndex === index ? 'Transcription...' : 'Transcrire'}
                              </Button>
                            )}
                            <button
                              type="button"
                              onClick={() => removeMediaFile(index)}
                              className="p-1 hover:bg-[#f9e5e4] rounded transition-colors"
                            >
                              <X className="h-4 w-4 text-[#de5a6c]" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    {mediaTranscriptError && (
                      <p className="text-xs text-[#de5a6c]">{mediaTranscriptError}</p>
                    )}
                    {lastImportedTranscript && (
                      <div className="rounded-lg border border-[#cde8f8] bg-white p-2">
                        <p className="text-xs text-gray-500 mb-1">Derniere transcription audio importee:</p>
                        <p className="text-sm text-gray-700 break-words">{lastImportedTranscript}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Voice Recording Section */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">
                  Enregistrement Vocal (Speech-to-Text)
                </label>
                <div className="border border-[#00abec]/30 rounded-xl p-4 bg-[#e4f3fb]/20">
                  {!audioBlob ? (
                    <div className="text-center space-y-3">
                      <p className="text-sm text-gray-600">
                        {isRecording ? '⏹️ Enregistrement en cours...' : 'Cliquez sur le microphone pour démarrer'}
                      </p>
                      <button
                        type="button"
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`p-4 rounded-full mx-auto transition-all ${
                          isRecording
                            ? 'bg-[#de5a6c] hover:bg-[#c94b5f] animate-pulse'
                            : 'bg-[#00abec] hover:bg-[#0095d0]'
                        }`}
                      >
                        {isRecording ? (
                          <Square className="h-6 w-6 text-white" />
                        ) : (
                          <Mic className="h-6 w-6 text-white" />
                        )}
                      </button>
                      <p className="text-xs text-gray-500">
                        {isRecording ? 'Appuyez pour arrêter l\'enregistrement' : 'Appuyez sur le microphone'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-gray-700 text-center">Enregistrement disponible</p>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={isPlayingAudio ? pauseAudio : playAudio}
                          className="p-3 bg-[#00abec] hover:bg-[#0095d0] rounded-full text-white transition-colors"
                        >
                          {isPlayingAudio ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </button>
                        <div className="flex-1 h-8 bg-gray-200 rounded-lg flex items-center px-2">
                          <Volume2 className="h-4 w-4 text-gray-500" />
                        </div>
                        <button
                          type="button"
                          onClick={deleteRecording}
                          className="p-2 hover:bg-[#f9e5e4] rounded transition-colors"
                        >
                          <X className="h-4 w-4 text-[#de5a6c]" />
                        </button>
                      </div>
                      <audio ref={audioRef} className="hidden" />
                      <div className="flex items-center justify-center">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => void transcribeRecording()}
                          disabled={isTranscribing}
                          className="border-[#00abec] text-[#00abec] hover:bg-[#e4f3fb]"
                        >
                          <Mic className="h-4 w-4 mr-1" />
                          {isTranscribing ? 'Transcription...' : 'Transcrire vers description'}
                        </Button>
                      </div>
                      {transcriptError && (
                        <p className="text-xs text-[#de5a6c] text-center">{transcriptError}</p>
                      )}
                      {lastTranscript && (
                        <div className="rounded-lg border border-[#cde8f8] bg-white p-2">
                          <p className="text-xs text-gray-500 mb-1">Derniere transcription:</p>
                          <p className="text-sm text-gray-700 break-words">{lastTranscript}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {submitError && (
                <div className="flex items-start gap-2 p-3 bg-[#f9e5e4] rounded-xl">
                  <AlertCircle className="h-4 w-4 text-[#de5a6c] mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-[#de5a6c]">Création échouée</p>
                    <p className="text-xs text-[#de5a6c]/90 mt-1">{submitError}</p>
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Informations Automatiques</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Créé par:</span>
                    <span className="ml-2 font-medium">{user?.firstName} {user?.lastName}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Village:</span>
                    <span className="ml-2 font-medium">{user?.village || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Date:</span>
                    <span className="ml-2 font-medium">
                      {formatDateTimeFR(new Date())}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Statut initial:</span>
                    <span className="ml-2 font-medium text-blue-600">Ouvert</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 mt-6">
            <Link href="/tickets">
              <Button type="button" variant="outline">
                Annuler
              </Button>
            </Link>
            <Button 
              type="submit" 
              className="bg-[#00abec] hover:bg-[#0095d0] rounded-xl"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Création en cours...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Créer le Ticket
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
