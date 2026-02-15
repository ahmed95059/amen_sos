'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, Mail, MapPin, Users } from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  village?: string;
}

interface VillageContactsCardProps {
  userVillage?: string;
}

// SOS Tunisia Core Contacts
const SOSCoreContacts: Contact[] = [
  {
    id: 'C-001',
    name: 'Directeur National',
    role: 'Directeur National SOS',
    phone: '+216 71 234 567',
    email: 'directeur@sosvillages.org',
  },
  {
    id: 'C-002',
    name: 'Responsable Sauvegarde',
    role: 'Protection & Sauvegarde',
    phone: '+216 71 234 568',
    email: 'sauvegarde@sosvillages.org',
  },
  {
    id: 'C-003',
    name: 'Coordinateur Psychosocial',
    role: 'Santé Mentale',
    phone: '+216 71 234 569',
    email: 'psycho@sosvillages.org',
  },
  {
    id: 'C-004',
    name: 'Chef Administratif',
    role: 'Administration & Ressources',
    phone: '+216 71 234 570',
    email: 'admin@sosvillages.org',
  },
  {
    id: 'C-005',
    name: 'Coordinateur Terrain',
    role: 'Opérations Villages',
    phone: '+216 71 234 571',
    email: 'operations@sosvillages.org',
  },
];

export function VillageContactsCard({ userVillage = 'Village Tunis' }: VillageContactsCardProps) {
  return (
    <Card className="col-span-1 md:col-span-2 lg:col-span-3">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-600" />
          Contacts Core SOS Tunisie
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {SOSCoreContacts.map((contact) => (
            <div
              key={contact.id}
              className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{contact.name}</h4>
                  <p className="text-sm text-gray-600 mb-3">{contact.role}</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Phone className="h-4 w-4 text-blue-600" />
                      <a href={`tel:${contact.phone}`} className="hover:text-blue-600 underline">
                        {contact.phone}
                      </a>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Mail className="h-4 w-4 text-blue-600" />
                      <a href={`mailto:${contact.email}`} className="hover:text-blue-600 underline">
                        {contact.email}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
