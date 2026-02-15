'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Home } from 'lucide-react';
import { mockVillages } from '@/data/mockData';

const foyerIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyOCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDI4IDQwIj48cGF0aCBmaWxsPSIjODI1NWMwIiBkPSJNMTQgMEMwIDAgMCA1LjYwMzAwMDA2ODA0NDE5NyAwIDE0YzAgMTAuNTA3MzEzMjA5ODUxNzMxIDE0IDI2IDE0IDI2czE0LTE1LjQ5MjY4Njc5MDE0ODI2IDE0LTI2YzAtOC4zOTY5OTkzMTk1NTU4MDMgMC0xNCAxNC0xNHptMCA5Yy0yLjc2MTUxNDI1MzUxNDE0NSAwLTUtMi4yMzg0ODU3NDY0ODU4NTUtNS01czIuMjM4NDg1NzQ2NDg1ODU1LTUgNS01IDUgMi4yMzg0ODU3NDY0ODU4NTUgNSA1LTIuMjM4NDg1NzQ2NDg1ODU1IDUtNSA1eiIvPjwvc3ZnPg==',
  iconSize: [28, 40],
  iconAnchor: [14, 40],
  popupAnchor: [0, -40],
});

interface VillageLocationMapProps {
  userVillage?: string;
}

export function VillageLocationMap({ userVillage = 'Village Tunis' }: VillageLocationMapProps) {
  const [mounted, setMounted] = useState(false);
  const villageData = mockVillages.find((v) => v.name === userVillage);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        Chargement de la carte...
      </div>
    );
  }

  if (!villageData) {
    return (
      <Card className="col-span-1 md:col-span-2 lg:col-span-3">
        <CardHeader>
          <CardTitle>Localisation des Foyers</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Aucune donnée disponible pour ce village</p>
        </CardContent>
      </Card>
    );
  }

  const center: L.LatLngExpression = [villageData.latitude, villageData.longitude];

  return (
    <Card className="col-span-1 md:col-span-2 lg:col-span-3">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-purple-600" />
          Localisation des Foyers - {villageData.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Map */}
          <div className="lg:col-span-2 rounded-lg overflow-hidden border border-gray-200 h-96">
            <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

              {/* Village marker */}
              <Marker position={center}>
                <Popup>
                  <div className="text-sm font-bold">{villageData.name}</div>
                </Popup>
              </Marker>

              {/* Foyer markers */}
              {villageData.foyers.map((foyer) => (
                <Marker
                  key={foyer.id}
                  position={[foyer.latitude, foyer.longitude] as L.LatLngExpression}
                  icon={foyerIcon}
                >
                  <Popup>
                    <div className="text-sm">
                      <p className="font-bold">{foyer.name}</p>
                      <p className="text-xs text-gray-600">Foyer SOS</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          {/* Foyer List */}
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Home className="h-4 w-4 text-purple-600" />
              Foyers ({villageData.foyers.length})
            </h4>
            <div className="space-y-3">
              {villageData.foyers.map((foyer) => (
                <div key={foyer.id} className="p-3 bg-white rounded-lg border border-purple-200">
                  <p className="font-medium text-gray-900 text-sm">{foyer.name}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    📍 Lat: {foyer.latitude.toFixed(4)}, Lon: {foyer.longitude.toFixed(4)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
