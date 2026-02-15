'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Select } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { AlertCircle, FileText, Upload, RefreshCw } from 'lucide-react';
import { backendStatusLabel, formatDateTimeFR, getAuthToken, gql, fileToBase64, GRAPHQL_URL } from '@/lib/backend';

const Q_PSY_CASES = `
query PsyAssignedCases {
  psyAssignedCases {
    id
    createdAt
    status
    incidentType
    urgency
    description
    village { id name }
    documents { id docType filename mimeType sizeBytes downloadUrl createdAt }
  }
}`;

const M_UPLOAD_DOC = `
mutation PsyUploadDocument($caseId: ID!, $docType: DocumentType!, $file: FileInput!) {
  psyUploadDocument(caseId: $caseId, docType: $docType, file: $file) {
    id
    docType
    filename
    createdAt
  }
}`;

export default function ReportsPage() {
  const { user } = useAuth();
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [docTypeByCase, setDocTypeByCase] = useState<Record<string, string>>({});
  const [fileByCase, setFileByCase] = useState<Record<string, File | null>>({});

  const apiOrigin = (() => {
    try {
      return new URL(GRAPHQL_URL).origin;
    } catch {
      return 'http://localhost:4000';
    }
  })();

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
      setError(e instanceof Error ? e.message : 'LOAD_REPORTS_FAILED');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCases();
  }, [user?.role]);

  async function uploadDoc(caseId: string) {
    const file = fileByCase[caseId];
    const docType = docTypeByCase[caseId] || 'FICHE_INITIALE';
    if (!file) {
      setError('Sélectionnez un fichier avant upload.');
      return;
    }

    setBusy(caseId);
    setError('');
    try {
      const token = getAuthToken();
      if (!token) throw new Error('SESSION_EXPIRED');
      await gql(
        M_UPLOAD_DOC,
        {
          caseId,
          docType,
          file: {
            filename: file.name,
            mimeType: file.type || 'application/octet-stream',
            base64: await fileToBase64(file),
          },
        },
        token
      );
      setFileByCase((prev) => ({ ...prev, [caseId]: null }));
      await loadCases();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'UPLOAD_REPORT_FAILED');
    } finally {
      setBusy('');
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
              <p className="text-gray-500">Cette page est dédiée aux rapports psychologue.</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="h-7 w-7 text-[#00abec]" />
              Rapports (Fiche / DPE)
            </h1>
            <p className="text-gray-500 mt-1">Upload des documents pour les cas assignés</p>
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

        <Card>
          <CardHeader>
            <CardTitle>{loading ? 'Chargement...' : `${cases.length} cas assignés`}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {cases.map((c) => (
                <div key={c.id} className="p-4 rounded-xl border border-gray-100 hover:border-[#00abec]/30 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{c.id}</span>
                        <Badge>{backendStatusLabel(c.status)}</Badge>
                      </div>
                      <h3 className="font-semibold text-gray-900">{c.incidentType}</h3>
                      <p className="text-sm text-gray-500">{c.village?.name || '-'} • {formatDateTimeFR(c.createdAt)}</p>
                    </div>

                    <div className="flex items-end gap-2 flex-wrap">
                      <div className="w-48">
                        <Select
                          options={[
                            { value: 'FICHE_INITIALE', label: 'Fiche initiale' },
                            { value: 'RAPPORT_DPE', label: 'Rapport DPE' },
                          ]}
                          value={docTypeByCase[c.id] || 'FICHE_INITIALE'}
                          onChange={(e) => setDocTypeByCase((prev) => ({ ...prev, [c.id]: e.target.value }))}
                        />
                      </div>
                      <input
                        type="file"
                        onChange={(e) => setFileByCase((prev) => ({ ...prev, [c.id]: e.target.files?.[0] || null }))}
                        className="block w-full sm:w-auto text-sm"
                      />
                      <Button
                        onClick={() => void uploadDoc(c.id)}
                        disabled={busy === c.id}
                        className="bg-[#00abec] hover:bg-[#0095d0]"
                      >
                        <Upload className="h-4 w-4" /> Upload
                      </Button>
                    </div>
                  </div>

                  <div className="mt-3 space-y-2">
                    <p className="text-sm font-medium text-gray-700">Documents déjà uploadés</p>
                    {Array.isArray(c.documents) && c.documents.length > 0 ? (
                      c.documents.map((d: any) => {
                        const token = getAuthToken() || '';
                        const openUrl = new URL(d.downloadUrl, apiOrigin);
                        if (token) openUrl.searchParams.set('token', token);
                        const dlUrl = new URL(d.downloadUrl, apiOrigin);
                        if (token) dlUrl.searchParams.set('token', token);
                        dlUrl.searchParams.set('download', '1');
                        return (
                          <div key={d.id} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
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
              ))}
              {!loading && cases.length === 0 && <p className="text-sm text-gray-500">Aucun cas assigné.</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
