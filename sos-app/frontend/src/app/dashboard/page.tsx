'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { AlertCircle, BarChart3, FileText, RefreshCw, Users, Activity, Building2, Clock } from 'lucide-react';
import { backendStatusLabel, getAuthToken, gql, formatDateTimeFR } from '@/lib/backend';

const Q_MY_CASES = `
query MyCases {
  myCases {
    id
    createdAt
    status
    incidentType
    urgency
    description
    village { id name }
  }
}`;

const Q_ADMIN_DASHBOARD = `
query AdminDashboard {
  adminStats {
    totalCases
    totalUsers
    byStatus { status count }
    byVillage { villageId villageName count }
  }
  adminLogs(limit: 120) {
    id
    createdAt
    action
    entity
    entityId
    actorName
    actorEmail
    metaJson
  }
}`;

type AdminStats = {
  totalCases: number;
  totalUsers: number;
  byStatus: Array<{ status: string; count: number }>;
  byVillage: Array<{ villageId: string; villageName: string; count: number }>;
};

type AdminLog = {
  id: string;
  createdAt: string;
  action: string;
  entity: string;
  entityId: string;
  actorName?: string | null;
  actorEmail?: string | null;
  metaJson?: string | null;
};

function actionLabel(action: string) {
  const map: Record<string, string> = {
    CREATE_CASE: 'Création signalement',
    PSY_UPDATE_STATUS: 'Changement statut (psy)',
    PSY_UPLOAD_DOCUMENT: 'Upload document psy',
    DIR_VILLAGE_VALIDATE_CASE: 'Validation directeur',
    SAUVEGARDE_VALIDATE_CASE: 'Validation responsable sauvegarde',
    ADMIN_CREATE_USER: 'Création utilisateur',
    ADMIN_DELETE_USER: 'Suppression utilisateur',
  };
  return map[action] || action;
}

function statusColor(status: string) {
  if (status === 'PENDING') return 'bg-orange-100 text-orange-700';
  if (status === 'IN_PROGRESS') return 'bg-amber-100 text-amber-700';
  if (status === 'SIGNED') return 'bg-cyan-100 text-cyan-700';
  if (status === 'FALSE_REPORT') return 'bg-rose-100 text-rose-700';
  if (status === 'CLOSED') return 'bg-emerald-100 text-emerald-700';
  return 'bg-gray-100 text-gray-700';
}

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [declCases, setDeclCases] = useState<any[]>([]);
  const [declLoading, setDeclLoading] = useState(false);
  const [declError, setDeclError] = useState('');

  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [adminLogs, setAdminLogs] = useState<AdminLog[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState('');

  useEffect(() => {
    if (user?.role === 'dir_village' || user?.role === 'responsable_save') {
      router.replace('/approvals');
    }
    if (user?.role === 'dir_national') {
      router.replace('/analytics');
    }
  }, [user?.role, router]);

  async function loadDeclarantCases() {
    if (user?.role !== 'normal') return;
    setDeclLoading(true);
    setDeclError('');
    try {
      const token = getAuthToken();
      if (!token) throw new Error('SESSION_EXPIRED');
      const data = await gql<{ myCases: any[] }>(Q_MY_CASES, {}, token);
      setDeclCases(data.myCases || []);
    } catch (error) {
      setDeclError(error instanceof Error ? error.message : 'LOAD_DASHBOARD_FAILED');
    } finally {
      setDeclLoading(false);
    }
  }

  async function loadAdminDashboard() {
    if (user?.role !== 'admin_it') return;
    setAdminLoading(true);
    setAdminError('');
    try {
      const token = getAuthToken();
      if (!token) throw new Error('SESSION_EXPIRED');
      const data = await gql<{ adminStats: AdminStats; adminLogs: AdminLog[] }>(Q_ADMIN_DASHBOARD, {}, token);
      setAdminStats(data.adminStats);
      setAdminLogs(data.adminLogs || []);
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : 'LOAD_ADMIN_DASHBOARD_FAILED');
    } finally {
      setAdminLoading(false);
    }
  }

  useEffect(() => {
    void loadDeclarantCases();
  }, [user?.role]);

  useEffect(() => {
    void loadAdminDashboard();
  }, [user?.role]);

  if (user?.role === 'dir_village' || user?.role === 'responsable_save') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[320px]">
          <Card className="max-w-md w-full">
            <CardContent className="p-6 text-center">
              <p className="text-gray-600">Redirection vers Approbations...</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (user?.role === 'admin_it') {
    const byStatus = adminStats?.byStatus || [];
    const byVillage = [...(adminStats?.byVillage || [])].sort((a, b) => b.count - a.count).slice(0, 8);
    const totalByStatus = byStatus.reduce((sum, s) => sum + s.count, 0) || 1;

    // Criticité proxy basée sur statut (l'API n'expose pas encore l'agrégat d'urgence)
    const severityProxy = [
      { label: 'Critique (en attente)', count: byStatus.find((s) => s.status === 'PENDING')?.count || 0, color: 'bg-red-500' },
      { label: 'Moyenne (en cours)', count: byStatus.find((s) => s.status === 'IN_PROGRESS')?.count || 0, color: 'bg-amber-500' },
      { label: 'Traités (signés/clôturés)', count: (byStatus.find((s) => s.status === 'SIGNED')?.count || 0) + (byStatus.find((s) => s.status === 'CLOSED')?.count || 0), color: 'bg-emerald-500' },
    ];
    const maxSeverity = Math.max(1, ...severityProxy.map((s) => s.count));
    const maxVillage = Math.max(1, ...byVillage.map((v) => v.count));

    return (
      <DashboardLayout>
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 className="h-7 w-7 text-[#00abec]" />
                Tableau de bord Admin IT
              </h1>
              <p className="text-gray-500 mt-1">Statistiques globales, visualisations et logs système</p>
            </div>
            <Button variant="outline" onClick={() => void loadAdminDashboard()} disabled={adminLoading}>
              <RefreshCw className="h-4 w-4" /> Rafraîchir
            </Button>
          </div>

          {adminError && (
            <Card><CardContent className="p-4 text-[#de5a6c]">{adminError}</CardContent></Card>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-[#dcebf6] bg-gradient-to-br from-white to-[#f3f9fd]"><CardContent className="p-4"><p className="text-sm text-gray-500">Signalements</p><p className="text-3xl font-bold text-gray-900">{adminStats?.totalCases ?? 0}</p></CardContent></Card>
            <Card className="border-[#dcebf6] bg-gradient-to-br from-white to-[#f3fbf6]"><CardContent className="p-4"><p className="text-sm text-gray-500">Utilisateurs</p><p className="text-3xl font-bold text-gray-900">{adminStats?.totalUsers ?? 0}</p></CardContent></Card>
            <Card className="border-[#dcebf6] bg-gradient-to-br from-white to-[#eef8ff]"><CardContent className="p-4"><p className="text-sm text-gray-500">Logs chargés</p><p className="text-3xl font-bold text-gray-900">{adminLogs.length}</p></CardContent></Card>
            <Card className="border-[#dcebf6] bg-gradient-to-br from-white to-[#fff8eb]"><CardContent className="p-4"><p className="text-sm text-gray-500">Dernier refresh</p><p className="text-sm font-semibold text-gray-900 mt-2">{formatDateTimeFR(new Date().toISOString())}</p></CardContent></Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="border-[#dcebf6] shadow-sm">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Activity className="h-4 w-4 text-[#00abec]" />Signalements par criticité (proxy)</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {severityProxy.map((s) => (
                  <div key={s.label}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-700">{s.label}</span>
                      <span className="font-semibold text-gray-900">{s.count}</span>
                    </div>
                    <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
                      <div className={`h-full ${s.color}`} style={{ width: `${(s.count / maxSeverity) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-[#dcebf6] shadow-sm">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Building2 className="h-4 w-4 text-[#00abec]" />Signalements par village</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {byVillage.length === 0 ? (
                  <p className="text-sm text-gray-500">Aucune donnée.</p>
                ) : (
                  byVillage.map((v) => (
                    <div key={v.villageId}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-700 truncate mr-2">{v.villageName}</span>
                        <span className="font-semibold text-gray-900">{v.count}</span>
                      </div>
                      <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full bg-[#00abec]" style={{ width: `${(v.count / maxVillage) * 100}%` }} />
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="border-[#dcebf6] shadow-sm">
            <CardHeader><CardTitle className="text-base">Répartition par statut</CardTitle></CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-3">
                {byStatus.map((s) => (
                  <div key={s.status} className="rounded-lg border border-[#e3edf6] p-3 bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={statusColor(s.status)}>{backendStatusLabel(s.status)}</Badge>
                      <span className="text-sm font-semibold text-gray-900">{s.count}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#1c325d]" style={{ width: `${(s.count / totalByStatus) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#dcebf6] shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4 text-[#00abec]" />Logs récents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#e7eff6] text-left text-gray-500">
                      <th className="py-2 pr-4">Date & heure</th>
                      <th className="py-2 pr-4">Action</th>
                      <th className="py-2 pr-4">Acteur</th>
                      <th className="py-2 pr-4">Entité</th>
                      <th className="py-2 pr-4">ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminLogs.map((log) => (
                      <tr key={log.id} className="border-b border-[#f0f5f9] hover:bg-[#f9fcff]">
                        <td className="py-2 pr-4 whitespace-nowrap">{formatDateTimeFR(log.createdAt)}</td>
                        <td className="py-2 pr-4">{actionLabel(log.action)}</td>
                        <td className="py-2 pr-4">{log.actorName || log.actorEmail || '-'}</td>
                        <td className="py-2 pr-4">{log.entity}</td>
                        <td className="py-2 pr-4 font-mono text-xs text-gray-500">{log.entityId}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!adminLoading && adminLogs.length === 0 && (
                  <p className="text-sm text-gray-500 py-4">Aucun log.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 flex flex-wrap gap-3">
              <Link href="/users"><Button className="bg-[#00abec] hover:bg-[#0095d0]"><Users className="h-4 w-4" />Gestion utilisateurs</Button></Link>
              <Link href="/analytics"><Button variant="outline"><FileText className="h-4 w-4" />Vue analytics</Button></Link>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (user?.role === 'normal') {
    const total = declCases.length;
    const pending = declCases.filter((c) => c.status === 'PENDING').length;
    const inProgress = declCases.filter((c) => c.status === 'IN_PROGRESS').length;
    const closed = declCases.filter((c) => c.status === 'CLOSED').length;
    const recent = declCases.slice(0, 5);

    return (
      <DashboardLayout>
        <div className="space-y-6 animate-fade-in">
          <div className="bg-[#00abec] rounded-2xl p-6 text-white">
            <h1 className="text-2xl font-bold">Bienvenue, {user?.firstName} {user?.lastName}</h1>
            <p className="text-white/90 mt-1">Déclarant {user?.village ? `• ${user.village}` : ''}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="card-hover"><CardContent className="p-4"><p className="text-sm text-gray-500">Total</p><p className="text-2xl font-bold text-gray-900">{total}</p></CardContent></Card>
            <Card className="card-hover"><CardContent className="p-4"><p className="text-sm text-gray-500">En attente</p><p className="text-2xl font-bold text-orange-600">{pending}</p></CardContent></Card>
            <Card className="card-hover"><CardContent className="p-4"><p className="text-sm text-gray-500">En cours</p><p className="text-2xl font-bold text-yellow-600">{inProgress}</p></CardContent></Card>
            <Card className="card-hover"><CardContent className="p-4"><p className="text-sm text-gray-500">Clôturés</p><p className="text-2xl font-bold text-green-600">{closed}</p></CardContent></Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Mes tickets récents</CardTitle>
              <Link href="/tickets/create"><Button className="bg-[#00abec] hover:bg-[#0095d0]">Nouveau ticket</Button></Link>
            </CardHeader>
            <CardContent>
              {declLoading ? (
                <p className="text-sm text-gray-500">Chargement...</p>
              ) : declError ? (
                <p className="text-sm text-[#de5a6c]">{declError}</p>
              ) : recent.length === 0 ? (
                <p className="text-sm text-gray-500">Aucun ticket pour le moment.</p>
              ) : (
                <div className="space-y-3">
                  {recent.map((c) => (
                    <Link key={c.id} href={`/tickets/${c.id}`} className="block p-4 rounded-xl border border-gray-100 hover:border-[#00abec]/30 hover:bg-[#e4f3fb] transition-all">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1"><span className="text-xs font-mono text-gray-400">{c.id}</span></div>
                          <h3 className="font-medium text-gray-900 truncate">{c.incidentType}</h3>
                          <p className="text-sm text-gray-500 mt-1">{formatDateTimeFR(c.createdAt)} • {c.village?.name || '-'}</p>
                        </div>
                        <Badge>{backendStatusLabel(c.status)}</Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (user?.role === 'psychologue') {
    return (
      <DashboardLayout>
        <Card>
          <CardHeader><CardTitle>Interface Psychologue</CardTitle></CardHeader>
          <CardContent>
            <p className="text-gray-600">Utilisez <strong>Cas du Village</strong> pour le traitement et <strong>Rapports</strong> pour les documents.</p>
            <div className="mt-4 flex gap-3">
              <Link href="/cases"><Button className="bg-[#00abec] hover:bg-[#0095d0]">Cas du Village</Button></Link>
              <Link href="/reports"><Button variant="outline">Rapports</Button></Link>
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-center min-h-[320px]">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-10 w-10 text-yellow-500 mx-auto mb-3" />
            <p className="text-gray-700">Interface en préparation pour ce rôle.</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
