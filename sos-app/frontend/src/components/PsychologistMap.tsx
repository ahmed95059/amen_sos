'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { mockPsychologists } from '@/data/mockData';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from '@/components/ui';
import { MapPin, Phone, Mail, CheckCircle, Clock, Users } from 'lucide-react';

// Dynamic import to avoid SSR issues
const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => <div className="h-125 w-full bg-gray-200 animate-pulse rounded-lg" />
});

interface Psychologist {
  id: string;
  name: string;
  email: string;
  phone: string;
  village: string;
  specialization: string;
  latitude: number;
  longitude: number;
  available: boolean;
  experience: string;
}

interface PsychologistMapProps {
  userVillage?: string;
}

export function PsychologistMap({ userVillage }: PsychologistMapProps) {
  const [selectedPsy, setSelectedPsy] = useState<string | null>(null);
  const [filterAvailable, setFilterAvailable] = useState(false);

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Get user location (using Village Tunis as default center for demo)
  const userLat = 36.8065;
  const userLon = 10.1815;

  // Process psychologists with distance
  const psyListWithDistance = useMemo(() => {
    let list = [...mockPsychologists].map(psy => ({
      ...psy,
      distance: calculateDistance(userLat, userLon, psy.latitude, psy.longitude),
    }));

    if (filterAvailable) {
      list = list.filter(psy => psy.available);
    }

    // Sort by distance
    return list.sort((a, b) => a.distance - b.distance);
  }, [filterAvailable]);

  // Convert psychologists to map markers
  const psychologistMarkers = psyListWithDistance.map((psy) => ({
    id: psy.id,
    position: [psy.latitude, psy.longitude] as [number, number],
    title: psy.name,
    description: `${psy.specialization} - ${psy.village}${psy.available ? ' (Disponible)' : ' (Indisponible)'}`,
    type: (psy.available ? 'default' : 'incident') as 'default' | 'incident',
  }));

  return (
    <div className="space-y-4">
      {/* Interactive Map */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5 text-[#00abec]" />
            Localisation des Psychologues
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Map
            markers={psychologistMarkers}
            center={[userLat, userLon]}
            zoom={10}
            onMarkerClick={(marker) => setSelectedPsy(marker.id as string)}
          />
        </CardContent>
      </Card>

      {/* Filter and Psychologists List */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button
            variant={filterAvailable ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterAvailable(!filterAvailable)}
          >
            {filterAvailable ? '✓ ' : ''}Afficher seulement disponibles
          </Button>
          <p className="text-sm text-gray-500">
            {psyListWithDistance.length} psychologue(s)
          </p>
        </div>

        {/* Psychologists List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {psyListWithDistance.map((psy) => (
            <Card
              key={psy.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedPsy === psy.id ? 'border-[#00abec] border-2 shadow-md' : ''
              }`}
              onClick={() => setSelectedPsy(selectedPsy === psy.id ? null : psy.id)}
            >
              <CardContent className="p-4 space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900">{psy.name}</h3>
                    <p className="text-xs text-gray-500">{psy.village}</p>
                  </div>
                  <Badge className={psy.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                    {psy.available ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Disponible
                      </>
                    ) : (
                      <>
                        <Clock className="h-3 w-3 mr-1" />
                        Indisponible
                      </>
                    )}
                  </Badge>
                </div>

                {/* Specialization */}
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-700">{psy.specialization}</span>
                </div>

                {/* Experience */}
                <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                  <span className="font-medium">Expérience:</span> {psy.experience}
                </div>

                {/* Distance */}
                <div className="flex items-center gap-2 text-sm font-medium text-[#00abec]">
                  <MapPin className="h-4 w-4" />
                  {psy.distance.toFixed(1)} km de votre position
                </div>

                {/* Contact Details */}
                <div className="space-y-2 pt-2 border-t border-gray-200">
                  <a
                    href={`tel:${psy.phone}`}
                    className="flex items-center gap-2 text-sm text-gray-700 hover:text-[#00abec] transition"
                  >
                    <Phone className="h-4 w-4" />
                    {psy.phone}
                  </a>
                  <a
                    href={`mailto:${psy.email}`}
                    className="flex items-center gap-2 text-sm text-gray-700 hover:text-[#00abec] transition truncate"
                  >
                    <Mail className="h-4 w-4" />
                    {psy.email}
                  </a>
                </div>

                {/* Contact Button */}
                <Button variant="cta" className="w-full text-sm" size="sm">
                  Contacter
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {psyListWithDistance.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>Aucun psychologue trouvé correspondant aux critères.</p>
          </div>
        )}
      </div>
    </div>
  );
}
