'use client';

import { DashboardLayout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { analyticsData } from '@/data/mockData';
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Building2,
  Ticket,
  AlertCircle,
  Download,
  Calendar
} from 'lucide-react';
import Link from 'next/link';

export default function AnalyticsPage() {
  const { permissions } = useAuth();

  // Check permissions
  if (!permissions?.canViewNationalAnalytics) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="max-w-md w-full">
            <CardContent className="p-6 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Accès Refusé</h2>
              <p className="text-gray-500">
                Seul le Directeur National peut accéder aux analytiques nationales.
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

  const { totalTickets, openTickets, closedTickets, pendingApproval, villages, monthlyTrends, ticketsByPriority, ticketsByStatus } = analyticsData;

  // Calculate total children
  const totalChildren = villages.reduce((sum, v) => sum + v.children, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="h-7 w-7 text-[#00abec]" />
              Analytique Nationale
            </h1>
            <p className="text-gray-500 mt-1">Vue d'ensemble de tous les villages SOS</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Calendar className="h-4 w-4" />
              Période: 6 mois
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4" />
              Exporter
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="card-hover">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Total Tickets</span>
                <Ticket className="h-5 w-5 text-blue-500" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{totalTickets}</p>
              <div className="flex items-center gap-1 mt-2 text-sm text-green-600">
                <TrendingUp className="h-4 w-4" />
                +12% ce mois
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Villages Actifs</span>
                <Building2 className="h-5 w-5 text-[#00abec]" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{villages.length}</p>
              <div className="text-sm text-gray-500 mt-2">
                {totalChildren} enfants
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Taux de résolution</span>
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-3xl font-bold text-green-600">
                {Math.round((closedTickets / totalTickets) * 100)}%
              </p>
              <div className="flex items-center gap-1 mt-2 text-sm text-green-600">
                <TrendingUp className="h-4 w-4" />
                +5% vs mois dernier
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">En attente</span>
                <AlertCircle className="h-5 w-5 text-yellow-500" />
              </div>
              <p className="text-3xl font-bold text-yellow-600">{pendingApproval}</p>
              <div className="flex items-center gap-1 mt-2 text-sm text-red-600">
                <TrendingDown className="h-4 w-4" />
                -3% ce mois
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Monthly Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tendance Mensuelle</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {monthlyTrends.map((item, index) => {
                  const maxValue = Math.max(...monthlyTrends.map(m => m.tickets));
                  const percentage = (item.tickets / maxValue) * 100;
                  const prevValue = index > 0 ? monthlyTrends[index - 1].tickets : item.tickets;
                  const change = item.tickets - prevValue;
                  
                  return (
                    <div key={item.month}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">{item.month}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold">{item.tickets}</span>
                          {change !== 0 && (
                            <span className={`text-xs ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {change > 0 ? '+' : ''}{change}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#00abec] rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Distribution par Statut</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(ticketsByStatus).map(([status, count]) => {
                  const total = Object.values(ticketsByStatus).reduce((a, b) => a + b, 0);
                  const percentage = (count / total) * 100;
                  const colorMap: Record<string, string> = {
                    open: 'bg-blue-500',
                    in_progress: 'bg-yellow-500',
                    pending_approval: 'bg-orange-500',
                    approved: 'bg-green-500',
                    closed: 'bg-gray-500',
                  };
                  const labelMap: Record<string, string> = {
                    open: 'Ouverts',
                    in_progress: 'En cours',
                    pending_approval: 'En attente',
                    approved: 'Approuvés',
                    closed: 'Fermés',
                  };

                  return (
                    <div key={status}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">{labelMap[status]}</span>
                        <span className="text-sm font-bold">{count} ({percentage.toFixed(1)}%)</span>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${colorMap[status]} rounded-full transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Villages Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Performance par Village</CardTitle>
            <Button variant="outline" size="sm">
              Voir détails
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Village</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Enfants</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Tickets</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Ratio</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Tendance</th>
                  </tr>
                </thead>
                <tbody>
                  {villages.map((village, index) => {
                    const ratio = (village.tickets / village.children * 100).toFixed(1);
                    const isHigh = parseFloat(ratio) > 40;
                    
                    return (
                      <tr key={village.name} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-[#1c325d] rounded-lg flex items-center justify-center text-white font-bold text-xs">
                              {index + 1}
                            </div>
                            <span className="font-medium text-gray-900">{village.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Users className="h-4 w-4 text-gray-400" />
                            <span>{village.children}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant="secondary">{village.tickets}</Badge>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge className={isHigh ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                            {ratio}%
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {index % 2 === 0 ? (
                            <span className="flex items-center justify-end gap-1 text-green-600">
                              <TrendingUp className="h-4 w-4" />
                              Stable
                            </span>
                          ) : (
                            <span className="flex items-center justify-end gap-1 text-yellow-600">
                              <TrendingDown className="h-4 w-4" />
                              Attention
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Priority Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribution par Priorité</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              {Object.entries(ticketsByPriority).map(([priority, count]) => {
                const colorMap: Record<string, string> = {
                  low: 'border-gray-300 bg-gray-50',
                  medium: 'border-blue-300 bg-blue-50',
                  high: 'border-orange-300 bg-orange-50',
                  urgent: 'border-red-300 bg-red-50',
                };
                const textColorMap: Record<string, string> = {
                  low: 'text-gray-700',
                  medium: 'text-blue-700',
                  high: 'text-orange-700',
                  urgent: 'text-red-700',
                };
                const labelMap: Record<string, string> = {
                  low: 'Faible',
                  medium: 'Moyen',
                  high: 'Élevé',
                  urgent: 'Urgent',
                };

                return (
                  <div 
                    key={priority} 
                    className={`p-4 rounded-lg border-2 ${colorMap[priority]} text-center`}
                  >
                    <p className={`text-3xl font-bold ${textColorMap[priority]}`}>{count}</p>
                    <p className="text-sm text-gray-600 mt-1">{labelMap[priority]}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
