'use client';

import { use } from 'react';
import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Textarea } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { mockTickets, mockReports, mockActionPlans } from '@/data/mockData';
import { statusConfig, priorityConfig } from '@/types';
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  Building2, 
  AlertTriangle,
  FileText,
  CheckCircle,
  Clock,
  Send,
  Shield
} from 'lucide-react';
import Link from 'next/link';
import { GRAPHQL_URL, backendStatusLabel, backendUrgencyLabel, formatDateTimeFR, getAuthToken, gql } from '@/lib/backend';

interface TicketDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function TicketDetailPage({ params }: TicketDetailPageProps) {
  const { id } = use(params);
  const { user, permissions } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [backendCase, setBackendCase] = useState<any | null>(null);
  const [loadingBackendCase, setLoadingBackendCase] = useState(false);
  const [backendCaseError, setBackendCaseError] = useState('');

  useEffect(() => {
    async function loadCase() {
      if (user?.role !== 'normal' || !id) return;
      setLoadingBackendCase(true);
      setBackendCaseError('');
      try {
        const token = getAuthToken();
        if (!token) throw new Error('SESSION_EXPIRED');
        const data = await gql<{ caseById: any }>(
          `query CaseById($id: ID!) {
            caseById(id: $id) {
              id
              createdAt
              status
              incidentType
              urgency
              description
              village { id name }
              attachments { id filename mimeType sizeBytes downloadUrl createdAt }
            }
          }`,
          { id },
          token
        );
        setBackendCase(data.caseById || null);
      } catch (error) {
        setBackendCaseError(error instanceof Error ? error.message : 'LOAD_CASE_FAILED');
      } finally {
        setLoadingBackendCase(false);
      }
    }
    void loadCase();
  }, [id, user?.role]);

  if (user?.role === 'normal') {
    const origin = (() => {
      try {
        return new URL(GRAPHQL_URL).origin;
      } catch {
        return 'http://localhost:4000';
      }
    })();
    const token = getAuthToken() || '';

    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
          <div className="flex items-start gap-4">
            <Link href="/tickets">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">Détail Ticket</h1>
            </div>
          </div>

          {loadingBackendCase && (
            <Card><CardContent className="p-6">Chargement...</CardContent></Card>
          )}
          {backendCaseError && (
            <Card><CardContent className="p-6 text-[#de5a6c]">{backendCaseError}</CardContent></Card>
          )}
          {!loadingBackendCase && !backendCase && !backendCaseError && (
            <Card><CardContent className="p-6">Ticket introuvable.</CardContent></Card>
          )}

          {backendCase && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <span className="text-sm font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{backendCase.id}</span>
                  <Badge>{backendStatusLabel(backendCase.status)}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-700">
                  <strong>Type:</strong> {backendCase.incidentType} • <strong>Urgence:</strong> {backendUrgencyLabel(backendCase.urgency)}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Village:</strong> {backendCase.village?.name || '-'}
                </p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{backendCase.description || '-'}</p>
                <p className="text-xs text-gray-500">{formatDateTimeFR(backendCase.createdAt)}</p>

                {Array.isArray(backendCase.attachments) && backendCase.attachments.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <p className="text-sm font-medium text-gray-700">Pièces jointes</p>
                    {backendCase.attachments.map((a: any) => {
                      const openUrl = new URL(a.downloadUrl, origin);
                      if (token) openUrl.searchParams.set('token', token);
                      const downloadUrl = new URL(a.downloadUrl, origin);
                      if (token) downloadUrl.searchParams.set('token', token);
                      downloadUrl.searchParams.set('download', '1');
                      return (
                        <div key={a.id} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
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
              </CardContent>
            </Card>
          )}
        </div>
      </DashboardLayout>
    );
  }

  const ticket = mockTickets.find(t => t.id === id);
  const reports = mockReports.filter(r => r.ticketId === id);
  const actionPlans = mockActionPlans.filter(ap => ap.ticketId === id);

  if (!ticket) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="max-w-md w-full">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Ticket Non Trouvé</h2>
              <p className="text-gray-500">
                Le ticket que vous recherchez n'existe pas ou a été supprimé.
              </p>
              <Link href="/tickets">
                <Button className="mt-4">Retour aux tickets</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Check if user can view sensitive content
  const canViewSensitive = ticket.isSensitive ? 
    permissions?.sensitiveContentAccess !== 'none' &&
    (permissions?.sensitiveContentAccess === 'full' || 
     permissions?.sensitiveContentAccess === 'full_assigned' && ticket.assignedTo === user?.id ||
     permissions?.sensitiveContentAccess === 'limited' && ticket.createdBy === user?.id)
    : true;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-start gap-4">
          <Link href="/tickets">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm font-mono text-gray-400 bg-gray-100 px-2 py-1 rounded">
                {ticket.id}
              </span>
              <Badge className={statusConfig[ticket.status].color}>
                {statusConfig[ticket.status].label}
              </Badge>
              <Badge className={priorityConfig[ticket.priority].color}>
                {priorityConfig[ticket.priority].label}
              </Badge>
              {ticket.isSensitive && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  Sensible
                </Badge>
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              {canViewSensitive ? ticket.title : '[Contenu masqué]'}
            </h1>
          </div>
        </div>

        {/* Access Warning */}
        {ticket.isSensitive && !canViewSensitive && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-800">Accès Restreint</p>
                  <p className="text-sm text-red-600">
                    Vous n'avez pas les permissions nécessaires pour voir le contenu sensible de ce ticket.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {canViewSensitive ? ticket.description : 'Le contenu de ce ticket est masqué car il contient des informations sensibles auxquelles vous n\'avez pas accès.'}
                </p>
              </CardContent>
            </Card>

            {/* Reports Section - Only for psychologue */}
            {permissions?.canWriteReports && reports.length > 0 && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Rapports ({reports.length})
                  </CardTitle>
                  <Button size="sm">
                    <FileText className="h-4 w-4" />
                    Nouveau Rapport
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reports.map((report) => (
                      <div key={report.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{report.title}</h4>
                          <span className="text-xs text-gray-500">
                            {formatDateTimeFR(report.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{report.content}</p>
                        <p className="text-xs text-gray-400 mt-2">Par {report.createdByName}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Plans - For dir_village */}
            {(permissions?.canApproveActionPlan || actionPlans.length > 0) && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Plans d'Action ({actionPlans.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {actionPlans.length > 0 ? (
                    <div className="space-y-4">
                      {actionPlans.map((plan) => (
                        <div key={plan.id} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{plan.title}</h4>
                            <Badge className={
                              plan.status === 'approved' ? 'bg-green-100 text-green-800' :
                              plan.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }>
                              {plan.status === 'approved' ? 'Approuvé' :
                               plan.status === 'rejected' ? 'Rejeté' : 'En attente'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{plan.description}</p>
                          {permissions?.canApproveActionPlan && plan.status === 'pending' && (
                            <div className="flex gap-2 mt-4">
                              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                Approuver
                              </Button>
                              <Button size="sm" variant="destructive">
                                Rejeter
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">
                      Aucun plan d'action pour ce ticket
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Comments */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Commentaires</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-semibold">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </span>
                  </div>
                  <div className="flex-1">
                    <Textarea
                      placeholder="Ajouter un commentaire..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="min-h-[80px]"
                    />
                    <div className="flex justify-end mt-2">
                      <Button size="sm" disabled={!newComment.trim()}>
                        <Send className="h-4 w-4" />
                        Envoyer
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Détails</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Créé par</p>
                    <p className="font-medium">{ticket.createdByName}</p>
                  </div>
                </div>

                {ticket.assignedToName && (
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Assigné à</p>
                      <p className="font-medium">{ticket.assignedToName}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Village</p>
                    <p className="font-medium">{ticket.village}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Date de création</p>
                    <p className="font-medium">{formatDateTimeFR(ticket.createdAt)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Dernière mise à jour</p>
                    <p className="font-medium">{formatDateTimeFR(ticket.updatedAt)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {permissions?.canWriteReports && (
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="h-4 w-4" />
                    Rédiger un rapport
                  </Button>
                )}

                {permissions?.canCloseCase && ticket.status !== 'closed' && (
                  <Button variant="outline" className="w-full justify-start text-green-600 hover:text-green-700 hover:bg-green-50">
                    <CheckCircle className="h-4 w-4" />
                    Fermer le cas
                  </Button>
                )}

                <Button variant="outline" className="w-full justify-start">
                  <Clock className="h-4 w-4" />
                  Voir l'historique
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
