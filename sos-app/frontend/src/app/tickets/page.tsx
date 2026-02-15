'use client';

import { useState, useMemo, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Input, Select } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { mockTickets } from '@/data/mockData';
import { statusConfig, priorityConfig, TicketStatus, TicketPriority } from '@/types';
import dynamic from 'next/dynamic';
import { 
  Search, 
  Filter, 
  Plus,
  Eye,
  Calendar,
  User,
  Building2,
  MapPin
} from 'lucide-react';
import Link from 'next/link';
import { backendStatusLabel, backendUrgencyLabel, formatDateTimeFR, getAuthToken, gql, GRAPHQL_URL } from '@/lib/backend';

const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => <div className="h-125 w-full bg-gray-200 animate-pulse rounded-lg" />
});

const MarkerManager = dynamic(() => import('@/components/MarkerManager'), { ssr: false });

export default function TicketsPage() {
  const { user, permissions } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [showMap, setShowMap] = useState(false);
  const [showIncidents, setShowIncidents] = useState(false);
  const [customMarkers, setCustomMarkers] = useState<any[]>([]);
  const [myCases, setMyCases] = useState<any[]>([]);
  const [loadingCases, setLoadingCases] = useState(false);
  const [casesError, setCasesError] = useState('');

  useEffect(() => {
    async function loadMyCases() {
      if (user?.role !== 'normal') return;
      setLoadingCases(true);
      setCasesError('');
      try {
        const token = getAuthToken();
        if (!token) throw new Error('SESSION_EXPIRED');
        const data = await gql<{ myCases: any[] }>(
          `query MyCases {
            myCases {
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
          {},
          token
        );
        setMyCases(data.myCases || []);
      } catch (error) {
        setCasesError(error instanceof Error ? error.message : 'LOAD_CASES_FAILED');
      } finally {
        setLoadingCases(false);
      }
    }
    void loadMyCases();
  }, [user?.role]);

  // Filter tickets based on user permissions and STRICT RBAC
  let tickets = mockTickets.filter(ticket => {
    // Normal: see own tickets only
    if (user?.role === 'normal') {
      return ticket.createdBy === user.id;
    }
    // Psychologue: see village tickets
    if (user?.role === 'psychologue') {
      return ticket.village === user.village || ticket.createdBy === user.id;
    }
    // Dir Village: see village tickets
    if (user?.role === 'dir_village') {
      return ticket.village === user.village || ticket.createdBy === user.id;
    }
    // Responsable Sauvegarde: see ALL villages (unique permission)
    if (user?.role === 'responsable_save') {
      return true;
    }
    // Admin IT: cannot see tickets
    if (user?.role === 'admin_it') {
      return false;
    }
    return false;
  });

  // Apply search filter
  if (searchQuery) {
    tickets = tickets.filter(ticket => 
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // Apply status filter
  if (statusFilter !== 'all') {
    tickets = tickets.filter(ticket => ticket.status === statusFilter);
  }

  // Apply priority filter
  if (priorityFilter !== 'all') {
    tickets = tickets.filter(ticket => ticket.priority === priorityFilter);
  }

  // Convert tickets with location to incident markers
  const incidentMarkers = useMemo(() => {
    return tickets
      .filter(ticket => ticket.latitude && ticket.longitude)
      .map((ticket) => ({
        id: ticket.id,
        position: [ticket.latitude!, ticket.longitude!] as [number, number],
        title: ticket.title,
        description: `${ticket.village} - ${ticket.priority.toUpperCase()}`,
        type: 'incident' as const,
      }));
  }, [tickets]);

  // Convert custom markers to map format
  const mappedCustomMarkers = customMarkers.map((marker: any) => ({
    id: marker.id,
    position: [marker.latitude, marker.longitude] as [number, number],
    title: marker.title,
    description: marker.description,
    type: 'custom' as const,
  }));

  const statusOptions = [
    { value: 'all', label: 'Tous les statuts' },
    { value: 'open', label: 'Ouvert' },
    { value: 'in_progress', label: 'En cours' },
    { value: 'pending_approval', label: 'En attente' },
    { value: 'approved', label: 'Approuvé' },
    { value: 'closed', label: 'Fermé' },
  ];

  const priorityOptions = [
    { value: 'all', label: 'Toutes les priorités' },
    { value: 'urgent', label: 'Urgent' },
    { value: 'high', label: 'Élevé' },
    { value: 'medium', label: 'Moyen' },
    { value: 'low', label: 'Faible' },
  ];

  if (user?.role === 'normal') {
    const origin = (() => {
      try {
        return new URL(GRAPHQL_URL).origin;
      } catch {
        return 'http://localhost:4000';
      }
    })();
    const token = getAuthToken() || '';
    const filteredCases = myCases.filter((c) => {
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      return (
        c.id.toLowerCase().includes(q) ||
        (c.description || '').toLowerCase().includes(q) ||
        (c.incidentType || '').toLowerCase().includes(q)
      );
    });

    return (
      <DashboardLayout>
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mes Tickets</h1>
              <p className="text-gray-500 mt-1">Tickets déclarant depuis le backend</p>
            </div>
            {permissions?.canCreateTicket && (
              <Link href="/tickets/create">
                <Button className="bg-[#00abec] hover:bg-[#0095d0] rounded-xl gap-2">
                  <Plus className="h-4 w-4" />
                  Nouveau Ticket
                </Button>
              </Link>
            )}
          </div>

          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par id, description, type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {casesError && (
            <Card>
              <CardContent className="p-4 text-[#de5a6c]">{casesError}</CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>{loadingCases ? 'Chargement...' : `${filteredCases.length} ticket(s)`}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredCases.map((c) => (
                  <div key={c.id} className="p-4 rounded-xl border border-gray-100 hover:border-[#00abec]/30 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{c.id}</span>
                      <Badge>{backendStatusLabel(c.status)}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-gray-700">{c.incidentType} • {backendUrgencyLabel(c.urgency)}</p>
                    <p className="text-sm text-gray-600 mt-1">{c.description || '-'}</p>
                    <div className="text-xs text-gray-500 mt-2">
                      Village: {c.village?.name || '-'} • {formatDateTimeFR(c.createdAt)}
                    </div>

                    {Array.isArray(c.attachments) && c.attachments.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {c.attachments.map((a: any) => {
                          const u = new URL(a.downloadUrl, origin);
                          if (token) u.searchParams.set('token', token);
                          const d = new URL(a.downloadUrl, origin);
                          if (token) d.searchParams.set('token', token);
                          d.searchParams.set('download', '1');
                          return (
                            <div key={a.id} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
                              <span className="truncate mr-2">{a.filename}</span>
                              <div className="flex items-center gap-3">
                                <a className="text-[#00abec] hover:underline" href={u.toString()} target="_blank" rel="noreferrer">Ouvrir</a>
                                <a className="text-[#1c325d] hover:underline" href={d.toString()} target="_blank" rel="noreferrer">Télécharger</a>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <div className="mt-3">
                      <Link href={`/tickets/${c.id}`}>
                        <Button variant="outline" size="sm">Détails</Button>
                      </Link>
                    </div>
                  </div>
                ))}
                {!loadingCases && filteredCases.length === 0 && (
                  <p className="text-sm text-gray-500">Aucun ticket trouvé.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (user?.role === 'psychologue') {
    return (
      <DashboardLayout>
        <div className="space-y-6 animate-fade-in">
          <Card>
            <CardHeader>
              <CardTitle>Interface Psychologue</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Pour le psychologue, utilisez <strong>Cas du Village</strong> pour traiter les signalements
                et <strong>Rapports</strong> pour uploader Fiche / DPE.
              </p>
              <div className="mt-4 flex gap-3">
                <Link href="/cases">
                  <Button className="bg-[#00abec] hover:bg-[#0095d0]">Aller à Cas du Village</Button>
                </Link>
                <Link href="/reports">
                  <Button variant="outline">Aller à Rapports</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mes Tickets</h1>
            <p className="text-gray-500 mt-1">Gérez et suivez vos tickets</p>
          </div>
          <div className="flex gap-2">
            {incidentMarkers.length > 0 && (
              <Button 
                onClick={() => setShowMap(!showMap)}
                variant={showMap ? "default" : "outline"}
                className="gap-2"
              >
                <MapPin className="h-4 w-4" />
                {showMap ? 'Masquer' : 'Afficher'} Carte
              </Button>
            )}
            {permissions?.canCreateTicket && (
              <Link href="/tickets/create">
                <Button className="bg-[#00abec] hover:bg-[#0095d0] rounded-xl gap-2">
                  <Plus className="h-4 w-4" />
                  Nouveau Ticket
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Map Section */}
        {showMap && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Carte des Tickets et Marqueurs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Map
                  markers={mappedCustomMarkers}
                  incidentMarkers={incidentMarkers}
                  showIncidentMarkers={showIncidents}
                  zoom={9}
                  center={[36.8065, 10.1815]}
                />
                <MarkerManager
                  customMarkers={customMarkers}
                  onMarkersChange={setCustomMarkers}
                  onIncidentsToggle={setShowIncidents}
                  showIncidents={showIncidents}
                  incidentCount={incidentMarkers.length}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par titre, ID ou description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-3">
                <Select
                  options={statusOptions}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-44"
                />
                <Select
                  options={priorityOptions}
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="w-44"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {(['all', 'open', 'in_progress', 'pending_approval', 'closed'] as const).map((status) => {
            const count = status === 'all' 
              ? mockTickets.filter(t => {
                  if (user?.role === 'normal') return t.createdBy === user.id;
                  if (user?.role === 'psychologue' || user?.role === 'dir_village') {
                    return t.village === user.village || t.createdBy === user.id;
                  }
                  return true;
                }).length
              : mockTickets.filter(t => {
                  if (user?.role === 'normal') return t.createdBy === user.id && t.status === status;
                  if (user?.role === 'psychologue' || user?.role === 'dir_village') {
                    return (t.village === user.village || t.createdBy === user.id) && t.status === status;
                  }
                  return t.status === status;
                }).length;

            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status === 'all' ? 'all' : status)}
                className={`p-4 rounded-xl border transition-all ${
                  statusFilter === status 
                    ? 'border-[#00abec] bg-[#e4f3fb]' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <p className="text-2xl font-bold text-gray-900">{count}</p>
                <p className="text-sm text-gray-500">
                  {status === 'all' ? 'Total' :
                   status === 'open' ? 'Ouverts' :
                   status === 'in_progress' ? 'En cours' :
                   status === 'pending_approval' ? 'En attente' : 'Fermés'}
                </p>
              </button>
            );
          })}
        </div>

        {/* Tickets List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              {tickets.length} ticket(s) trouvé(s)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tickets.length > 0 ? (
              <div className="space-y-4">
                {tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="p-4 rounded-xl border border-gray-100 hover:border-[#00abec]/30 hover:shadow-md transition-all"
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                            {ticket.id}
                          </span>
                          {ticket.isSensitive && permissions?.sensitiveContentAccess !== 'none' && (
                            <Badge variant="destructive" className="text-xs">
                              Contenu Sensible
                            </Badge>
                          )}
                          {ticket.latitude && ticket.longitude && (
                            <Badge variant="outline" className="text-xs gap-1">
                              <MapPin className="h-3 w-3" />
                              Localisé
                            </Badge>
                          )}
                        </div>
                        
                        <h3 className="font-semibold text-gray-900 mb-2">
                          {ticket.isSensitive && permissions?.sensitiveContentAccess === 'none'
                            ? '[Contenu masqué]'
                            : ticket.title}
                        </h3>
                        
                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                          {ticket.isSensitive && permissions?.sensitiveContentAccess === 'none'
                            ? 'Vous n\'avez pas accès à ce contenu sensible.'
                            : ticket.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {ticket.createdByName}
                          </div>
                          <div className="flex items-center gap-1">
                            <Building2 className="h-4 w-4" />
                            {ticket.village}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDateTimeFR(ticket.createdAt)}
                          </div>
                        </div>
                      </div>

                      <div className="flex md:flex-col items-center md:items-end gap-2">
                        <Badge className={statusConfig[ticket.status].color}>
                          {statusConfig[ticket.status].label}
                        </Badge>
                        <Badge className={priorityConfig[ticket.priority].color}>
                          {priorityConfig[ticket.priority].label}
                        </Badge>
                        <Link href={`/tickets/${ticket.id}`}>
                          <Button variant="outline" size="sm" className="mt-2">
                            <Eye className="h-4 w-4" />
                            Détails
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">Aucun ticket trouvé</h3>
                <p className="text-gray-500">
                  Essayez de modifier vos filtres ou créez un nouveau ticket
                </p>
                {permissions?.canCreateTicket && (
                  <Link href="/tickets/create">
                    <Button className="mt-4">
                      <Plus className="h-4 w-4" />
                      Créer un ticket
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
