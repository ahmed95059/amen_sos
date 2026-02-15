'use client';

import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Input, Select } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { roleDisplayNames, UserRole } from '@/types';
import { Users, Search, AlertCircle, Mail, Building2, UserPlus, X, Check, Trash2, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { getAuthToken, gql } from '@/lib/backend';

const Q_USERS_PAGE = `
query UsersPageData {
  adminUsers {
    id
    name
    email
    role
    village { id name }
  }
  villages {
    id
    name
  }
}`;

const M_CREATE_USER = `
mutation AdminCreateUser($input: AdminCreateUserInput!) {
  adminCreateUser(input: $input) {
    id
    name
    email
    role
    village { id name }
  }
}`;

const M_DELETE_USER = `
mutation AdminDeleteUser($userId: ID!) {
  adminDeleteUser(userId: $userId)
}`;

type BackendRole = 'DECLARANT' | 'PSY' | 'ADMIN_IT' | 'DIR_VILLAGE' | 'RESPONSABLE_SAUVEGARDE' | 'DIR_NATIONAL';

type BackendUser = {
  id: string;
  name: string;
  email: string;
  role: BackendRole;
  village?: { id: string; name: string } | null;
};

type Village = { id: string; name: string };

type UiUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  village?: string;
};

function mapRole(role: BackendRole): UserRole {
  if (role === 'DECLARANT') return 'normal';
  if (role === 'PSY') return 'psychologue';
  if (role === 'DIR_VILLAGE') return 'dir_village';
  if (role === 'RESPONSABLE_SAUVEGARDE') return 'responsable_save';
  if (role === 'DIR_NATIONAL') return 'dir_national';
  return 'admin_it';
}

function toBackendRole(role: UserRole): BackendRole {
  if (role === 'normal') return 'DECLARANT';
  if (role === 'psychologue') return 'PSY';
  if (role === 'dir_village') return 'DIR_VILLAGE';
  if (role === 'responsable_save') return 'RESPONSABLE_SAUVEGARDE';
  if (role === 'dir_national') return 'DIR_NATIONAL';
  return 'ADMIN_IT';
}

function toUiUser(u: BackendUser): UiUser {
  const parts = (u.name || '').trim().split(/\s+/);
  return {
    id: u.id,
    firstName: parts[0] || u.email,
    lastName: parts.slice(1).join(' ') || '',
    email: u.email,
    role: mapRole(u.role),
    village: u.village?.name || undefined,
  };
}

export default function UsersPage() {
  const { permissions, user: currentUser } = useAuth();
  const [users, setUsers] = useState<UiUser[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'normal' as UserRole,
    villageId: '',
    whatsappNumber: '',
  });

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const token = getAuthToken();
      if (!token) throw new Error('SESSION_EXPIRED');
      const data = await gql<{ adminUsers: BackendUser[]; villages: Village[] }>(Q_USERS_PAGE, {}, token);
      setUsers((data.adminUsers || []).map(toUiUser));
      setVillages(data.villages || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'LOAD_USERS_FAILED');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (permissions?.canManageUsers) {
      void loadData();
    }
  }, [permissions?.canManageUsers]);

  let filteredUsers = users;
  if (searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
    filteredUsers = filteredUsers.filter((u) =>
      u.firstName.toLowerCase().includes(q) ||
      u.lastName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  }
  if (roleFilter !== 'all') {
    filteredUsers = filteredUsers.filter((u) => u.role === roleFilter);
  }

  const roleOptions = [
    { value: 'all', label: 'Tous les rôles' },
    { value: 'normal', label: 'Personnel' },
    { value: 'psychologue', label: 'Psychologue' },
    { value: 'dir_village', label: 'Directeur Village' },
    { value: 'responsable_save', label: 'Responsable Sauvegarde' },
    { value: 'dir_national', label: 'Directeur National' },
    { value: 'admin_it', label: 'Admin IT' },
  ];

  const createRoleOptions = [
    { value: 'normal', label: 'Personnel (Déclarant)' },
    { value: 'psychologue', label: 'Psychologue' },
    { value: 'dir_village', label: 'Directeur Village' },
    { value: 'responsable_save', label: 'Responsable Sauvegarde' },
    { value: 'dir_national', label: 'Directeur National' },
  ];

  const usersByRole = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const u of users) acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, [users]);

  if (!permissions?.canManageUsers) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="max-w-md w-full">
            <CardContent className="p-6 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Accès Refusé</h2>
              <p className="text-gray-500">Seul l'administrateur IT peut gérer les utilisateurs.</p>
              <Link href="/dashboard"><Button className="mt-4">Retour au tableau de bord</Button></Link>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const roleNeedsVillage = form.role === 'normal' || form.role === 'psychologue' || form.role === 'dir_village';

  function mapUserApiError(message: string) {
    if (message.includes('SESSION_EXPIRED')) return 'Session expirée. Reconnectez-vous.';
    if (message.includes('INVALID_INPUT')) return 'Données invalides. Vérifiez les champs obligatoires.';
    if (message.includes('PASSWORD_TOO_SHORT')) return 'Mot de passe trop court (minimum 8 caractères).';
    if (message.includes('VILLAGE_REQUIRED')) return 'Ce rôle nécessite un village.';
    if (message.includes('VILLAGE_NOT_ALLOWED_FOR_ROLE')) return 'Le village ne doit pas être défini pour ce rôle.';
    if (message.includes('ADMIN_CREATE_ADMIN_FORBIDDEN')) return "Le backend interdit la création d'un autre Admin IT.";
    if (message.includes('USER_CREATE_FAILED')) return "Création impossible (email déjà utilisé ou données invalides).";
    if (message.includes('CANNOT_DELETE_SELF')) return 'Vous ne pouvez pas supprimer votre propre compte.';
    if (message.includes('USER_HAS_RELATED_DATA')) return "Suppression refusée: cet utilisateur est lié à des signalements/documents/logs.";
    return message;
  }

  async function handleCreateUser() {
    const fullName = `${form.firstName} ${form.lastName}`.trim();
    if (!fullName || !form.email || !form.password) {
      setError('Nom, email et mot de passe sont obligatoires.');
      return;
    }
    if (form.password.length < 8) {
      setError('Mot de passe minimum: 8 caractères.');
      return;
    }
    if (roleNeedsVillage && !form.villageId) {
      setError('Ce rôle nécessite un village.');
      return;
    }

    setCreating(true);
    setError('');
    setSuccess('');
    try {
      const token = getAuthToken();
      if (!token) throw new Error('SESSION_EXPIRED');
      await gql(
        M_CREATE_USER,
        {
          input: {
            name: fullName,
            email: form.email.trim().toLowerCase(),
            password: form.password,
            role: toBackendRole(form.role),
            villageId: roleNeedsVillage ? form.villageId : null,
            whatsappNumber: form.whatsappNumber.trim() || null,
          },
        },
        token
      );
      setShowAddModal(false);
      setForm({ firstName: '', lastName: '', email: '', password: '', role: 'normal', villageId: '', whatsappNumber: '' });
      await loadData();
      setSuccess('Utilisateur créé avec succès.');
    } catch (e) {
      const raw = e instanceof Error ? e.message : 'CREATE_USER_FAILED';
      setError(mapUserApiError(raw));
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteUser(userId: string) {
    if (!confirm('Supprimer cet utilisateur ?')) return;
    setDeletingId(userId);
    setError('');
    setSuccess('');
    try {
      const token = getAuthToken();
      if (!token) throw new Error('SESSION_EXPIRED');
      await gql(M_DELETE_USER, { userId }, token);
      await loadData();
      setSuccess('Utilisateur supprimé.');
    } catch (e) {
      const raw = e instanceof Error ? e.message : 'DELETE_USER_FAILED';
      setError(mapUserApiError(raw));
    } finally {
      setDeletingId('');
    }
  }

  const getRoleBadgeColor = (role: UserRole) => {
    const colors: Record<UserRole, string> = {
      normal: 'bg-gray-100 text-gray-800',
      psychologue: 'bg-blue-100 text-blue-800',
      dir_village: 'bg-green-100 text-green-800',
      responsable_save: 'bg-cyan-100 text-cyan-800',
      dir_national: 'bg-orange-100 text-orange-800',
      admin_it: 'bg-red-100 text-red-800',
    };
    return colors[role];
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Users className="h-7 w-7 text-[#00abec]" />Gestion des Utilisateurs</h1>
            <p className="text-gray-500 mt-1">Données synchronisées avec le backend</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => void loadData()} disabled={loading}><RefreshCw className="h-4 w-4" />Rafraîchir</Button>
            <Button className="bg-[#00abec] hover:bg-[#0095d0] rounded-xl" onClick={() => setShowAddModal(true)}>
              <UserPlus className="h-4 w-4" />Nouvel Utilisateur
            </Button>
          </div>
        </div>

        {error && <Card><CardContent className="p-4 text-[#de5a6c]">{error}</CardContent></Card>}
        {success && <Card><CardContent className="p-4 text-green-700">{success}</CardContent></Card>}

        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card className="card-hover"><CardContent className="p-4 text-center"><p className="text-3xl font-bold text-gray-900">{users.length}</p><p className="text-sm text-gray-500">Total</p></CardContent></Card>
          {(['normal', 'psychologue', 'dir_village', 'responsable_save', 'dir_national'] as const).map((role) => (
            <Card key={role} className={`card-hover cursor-pointer rounded-xl ${roleFilter === role ? 'border-[#00abec] bg-[#e4f3fb]' : ''}`} onClick={() => setRoleFilter(roleFilter === role ? 'all' : role)}>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-gray-900">{usersByRole[role] || 0}</p>
                <p className="text-xs text-gray-500 truncate">{roleDisplayNames[role]}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-[#dcebf6] shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Rechercher par nom ou email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
              </div>
              <Select options={roleOptions} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="w-64" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#dcebf6] shadow-sm">
          <CardHeader><CardTitle>{loading ? 'Chargement...' : `${filteredUsers.length} utilisateur(s)`}</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Utilisateur</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Rôle</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Village</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Créé le</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {u.firstName[0]}{u.lastName?.[0] || ''}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{u.firstName} {u.lastName}</p>
                            <p className="text-sm text-gray-500 flex items-center gap-1"><Mail className="h-3 w-3" />{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4"><Badge className={getRoleBadgeColor(u.role)}>{roleDisplayNames[u.role]}</Badge></td>
                      <td className="py-3 px-4">
                        {u.village ? <div className="flex items-center gap-1 text-gray-600"><Building2 className="h-4 w-4" />{u.village}</div> : <span className="text-gray-400">-</span>}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-400">-</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            disabled={u.email === currentUser?.email || u.role === 'admin_it' || deletingId === u.id}
                            onClick={() => void handleDeleteUser(u.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Nouvel Utilisateur</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowAddModal(false)}><X className="h-5 w-5" /></Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><label className="text-sm font-medium text-gray-700">Prénom *</label><Input value={form.firstName} onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))} placeholder="Jean" /></div>
                  <div className="space-y-2"><label className="text-sm font-medium text-gray-700">Nom *</label><Input value={form.lastName} onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))} placeholder="Dupont" /></div>
                </div>

                <div className="space-y-2"><label className="text-sm font-medium text-gray-700">Email *</label><Input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="jean.dupont@sos.tn" /></div>
                <div className="space-y-2"><label className="text-sm font-medium text-gray-700">Mot de passe *</label><Input type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} placeholder="Minimum 8 caractères" /></div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Rôle *</label>
                  <Select options={createRoleOptions} value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as UserRole, villageId: '' }))} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Village {roleNeedsVillage ? '*' : ''}</label>
                  <Select
                    options={[
                      { value: '', label: roleNeedsVillage ? 'Sélectionner un village...' : 'Non applicable pour ce rôle' },
                      ...villages.map((v) => ({ value: v.id, label: v.name })),
                    ]}
                    value={form.villageId}
                    onChange={(e) => setForm((p) => ({ ...p, villageId: e.target.value }))}
                    disabled={!roleNeedsVillage}
                  />
                </div>

                <div className="space-y-2"><label className="text-sm font-medium text-gray-700">WhatsApp (optionnel)</label><Input value={form.whatsappNumber} onChange={(e) => setForm((p) => ({ ...p, whatsappNumber: e.target.value }))} placeholder="+216..." /></div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => setShowAddModal(false)}>Annuler</Button>
                  <Button className="bg-[#00abec] hover:bg-[#0095d0] rounded-xl" onClick={() => void handleCreateUser()} disabled={creating}>
                    <Check className="h-4 w-4" />Créer l'utilisateur
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
