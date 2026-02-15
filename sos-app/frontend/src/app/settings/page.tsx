'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { roleDisplayNames, UserRole } from '@/types';
import { 
  Settings,
  User,
  Lock,
  Bell,
  Globe,
  Save,
  Eye,
  EyeOff,
  Check
} from 'lucide-react';

export default function SettingsPage() {
  const { user, switchRole } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'demo'>('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const tabs = [
    { id: 'profile', label: 'Profil', icon: <User className="h-4 w-4" /> },
    { id: 'security', label: 'Sécurité', icon: <Lock className="h-4 w-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="h-4 w-4" /> },
    { id: 'demo', label: 'Mode Démo', icon: <Globe className="h-4 w-4" /> },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="h-7 w-7 text-[#00abec]" />
            Paramètres
          </h1>
          <p className="text-gray-500 mt-1">Gérez votre compte et vos préférences</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <Card className="lg:col-span-1 h-fit">
            <CardContent className="p-2">
              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      activeTab === tab.id
                        ? 'bg-[#e4f3fb] text-[#00abec]'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </nav>
            </CardContent>
          </Card>

          {/* Content */}
          <div className="lg:col-span-3">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <Card>
                <CardHeader>
                  <CardTitle>Informations du Profil</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </div>
                    <div>
                      <Button variant="outline" size="sm">Changer la photo</Button>
                      <p className="text-xs text-gray-500 mt-1">JPG, PNG ou GIF. Max 2MB.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Prénom</label>
                      <Input defaultValue={user?.firstName} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Nom</label>
                      <Input defaultValue={user?.lastName} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <Input type="email" defaultValue={user?.email} />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Rôle</label>
                    <Input defaultValue={roleDisplayNames[user?.role || 'normal']} disabled className="bg-gray-50" />
                    <p className="text-xs text-gray-500">Le rôle ne peut être modifié que par un administrateur.</p>
                  </div>

                  {user?.village && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Village</label>
                      <Input defaultValue={user.village} disabled className="bg-gray-50" />
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button onClick={handleSave} className="bg-[#00abec] hover:bg-[#0095d0] rounded-xl">
                      {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                      {saved ? 'Enregistré!' : 'Enregistrer'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <Card>
                <CardHeader>
                  <CardTitle>Sécurité</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">Changer le mot de passe</h3>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Mot de passe actuel</label>
                      <div className="relative">
                        <Input 
                          type={showPassword ? 'text' : 'password'} 
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Nouveau mot de passe</label>
                      <Input type="password" placeholder="••••••••" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Confirmer le nouveau mot de passe</label>
                      <Input type="password" placeholder="••••••••" />
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="font-medium text-gray-900 mb-4">Sessions actives</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">Session actuelle</p>
                          <p className="text-sm text-gray-500">Windows • Chrome • Tunis, TN</p>
                        </div>
                        <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">Active</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleSave} className="bg-[#00abec] hover:bg-[#0095d0] rounded-xl">
                      {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                      {saved ? 'Enregistré!' : 'Enregistrer'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <Card>
                <CardHeader>
                  <CardTitle>Préférences de Notification</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    {[
                      { label: 'Nouveaux tickets assignés', description: 'Recevoir une notification quand un ticket vous est assigné' },
                      { label: 'Mises à jour de tickets', description: 'Recevoir une notification pour les changements de statut' },
                      { label: 'Commentaires', description: 'Recevoir une notification pour les nouveaux commentaires' },
                      { label: 'Rappels', description: 'Recevoir des rappels pour les tickets en attente' },
                      { label: 'Rapports hebdomadaires', description: 'Recevoir un résumé hebdomadaire par email' },
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{item.label}</p>
                          <p className="text-sm text-gray-500">{item.description}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked={index < 3} className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#00abec]/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00abec]"></div>
                        </label>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleSave} className="bg-[#00abec] hover:bg-[#0095d0] rounded-xl">
                      {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                      {saved ? 'Enregistré!' : 'Enregistrer'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Demo Tab */}
            {activeTab === 'demo' && (
              <Card>
                <CardHeader>
                  <CardTitle>Mode Démo - Changer de Rôle</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-sm text-gray-600">
                    Cette fonctionnalité est uniquement disponible en mode démo. 
                    Elle vous permet de tester les différentes vues selon les rôles.
                  </p>

                  <div className="grid gap-3">
                    {(['normal', 'psychologue', 'dir_village', 'responsable_save', 'admin_it'] as UserRole[]).map((role) => (
                      <button
                        key={role}
                        onClick={() => switchRole(role)}
                        className={`p-4 border rounded-xl text-left transition-all ${
                          user?.role === role
                            ? 'border-[#00abec] bg-[#e4f3fb]'
                            : 'border-gray-200 hover:border-[#00abec]/50 hover:bg-[#e4f3fb]/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{roleDisplayNames[role]}</p>
                            <p className="text-sm text-gray-500 mt-1">
                              {role === 'normal' && 'Peut créer et voir ses propres tickets'}
                              {role === 'psychologue' && 'Peut rédiger des rapports et voir les cas du village'}
                              {role === 'dir_village' && 'Peut approuver les plans et fermer les cas'}
                              {role === 'responsable_save' && 'Supervision nationale et mapping'}
                              {role === 'admin_it' && 'Gestion des utilisateurs du système'}
                            </p>
                          </div>
                          {user?.role === role && (
                            <Check className="h-5 w-5 text-[#00abec]" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
