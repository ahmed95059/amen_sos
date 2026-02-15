'use client';

import { useState } from 'react';
import { Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface CustomMarker {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  description?: string;
}

interface MarkerManagerProps {
  customMarkers?: CustomMarker[];
  onMarkersChange: (markers: CustomMarker[]) => void;
  onIncidentsToggle: (show: boolean) => void;
  showIncidents: boolean;
  incidentCount?: number;
}

export default function MarkerManager({
  customMarkers = [],
  onMarkersChange,
  onIncidentsToggle,
  showIncidents,
  incidentCount = 0,
}: MarkerManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    latitude: '',
    longitude: '',
    description: '',
  });

  const handleAddMarker = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.latitude || !formData.longitude) {
      alert('Please fill in all required fields');
      return;
    }

    const newMarker: CustomMarker = {
      id: `custom-${Date.now()}`,
      title: formData.title,
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
      description: formData.description,
    };

    const updated = [...customMarkers, newMarker];
    onMarkersChange(updated);

    setFormData({ title: '', latitude: '', longitude: '', description: '' });
    setShowForm(false);
  };

  const handleDeleteMarker = (id: string) => {
    const updated = customMarkers.filter((m) => m.id !== id);
    onMarkersChange(updated);
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="space-y-4">
          {/* Incidents Toggle */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
            <div>
              <h3 className="font-semibold text-sm">Incident Locations</h3>
              <p className="text-xs text-gray-600">
                {incidentCount} incident{incidentCount !== 1 ? 's' : ''} found
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onIncidentsToggle(!showIncidents)}
              className="gap-2"
            >
              {showIncidents ? (
                <>
                  <Eye className="h-4 w-4" />
                  Hide
                </>
              ) : (
                <>
                  <EyeOff className="h-4 w-4" />
                  Show
                </>
              )}
            </Button>
          </div>

          {/* Custom Markers Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Custom Markers</h3>
            <Button
              onClick={() => setShowForm(!showForm)}
              size="sm"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Marker
            </Button>
          </div>

          {/* Add Marker Form */}
          {showForm && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 space-y-3">
              <input
                type="text"
                placeholder="Marker Title *"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Latitude *"
                  step="0.0001"
                  value={formData.latitude}
                  onChange={(e) =>
                    setFormData({ ...formData, latitude: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  placeholder="Longitude *"
                  step="0.0001"
                  value={formData.longitude}
                  onChange={(e) =>
                    setFormData({ ...formData, longitude: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <textarea
                placeholder="Description (optional)"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-20"
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleAddMarker}
                  size="sm"
                  className="flex-1"
                >
                  Add
                </Button>
                <Button
                  onClick={() => setShowForm(false)}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Custom Markers List */}
          {customMarkers.length > 0 && (
            <div className="space-y-2">
              {customMarkers.map((marker) => (
                <div
                  key={marker.id}
                  className="flex items-start justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{marker.title}</p>
                    <p className="text-xs text-gray-600">
                      {marker.latitude.toFixed(4)}, {marker.longitude.toFixed(4)}
                    </p>
                    {marker.description && (
                      <p className="text-xs text-gray-700 mt-1">
                        {marker.description}
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={() => handleDeleteMarker(marker.id)}
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {customMarkers.length === 0 && !showForm && (
            <p className="text-xs text-gray-600 text-center py-2">
              No custom markers yet. Click &quot;Add Marker&quot; to create one.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
