'use client';

import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Input, Select } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { AlertCircle, CheckSquare, Upload, RefreshCw, Calendar, Search } from 'lucide-react';
import { backendStatusLabel, getAuthToken, gql, fileToBase64, GRAPHQL_URL } from '@/lib/backend';

const Q_DIR_CASES = `
query DirVillageCases {
  dirVillageCases {
    id
    createdAt
    status
    score
    incidentType
    urgency
    description
    village { id name }
    attachments { id filename mimeType sizeBytes downloadUrl createdAt }
    documents { id docType filename mimeType sizeBytes downloadUrl createdAt }
    dirVillageValidatedAt
    sauvegardeValidatedAt
  }
}`;

const Q_SAUVEGARDE_CASES = `
query SauvegardeCases {
  sauvegardeCases {
    id
    createdAt
    status
    score
    incidentType
    urgency
    description
    village { id name }
    attachments { id filename mimeType sizeBytes downloadUrl createdAt }
    documents { id docType filename mimeType sizeBytes downloadUrl createdAt }
    dirVillageValidatedAt
    sauvegardeValidatedAt
  }
}`;

const M_DIR_VALIDATE = `
mutation DirVillageValidateCase($caseId: ID!, $signatureFile: FileInput!) {
  dirVillageValidateCase(caseId: $caseId, signatureFile: $signatureFile) {
    id
    dirVillageValidatedAt
    status
  }
}`;

const M_SAUVEGARDE_VALIDATE = `
mutation SauvegardeValidateCase($caseId: ID!, $signatureFile: FileInput!) {
  sauvegardeValidateCase(caseId: $caseId, signatureFile: $signatureFile) {
    id
    sauvegardeValidatedAt
    status
  }
}`;

type CaseItem = {
  id: string;
  createdAt: string;
  status: string;
  score: number;
  incidentType: string;
  description?: string;
  village?: { id: string; name: string };
  attachments?: Array<{ id: string; filename: string; downloadUrl: string }>;
  documents?: Array<{ id: string; filename: string; docType: string; downloadUrl: string }>;
  dirVillageValidatedAt?: string | null;
  sauvegardeValidatedAt?: string | null;
};

function formatDateTimeFR(value?: string | null) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ApprovalsPage() {
  const { user, permissions } = useAuth();
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [signatureByCase, setSignatureByCase] = useState<Record<string, File | null>>({});

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [villageFilter, setVillageFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');

  const apiOrigin = useMemo(() => {
    try {
      return new URL(GRAPHQL_URL).origin;
    } catch {
      return 'http://localhost:4000';
    }
  }, []);

  const isSauvegarde = user?.role === 'responsable_save';

  async function loadCases() {
    if (user?.role !== 'dir_village' && user?.role !== 'responsable_save') return;
    setLoading(true);
    setError('');
    try {
      const token = getAuthToken();
      if (!token) throw new Error('SESSION_EXPIRED');
      if (user?.role === 'responsable_save') {
        const data = await gql<{ sauvegardeCases: CaseItem[] }>(Q_SAUVEGARDE_CASES, {}, token);
        setCases(data.sauvegardeCases || []);
      } else {
        const data = await gql<{ dirVillageCases: CaseItem[] }>(Q_DIR_CASES, {}, token);
        setCases(data.dirVillageCases || []);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'LOAD_APPROVALS_FAILED');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCases();
  }, [user?.role]);

  async function validateCase(caseId: string) {
    const sig = signatureByCase[caseId];
    if (!sig) {
      setError('Veuillez sélectionner une signature avant validation.');
      return;
    }

    setBusyId(caseId);
    setError('');
    try {
      const token = getAuthToken();
      if (!token) throw new Error('SESSION_EXPIRED');
      const mutation = isSauvegarde ? M_SAUVEGARDE_VALIDATE : M_DIR_VALIDATE;
      await gql(
        mutation,
        {
          caseId,
          signatureFile: {
            filename: sig.name,
            mimeType: sig.type || 'application/octet-stream',
            base64: await fileToBase64(sig),
          },
        },
        token
      );
      setSignatureByCase((prev) => ({ ...prev, [caseId]: null }));
      await loadCases();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'VALIDATION_FAILED');
    } finally {
      setBusyId('');
    }
  }

  if ((user?.role !== 'dir_village' && user?.role !== 'responsable_save') || !permissions?.canApproveActionPlan) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="max-w-md w-full">
            <CardContent className="p-6 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Accès Refusé</h2>
              <p className="text-gray-500">Page réservée au Directeur de Village et Responsable Sauvegarde.</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const villages = Array.from(new Set(cases.map((c) => c.village?.name).filter(Boolean) as string[])).sort();

  const filteredAndSorted = [...cases]
    .filter((c) => (statusFilter === 'all' ? true : c.status === statusFilter))
    .filter((c) => (villageFilter === 'all' ? true : (c.village?.name || '') === villageFilter))
    .filter((c) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.trim().toLowerCase();
      return (
        c.id.toLowerCase().includes(q) ||
        (c.description || '').toLowerCase().includes(q) ||
        (c.incidentType || '').toLowerCase().includes(q) ||
        (c.village?.name || '').toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'date_asc') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === 'score_desc') return (b.score || 0) - (a.score || 0);
      if (sortBy === 'score_asc') return (a.score || 0) - (b.score || 0);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const validatedCount = cases.filter((c) => (isSauvegarde ? !!c.sauvegardeValidatedAt : !!c.dirVillageValidatedAt)).length;

  return (
    <DashboardLayout>
      <div className="space-y-5 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <CheckSquare className="h-7 w-7 text-[#00abec]" />
              {isSauvegarde ? 'Validation Responsable Sauvegarde' : 'Validation Directeur de Village'}
            </h1>
            <p className="text-gray-500 mt-1">
              {isSauvegarde
                ? 'Vous voyez tous les signalements validés par les directeurs (tous villages).'
                : `Vous voyez uniquement les signalements de votre village (${user?.village || '-'}) en cours de traitement.`}
            </p>
          </div>
          <Button variant="outline" onClick={() => void loadCases()} disabled={loading}>
            <RefreshCw className="h-4 w-4" /> Rafraîchir
          </Button>
        </div>

        {error && (
          <Card>
            <CardContent className="p-4 text-[#de5a6c]">{error}</CardContent>
          </Card>
        )}

        <Card className="border-[#dcebf6] shadow-sm">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  className="pl-10"
                  placeholder="Rechercher par id, type, description, village"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'Tous les statuts' },
                  { value: 'IN_PROGRESS', label: 'En cours' },
                  { value: 'SIGNED', label: 'Signé' },
                ]}
              />
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                options={[
                  { value: 'date_desc', label: 'Date: récent -> ancien' },
                  { value: 'date_asc', label: 'Date: ancien -> récent' },
                  { value: 'score_desc', label: 'Score: élevé -> faible' },
                  { value: 'score_asc', label: 'Score: faible -> élevé' },
                ]}
              />
            </div>
            {isSauvegarde && (
              <div className="mt-3">
                <Select
                  value={villageFilter}
                  onChange={(e) => setVillageFilter(e.target.value)}
                  options={[
                    { value: 'all', label: 'Tous les villages' },
                    ...villages.map((v) => ({ value: v, label: v })),
                  ]}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card className="border-[#dcebf6] bg-gradient-to-br from-white to-[#f3f9fd]"><CardContent className="p-4 text-center"><p className="text-3xl font-bold text-gray-900">{cases.length}</p><p className="text-sm text-gray-500">Total</p></CardContent></Card>
          <Card className="border-[#dcebf6] bg-gradient-to-br from-white to-[#f3fbf6]"><CardContent className="p-4 text-center"><p className="text-3xl font-bold text-green-600">{validatedCount}</p><p className="text-sm text-gray-500">Déjà validés</p></CardContent></Card>
        </div>

        <Card className="border-[#dcebf6] shadow-sm">
          <CardHeader className="border-b border-[#ebf2f8]">
            <CardTitle className="text-base">{loading ? 'Chargement...' : `${filteredAndSorted.length} ticket(s)`}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredAndSorted.map((c) => {
                const token = getAuthToken() || '';
                const isAlreadyValidated = isSauvegarde ? !!c.sauvegardeValidatedAt : !!c.dirVillageValidatedAt;
                return (
                  <div key={c.id} className="p-4 rounded-xl border border-[#dfebf5] bg-white shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">{c.id}</span>
                          <Badge className="shadow-none">{backendStatusLabel(c.status)}</Badge>
                          <Badge variant="secondary" className="shadow-none">Score {c.score}</Badge>
                        </div>
                        <p className="font-semibold text-gray-900">{c.incidentType}</p>
                        <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{c.description || '-'}</p>
                        <p className="text-sm text-gray-500 mt-2 flex items-center gap-1 flex-wrap">
                          <Calendar className="h-4 w-4" />
                          Créé le: {formatDateTimeFR(c.createdAt)} • Village: {c.village?.name || '-'}
                        </p>
                        {isSauvegarde && c.dirVillageValidatedAt && (
                          <p className="text-xs text-emerald-700 mt-1 bg-emerald-50 inline-flex px-2 py-0.5 rounded-md">
                            Directeur validé le {formatDateTimeFR(c.dirVillageValidatedAt)}
                          </p>
                        )}
                      </div>

                      <div className="w-full md:w-[320px] space-y-2">
                        <Input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => setSignatureByCase((prev) => ({ ...prev, [c.id]: e.target.files?.[0] || null }))}
                        />
                        <Button
                          className="w-full bg-[#00abec] hover:bg-[#0095d0]"
                          onClick={() => void validateCase(c.id)}
                          disabled={busyId === c.id || isAlreadyValidated}
                        >
                          <Upload className="h-4 w-4" />
                          {isAlreadyValidated ? 'Déjà validé' : 'Valider'}
                        </Button>
                        {isAlreadyValidated && (
                          <p className="text-xs text-green-600">
                            Validé le {formatDateTimeFR(isSauvegarde ? c.sauvegardeValidatedAt : c.dirVillageValidatedAt)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 grid md:grid-cols-2 gap-3">
                      <div className="rounded-lg border border-[#edf3f8] p-3 bg-[#fbfdff]">
                        <p className="text-sm font-medium text-gray-700 mb-1">Fichiers du signalement</p>
                        {Array.isArray(c.attachments) && c.attachments.length > 0 ? (
                          c.attachments.map((a) => {
                            const openUrl = new URL(a.downloadUrl, apiOrigin);
                            if (token) openUrl.searchParams.set('token', token);
                            const dlUrl = new URL(a.downloadUrl, apiOrigin);
                            if (token) dlUrl.searchParams.set('token', token);
                            dlUrl.searchParams.set('download', '1');
                            return (
                              <div key={a.id} className="flex items-center justify-between rounded border border-[#e3edf6] px-3 py-2 text-sm mb-2 bg-white">
                                <span className="truncate mr-2">{a.filename}</span>
                                <div className="flex items-center gap-3">
                                  <a className="text-[#00abec] hover:underline" href={openUrl.toString()} target="_blank" rel="noreferrer">Ouvrir</a>
                                  <a className="text-[#1c325d] hover:underline" href={dlUrl.toString()} target="_blank" rel="noreferrer">Télécharger</a>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-sm text-gray-500">Aucun fichier.</p>
                        )}
                      </div>

                      <div className="rounded-lg border border-[#edf3f8] p-3 bg-[#fbfdff]">
                        <p className="text-sm font-medium text-gray-700 mb-1">Fiche initiale / Rapport DPE</p>
                        {Array.isArray(c.documents) && c.documents.length > 0 ? (
                          c.documents.map((d) => {
                            const openUrl = new URL(d.downloadUrl, apiOrigin);
                            if (token) openUrl.searchParams.set('token', token);
                            const dlUrl = new URL(d.downloadUrl, apiOrigin);
                            if (token) dlUrl.searchParams.set('token', token);
                            dlUrl.searchParams.set('download', '1');
                            return (
                              <div key={d.id} className="flex items-center justify-between rounded border border-[#e3edf6] px-3 py-2 text-sm mb-2 bg-white">
                                <span className="truncate mr-2">[{d.docType}] {d.filename}</span>
                                <div className="flex items-center gap-3">
                                  <a className="text-[#00abec] hover:underline" href={openUrl.toString()} target="_blank" rel="noreferrer">Ouvrir</a>
                                  <a className="text-[#1c325d] hover:underline" href={dlUrl.toString()} target="_blank" rel="noreferrer">Télécharger</a>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-sm text-gray-500">Aucun document.</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {!loading && filteredAndSorted.length === 0 && (
                <p className="text-sm text-gray-500">Aucun ticket trouvé avec ce filtre.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
