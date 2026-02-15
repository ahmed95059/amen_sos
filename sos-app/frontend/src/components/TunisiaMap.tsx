'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui';
import { MapPin, CheckCircle, Clock, Users } from 'lucide-react';
import { mockVillages } from '@/data/mockData';

// Fix for Leaflet marker icons in Next.js
const validatedIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNSIgaGVpZ2h0PSI0MSIgdmlld0JveD0iMCAwIDI1IDQxIj48cGF0aCBmaWxsPSIjMTBiOTgxIiBkPSJNMTIuNSAwQzUuNTk3IDAgMCA1LjU5NyAwIDEyLjVjMCA5LjM3NSAxMi41IDI4LjEyNSAxMi41IDI4LjEyNXMyIDEyLjUgMTIuNSAxMi41YzYuOTAzIDAgMTIuNS01LjU5NyAxMi41LTEyLjVTMTkuNDAzIDAgMTIuNSAweiIvPjwvc3ZnPg==',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const pendingIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNSIgaGVpZ2h0PSI0MSIgdmlld0JveD0iMCAwIDI1IDQxIj48cGF0aCBmaWxsPSIjZjU5ZTBiIiBkPSJNMTIuNSAwQzUuNTk3IDAgMCA1LjU5NyAwIDEyLjVjMCA5LjM3NSAxMi41IDI4LjEyNSAxMi41IDI4LjEyNXMyIDEyLjUgMTIuNSAxMi41YzYuOTAzIDAgMTIuNS01LjU5NyAxMi41LTEyLjVTMTkuNDAzIDAgMTIuNSAweiIvPjwvc3ZnPg==',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

interface TunisiaMapProps {
  onVillageSelect?: (village: (typeof mockVillages)[0]) => void;
  selectedVillageId?: string;
}

export function TunisiaMap({ onVillageSelect, selectedVillageId }: TunisiaMapProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedVillage, setSelectedVillage] = useState<(typeof mockVillages)[0] | null>(null);
  const center: L.LatLngExpression = [35.5, 10.6]; // Tunisia center

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleVillageSelect = (village: (typeof mockVillages)[0]) => {
    setSelectedVillage(village);
    onVillageSelect?.(village);
  };

  if (!mounted) {
    return <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">Chargement de la carte...</div>;
  }

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-green-600" />
          Carte de Tunisie - Villages
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Map */}
          <div className="lg:col-span-2 rounded-lg overflow-hidden border border-gray-200 h-96">
            <MapContainer center={center as L.LatLngExpression} zoom={7} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

              {mockVillages.map((village) => (
                <Marker
                  key={village.id}
                  position={[village.latitude, village.longitude] as L.LatLngExpression}
                  icon={village.validations_pending > 0 ? pendingIcon : validatedIcon}
                  eventHandlers={{
                    click: () => handleVillageSelect(village),
                  }}
                >
                  <Popup>
                    <div className="text-sm">
                      <p className="font-bold">{village.name}</p>
                      <p className="text-gray-600 text-xs mb-2">{village.region}</p>
                      <p className="text-green-600">✓ Validées: {village.validations_done}</p>
                      <p className="text-orange-600">⏳ En attente: {village.validations_pending}</p>
                      <p className="text-blue-600 pt-2">
                        <Users className="h-3 w-3 inline mr-1" />
                        Enfants: {village.total_children}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          {/* Village Info */}
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-bold text-gray-900 mb-3">Villages ({mockVillages.length})</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {mockVillages.map((village) => (
                  <button
                    key={village.id}
                    onClick={() => handleVillageSelect(village)}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      selectedVillage?.id === village.id
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'bg-white hover:bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <p className="font-medium text-sm">{village.name}</p>
                    <p className="text-xs opacity-75">{village.region}</p>
                    <div className="flex gap-2 mt-2 text-xs">
                      <Badge
                        className={
                          selectedVillage?.id === village.id
                            ? 'bg-green-300 text-green-900'
                            : 'bg-green-100 text-green-700'
                        }
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {village.validations_done}
                      </Badge>
                      <Badge
                        className={
                          selectedVillage?.id === village.id
                            ? 'bg-orange-300 text-orange-900'
                            : 'bg-orange-100 text-orange-700'
                        }
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        {village.validations_pending}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {selectedVillage && (
              <div className="p-4 bg-green-50 rounded-lg border-l-4 border-l-green-600">
                <h4 className="font-bold text-gray-900 mb-3">{selectedVillage.name}</h4>
                <dl className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Région:</dt>
                    <dd className="font-medium">{selectedVillage.region}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Validées:</dt>
                    <dd className="font-medium text-green-600">{selectedVillage.validations_done}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">En attente:</dt>
                    <dd className="font-medium text-orange-600">{selectedVillage.validations_pending}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Enfants:</dt>
                    <dd className="font-medium text-blue-600">{selectedVillage.total_children}</dd>
                  </div>
                  <div className="pt-2 border-t border-green-200">
                    <p className="text-gray-600 text-xs mb-2">Foyers:</p>
                    <ul className="text-xs space-y-1">
                      {selectedVillage.foyers.map((foyer) => (
                        <li key={foyer.id} className="text-gray-700 pl-2 border-l border-green-300">
                          {foyer.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                </dl>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
