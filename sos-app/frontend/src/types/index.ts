// User roles in the system (strict RBAC as per specifications)
export type UserRole = 
  | 'normal'              // mère, tante, educateur, chauffeur
  | 'psychologue'         // Psychologist
  | 'dir_village'         // Village Director
  | 'responsable_save'    // Responsable Sauvegarde (Protection Officer)
  | 'dir_national'        // National Director
  | 'admin_it';           // IT Administrator (technical admin, no case access)

// Sensitive content access levels
export type SensitiveContentAccess = 'none' | 'limited' | 'full_assigned' | 'full';

// User interface
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  village?: string;
  avatarUrl?: string;
  createdAt: Date;
}

// Ticket statuses
export type TicketStatus = 
  | 'open'
  | 'in_progress'
  | 'pending_approval'
  | 'approved'
  | 'closed';

// Ticket priority
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

// Ticket interface
export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdBy: string;
  createdByName: string;
  assignedTo?: string;
  assignedToName?: string;
  village: string;
  latitude?: number;
  longitude?: number;
  createdAt: Date;
  updatedAt: Date;
  isSensitive: boolean;
}

// Report interface
export interface Report {
  id: string;
  ticketId: string;
  title: string;
  content: string;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
}

// Action Plan interface
export interface ActionPlan {
  id: string;
  ticketId: string;
  title: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  createdBy: string;
  approvedBy?: string;
  createdAt: Date;
  approvedAt?: Date;
}

// Permission check type
export interface Permissions {
  // Core permissions
  canCreateProfileSignature: boolean;    // Create personal signature (for auth)
  canCreateTicket: boolean;               // Create signalement/ticket
  canViewOwnTicket: boolean;              // View own tickets
  canViewVillageCases: boolean;           // View village cases
  canViewAllVillagesCases: boolean;       // Responsable Sauvegarde unique permission
  canWriteReports: boolean;               // Write fiche/DPE/reports
  canViewReports: boolean;                // View reports
  canViewFileAndDPE: boolean;             // View fiche & rapport DPE
  canApproveActionPlan: boolean;          // Approve action plans (electronic signature)
  canCloseCase: boolean;                  // Close case
  canViewNationalAnalytics: boolean;      // Access national analytics  
  canManageUsers: boolean;                // Manage users (admin_it only)
  canReceiveNotifications: boolean;       // Receive notifications
  sensitiveContentAccess: SensitiveContentAccess;
}

// Get permissions based on role (STRICT RBAC implementation)
export function getPermissions(role: UserRole): Permissions {
  const permissionsMap: Record<UserRole, Permissions> = {
    // A) NORMAL (mère, tante, éducateur, chauffeur)
    normal: {
      canCreateProfileSignature: true,    // ✅ Create personal signature
      canCreateTicket: true,              // ✅ Create ticket
      canViewOwnTicket: true,             // ✅ View own tickets only
      canViewVillageCases: false,         // ❌ Cannot see village cases
      canViewAllVillagesCases: false,
      canWriteReports: false,             // ❌ Cannot write reports
      canViewReports: false,              // ❌ Cannot read reports
      canViewFileAndDPE: false,           // ❌ Cannot view fiche/DPE
      canApproveActionPlan: false,        // ❌ Cannot approve
      canCloseCase: false,                // ❌ Cannot close
      canViewNationalAnalytics: false,    // ❌ Cannot view analytics
      canManageUsers: false,              // ❌ Cannot manage users
      canReceiveNotifications: true,      // ✅ Receive notifications (ex: ticket closed)
      sensitiveContentAccess: 'none',
    },

    // B) PSYCHOLOGUE
    psychologue: {
      canCreateProfileSignature: true,
      canCreateTicket: true,              // ✅ Can create tickets
      canViewOwnTicket: true,
      canViewVillageCases: true,          // ✅ View village cases (assigned ones)
      canViewAllVillagesCases: false,
      canWriteReports: true,              // ✅ Write fiche, DPE, reports
      canViewReports: true,               // ✅ View reports
      canViewFileAndDPE: true,            // ✅ View fiche & DPE
      canApproveActionPlan: false,        // ❌ Cannot approve (cannot sign)
      canCloseCase: false,                // ❌ Cannot close alone - needs village director + responsable save signatures
      canViewNationalAnalytics: false,    // ❌ Cannot view national analytics
      canManageUsers: false,              // ❌ Cannot manage users
      canReceiveNotifications: true,      // ✅ Receive notifications
      sensitiveContentAccess: 'full_assigned', // ✅ Full on assigned cases only
    },

    // C) DIRECTEUR VILLAGE
    dir_village: {
      canCreateProfileSignature: true,
      canCreateTicket: true,
      canViewOwnTicket: true,
      canViewVillageCases: true,          // ✅ View village cases
      canViewAllVillagesCases: false,
      canWriteReports: false,             // ❌ Cannot write reports (per spec)
      canViewReports: true,               // ✅ Can view reports
      canViewFileAndDPE: true,            // ✅ View fiche & DPE
      canApproveActionPlan: true,         // ✅ Can sign electronically (validation)
      canCloseCase: false,                // ❌ Cannot close alone - needs psychologist + responsable save signatures
      canViewNationalAnalytics: false,    // ❌ Cannot view national analytics
      canManageUsers: false,              // ❌ Cannot manage users
      canReceiveNotifications: true,      // ✅ Receive notifications
      sensitiveContentAccess: 'limited',  // ⚠️ Limited (blurry) - sees critical info but PII/details masked
    },

    // D) RESPONSABLE SAUVEGARDE (NEW ROLE - Protection Officer)
    responsable_save: {
      canCreateProfileSignature: true,
      canCreateTicket: true,
      canViewOwnTicket: true,
      canViewVillageCases: true,          // ✅ View village cases
      canViewAllVillagesCases: true,      // ✅ UNIQUE - View ALL villages cases (global access)
      canWriteReports: false,             // ❌ Cannot write reports
      canViewReports: true,               // ✅ Can view reports
      canViewFileAndDPE: true,            // ✅ View fiche & DPE
      canApproveActionPlan: true,         // ✅ Can sign electronically (validation)
      canCloseCase: false,                // ❌ Cannot close alone
      canViewNationalAnalytics: false,    // ❌ Cannot view analytics
      canManageUsers: false,              // ❌ Cannot manage users
      canReceiveNotifications: true,      // ✅ Receive notifications
      sensitiveContentAccess: 'none',     // ❌ No access to sensitive content (validation role)
    },

    // E) ADMIN IT (Technical admin ONLY - security best practice)
    admin_it: {
      canCreateProfileSignature: true,
      canCreateTicket: false,             // ❌ Cannot create tickets
      canViewOwnTicket: false,            // ❌ Cannot view cases
      canViewVillageCases: false,         // ❌ Cannot view cases
      canViewAllVillagesCases: false,
      canWriteReports: false,             // ❌ Cannot write reports
      canViewReports: false,              // ❌ Cannot view reports
      canViewFileAndDPE: false,           // ❌ Cannot view fiche/DPE
      canApproveActionPlan: false,        // ❌ Cannot approve
      canCloseCase: false,                // ❌ Cannot close
      canViewNationalAnalytics: false,    // ❌ Cannot view analytics (technical admin only)
      canManageUsers: true,               // ✅ ONLY permission: Manage users (technical)
      canReceiveNotifications: false,
      sensitiveContentAccess: 'none',     // ❌ No access to sensitive content
    },

    // F) DIRECTEUR NATIONAL (Analytics only)
    dir_national: {
      canCreateProfileSignature: true,
      canCreateTicket: false,             // ❌ Cannot create tickets
      canViewOwnTicket: false,            // ❌ Cannot view cases
      canViewVillageCases: false,         // ❌ Cannot view village cases
      canViewAllVillagesCases: false,
      canWriteReports: false,             // ❌ Cannot write reports
      canViewReports: false,              // ❌ Cannot view reports
      canViewFileAndDPE: false,           // ❌ Cannot view fiche/DPE
      canApproveActionPlan: false,        // ❌ Cannot approve
      canCloseCase: false,                // ❌ Cannot close
      canViewNationalAnalytics: true,     // ✅ ONLY permission: National analytics (aggregated, no case access)
      canManageUsers: false,              // ❌ Cannot manage users
      canReceiveNotifications: false,
      sensitiveContentAccess: 'none',     // ❌ No access to sensitive content
    },
  };

  return permissionsMap[role];
}

// Role display names (French labels for UI)
export const roleDisplayNames: Record<UserRole, string> = {
  normal: 'Personnel (Éducateur/Mère)',
  psychologue: 'Psychologue',
  dir_village: 'Directeur Village',
  responsable_save: 'Responsable Sauvegarde',
  dir_national: 'Directeur National',
  admin_it: 'Administrateur IT',
};

// Status display names and colors
export const statusConfig: Record<TicketStatus, { label: string; color: string }> = {
  open: { label: 'Ouvert', color: 'bg-blue-100 text-blue-800' },
  in_progress: { label: 'En cours', color: 'bg-yellow-100 text-yellow-800' },
  pending_approval: { label: 'En attente d\'approbation', color: 'bg-orange-100 text-orange-800' },
  approved: { label: 'Approuvé', color: 'bg-green-100 text-green-800' },
  closed: { label: 'Fermé', color: 'bg-gray-100 text-gray-800' },
};

// Priority display names and colors
export const priorityConfig: Record<TicketPriority, { label: string; color: string }> = {
  low: { label: 'Faible', color: 'bg-gray-100 text-gray-800' },
  medium: { label: 'Moyen', color: 'bg-blue-100 text-blue-800' },
  high: { label: 'Élevé', color: 'bg-orange-100 text-orange-800' },
  urgent: { label: 'Urgent', color: 'sos-red-light-50' },
};
