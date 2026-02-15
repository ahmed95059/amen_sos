'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, AlertCircle, Heart, TrendingUp } from 'lucide-react';
import { mockVillages } from '@/data/mockData';

interface ChildStatisticsProps {
  userVillage?: string;
}

export function ChildStatistics({ userVillage = 'Village Tunis' }: ChildStatisticsProps) {
  // Find the user's village data
  const villageData = mockVillages.find((v) => v.name === userVillage);

  if (!villageData) {
    return (
      <Card className="col-span-1 md:col-span-2 lg:col-span-3">
        <CardHeader>
          <CardTitle>Statistiques du Village</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Aucune donnée disponible pour ce village</p>
        </CardContent>
      </Card>
    );
  }

  const stats = [
    {
      icon: Users,
      label: 'Total Enfants',
      value: villageData.total_children,
      color: 'bg-blue-100 text-blue-700',
      bgIcon: 'bg-blue-200',
    },
    {
      icon: Heart,
      label: 'À Risque',
      value: Math.floor(villageData.total_children * 0.15),
      color: 'sos-red-light-50',
      bgIcon: 'bg-[#f1c9c6]',
    },
    {
      icon: TrendingUp,
      label: 'Rapports Actifs',
      value: villageData.validations_pending + 2,
      color: 'bg-orange-100 text-orange-700',
      bgIcon: 'bg-orange-200',
    },
    {
      icon: AlertCircle,
      label: 'En Suivi',
      value: Math.floor(villageData.total_children * 0.45),
      color: 'bg-yellow-100 text-yellow-700',
      bgIcon: 'bg-yellow-200',
    },
  ];

  return (
    <Card className="col-span-1 md:col-span-2 lg:col-span-3">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-600" />
          Statistiques de l'État des Enfants - {villageData.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className={`p-4 rounded-lg border ${stat.color}`}>
                <div className={`${stat.bgIcon} w-10 h-10 rounded-lg flex items-center justify-center mb-2 text-lg`}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-sm opacity-75 mb-1">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            );
          })}
        </div>

        {/* Detailed Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <h4 className="font-semibold text-gray-900 mb-3">Validations en Cours</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Complétées</span>
                <span className="font-bold text-green-700">{villageData.validations_done}</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-600 transition-all"
                  style={{
                    width: `${
                      (villageData.validations_done /
                        (villageData.validations_done + villageData.validations_pending)) *
                      100
                    }%`,
                  }}
                ></div>
              </div>
              <p className="text-xs text-gray-600">
                {villageData.validations_done} /{' '}
                {villageData.validations_done + villageData.validations_pending}
              </p>
            </div>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <h4 className="font-semibold text-gray-900 mb-3">Foyers Opérationnels</h4>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-purple-700">{villageData.foyers.length}</div>
              <ul className="text-sm space-y-1">
                {villageData.foyers.map((foyer) => (
                  <li key={foyer.id} className="text-gray-700 flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-purple-600"></span>
                    {foyer.name}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
