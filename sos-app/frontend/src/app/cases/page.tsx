'use client';

import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Input, Select } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { Search, Building2, Calendar, AlertCircle, RefreshCw } from 'lucide-react';
import { backendStatusLabel, backendUrgencyLabel, getAuthToken, gql, GRAPHQL_URL } from '@/lib/backend';

const Q_PSY_CASES = `
query PsyAssignedCases {
  psyAssignedCases {
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
  }
}`;

const M_UPDATE_STATUS = `
mutation PsyUpdateCaseStatus($caseId: ID!, $status: CaseStatus!) {
  psyUpdateCaseStatus(caseId: $caseId, status: $status) { id status }
}`;

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

export default function CasesPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string>('');

  const apiOrigin = useMemo(() => {
    try {
      return new URL(GRAPHQL_URL).origin;
    } catch {
      return 'http://localhost:4000';
    }
  }, []);

  async function loadCases() {
    if (user?.role !== 'psychologue') return;
    setLoading(true);
    setError('');
    try {
      const token = getAuthToken();
      if (!token) throw new Error('SESSION_EXPIRED');
      const data = await gql<{ psyAssignedCases: any[] }>(Q_PSY_CASES, {}, token);
      setCases(data.psyAssignedCases || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'LOAD_CASES_FAILED');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCases();
  }, [user?.role]);

  async function updateStatus(caseId: string, status: 'IN_PROGRESS' | 'FALSE_REPORT' | 'CLOSED') {
    setBusyId(caseId + status);
    setError('');
    try {
      const token = getAuthToken();
      if (!token) throw new Error('SESSION_EXPIRED');
      await gql(M_UPDATE_STATUS, { caseId, status }, token);
      await loadCases();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'UPDATE_STATUS_FAILED');
    } finally {
      setBusyId('');
    }
  }

  if (user?.role !== 'psychologue') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="max-w-md w-full">
            <CardContent className="p-6 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Accès réservé</h2>
              <p className="text-gray-500">Cette page est dédiée à l&apos;interface psychologue.</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  let filtered = cases;
  if (statusFilter !== 'all') filtered = filtered.filter((c) => c.status === statusFilter);
  if (searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
    filtered = filtered.filter((c) =>
      c.id.toLowerCase().includes(q) ||
      (c.description || '').toLowerCase().includes(q) ||
      (c.incidentType || '').toLowerCase().includes(q) ||
      (c.village?.name || '').toLowerCase().includes(q)
    );
  }

  const stats = {
    total: cases.length,
    pending: cases.filter((c) => c.status === 'PENDING').length,
    inProgress: cases.filter((c) => c.status === 'IN_PROGRESS').length,
    signed: cases.filter((c) => c.status === 'SIGNED').length,
  };

  const statusOptions = [
    { value: 'all', label: 'Tous' },
    { value: 'PENDING', label: 'En attente' },
    { value: 'IN_PROGRESS', label: 'En cours' },
    { value: 'SIGNED', label: 'Signé' },
    { value: 'FALSE_REPORT', label: 'Faux signalement' },
    { value: 'CLOSED', label: 'Clôturé' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Building2 className="h-7 w-7 text-[#00abec]" />
              Cas du Village
            </h1>
            <p className="text-gray-500 mt-1">Cas assignés au psychologue ({user?.village || '-'})</p>
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
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par id, description, type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select
                options={statusOptions}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-56"
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="card-hover border-[#dcebf6] bg-gradient-to-br from-white to-[#f3f9fd]"><CardContent className="p-4 text-center"><p className="text-3xl font-bold text-gray-900">{stats.total}</p><p className="text-sm text-gray-500">Total</p></CardContent></Card>
          <Card className="card-hover border-[#dcebf6] bg-gradient-to-br from-white to-[#eef8ff]"><CardContent className="p-4 text-center"><p className="text-3xl font-bold text-[#00abec]">{stats.pending}</p><p className="text-sm text-gray-500">En attente</p></CardContent></Card>
          <Card className="card-hover border-[#dcebf6] bg-gradient-to-br from-white to-[#fff8eb]"><CardContent className="p-4 text-center"><p className="text-3xl font-bold text-yellow-600">{stats.inProgress}</p><p className="text-sm text-gray-500">En cours</p></CardContent></Card>
          <Card className="card-hover border-[#dcebf6] bg-gradient-to-br from-white to-[#f3fbf6]"><CardContent className="p-4 text-center"><p className="text-3xl font-bold text-green-600">{stats.signed}</p><p className="text-sm text-gray-500">Signés</p></CardContent></Card>
        </div>

        <Card className="border-[#dcebf6] shadow-sm">
          <CardHeader className="border-b border-[#ebf2f8]">
            <CardTitle className="text-base">{loading ? 'Chargement...' : `${filtered.length} cas`}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filtered.map((c) => (
                <div key={c.id} className="p-4 rounded-xl border border-[#dfebf5] bg-white hover:border-[#00abec]/30 hover:shadow-md transition-all">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{c.id}</span>
                        <Badge className="shadow-none">{backendStatusLabel(c.status)}</Badge>
                        <Badge variant="secondary" className="shadow-none">{backendUrgencyLabel(c.urgency)}</Badge>
                      </div>

                      <h3 className="font-semibold text-gray-900 mb-2">{c.incidentType}</h3>
                      <p className="text-sm text-gray-600 mb-2 whitespace-pre-wrap">{c.description || '-'}</p>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1"><Calendar className="h-4 w-4" />Créé le: {formatDateTimeFR(c.createdAt)}</div>
                        <div>{c.village?.name || '-'}</div>
                      </div>

                      {Array.isArray(c.attachments) && c.attachments.length > 0 && (
                        <div className="mt-3 space-y-2 rounded-lg border border-[#edf3f8] p-3 bg-[#fbfdff]">
                          <p className="text-sm font-medium text-gray-700">Pièces jointes</p>
                          {c.attachments.map((a: any) => {
                            const token = getAuthToken() || '';
                            const openUrl = new URL(a.downloadUrl, apiOrigin);
                            if (token) openUrl.searchParams.set('token', token);
                            const downloadUrl = new URL(a.downloadUrl, apiOrigin);
                            if (token) downloadUrl.searchParams.set('token', token);
                            downloadUrl.searchParams.set('download', '1');
                            return (
                              <div key={a.id} className="flex items-center justify-between rounded border border-[#e3edf6] px-3 py-2 text-sm bg-white">
                                <span className="truncate mr-2">{a.filename}</span>
                                <div className="flex items-center gap-3">
                                  <a className="text-[#00abec] hover:underline" href={openUrl.toString()} target="_blank" rel="noreferrer">Ouvrir</a>
                                  <a className="text-[#1c325d] hover:underline" href={downloadUrl.toString()} target="_blank" rel="noreferrer">Télécharger</a>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="flex md:flex-col gap-2">
                      {c.status === 'SIGNED' ? (
                        <Button
                          size="sm"
                          className="bg-[#00abec] hover:bg-[#0095d0]"
                          onClick={() => void updateStatus(c.id, 'CLOSED')}
                          disabled={!!busyId}
                        >
                          Clôturer
                        </Button>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => void updateStatus(c.id, 'IN_PROGRESS')}
                            disabled={!!busyId || c.status === 'CLOSED' || c.status === 'FALSE_REPORT'}
                          >
                            Mettre en cours
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => void updateStatus(c.id, 'FALSE_REPORT')}
                            disabled={!!busyId || c.status === 'CLOSED' || c.status === 'FALSE_REPORT'}
                          >
                            Faux signalement
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {!loading && filtered.length === 0 && <p className="text-sm text-gray-500">Aucun cas trouvé.</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
