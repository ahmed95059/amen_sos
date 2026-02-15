'use client'; // Important for Next.js App Router

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';

// Fix for default marker icons in Next.js
const fixLeafletIcon = () => {
  const defaultIcon = L.Icon.Default.prototype as unknown as Record<string, unknown>;
  delete defaultIcon._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: '/leaflet/marker-icon-2x.png',
    iconUrl: '/leaflet/marker-icon.png',
    shadowUrl: '/leaflet/marker-shadow.png',
  });
};

// Create colored icons for different marker types
const createIcon = (color: string) => {
  return L.icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    iconRetinaUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
};

interface MarkerData {
  id: number | string;
  position: [number, number];
  title: string;
  description?: string;
  type?: 'default' | 'incident' | 'custom';
}

interface MapProps {
  markers: MarkerData[];
  center?: [number, number];
  zoom?: number;
  onMarkerClick?: (marker: MarkerData) => void;
  showIncidentMarkers?: boolean;
  incidentMarkers?: MarkerData[];
}

export default function Map({ 
  markers = [],
  center = [36.8065, 10.1815], // Default: Tunis
  zoom = 13,
  onMarkerClick,
  showIncidentMarkers = false,
  incidentMarkers = [],
}: MapProps) {
  useEffect(() => {
    fixLeafletIcon();
  }, []);

  // Compute all markers inline instead of using state to avoid cascading renders
  let displayMarkers = [...markers];
  if (showIncidentMarkers && incidentMarkers.length > 0) {
    displayMarkers = [...displayMarkers, ...incidentMarkers];
  }

  const getIconColor = (type?: string) => {
    switch (type) {
      case 'incident':
        return 'red';
      case 'custom':
        return 'gold';
      default:
        return 'blue';
    }
  };

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: '500px', width: '100%', borderRadius: '8px' }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {displayMarkers.map((marker) => (
        <Marker 
          key={marker.id} 
          position={marker.position}
          icon={createIcon(getIconColor(marker.type))}
          eventHandlers={{
            click: () => onMarkerClick?.(marker),
          }}
        >
          <Popup>
            <div className="p-2">
              <h3 className="font-bold text-sm">{marker.title}</h3>
              {marker.type && <p className="text-xs text-gray-600 mt-1">Type: {marker.type}</p>}
              {marker.description && <p className="text-xs mt-1">{marker.description}</p>}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}