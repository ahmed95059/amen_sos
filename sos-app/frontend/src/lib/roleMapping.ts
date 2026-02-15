// Role mapping between backend and frontend

import { UserRole } from '@/types';
import { BackendRole, BackendUser, BackendUrgency, BackendReportStatus } from './api';
import { User } from '@/types';

// Map backend roles to frontend roles
export function mapBackendRole(backendRole: BackendRole): UserRole {
  const roleMapping: Record<BackendRole, UserRole> = {
    DECLARANT: 'normal',
    PSYCHOLOGUE: 'psychologue',
    RESPONSABLE_SOCIAL: 'psychologue', // Maps to similar permissions
    SAFEGUARDING: 'psychologue', // Has elevated access to sensitive content
    DIRECTEUR_VILLAGE: 'dir_village',
    NATIONAL: 'dir_national',
    ADMIN_IT: 'admin_it',
  };
  
  return roleMapping[backendRole] || 'normal';
}

// Map frontend roles to backend roles (for API calls)
export function mapFrontendRole(frontendRole: UserRole): BackendRole {
  const roleMapping: Record<UserRole, BackendRole> = {
    normal: 'DECLARANT',
    psychologue: 'PSYCHOLOGUE',
    dir_village: 'DIRECTEUR_VILLAGE',
    responsable_save: 'SAFEGUARDING',
    dir_national: 'NATIONAL',
    admin_it: 'ADMIN_IT',
  };
  
  return roleMapping[frontendRole];
}

// Convert backend user to frontend user format
export function mapBackendUserToFrontend(backendUser: BackendUser): User {
  // Split full_name into firstName and lastName
  const nameParts = backendUser.full_name.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  return {
    id: String(backendUser.id),
    email: backendUser.email,
    firstName,
    lastName,
    role: mapBackendRole(backendUser.role),
    village: backendUser.village_id ? `Village ${backendUser.village_id}` : undefined,
    createdAt: new Date(), // Backend doesn't provide this in basic user response
  };
}

// Frontend priority type
export type FrontendPriority = 'low' | 'medium' | 'high' | 'urgent';

export function mapBackendUrgencyToFrontend(urgency: BackendUrgency): FrontendPriority {
  const mapping: Record<BackendUrgency, FrontendPriority> = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'urgent',
  };
  return mapping[urgency];
}

export function mapFrontendPriorityToBackend(priority: FrontendPriority): BackendUrgency {
  const mapping: Record<FrontendPriority, BackendUrgency> = {
    low: 'LOW',
    medium: 'MEDIUM',
    high: 'HIGH',
    urgent: 'CRITICAL',
  };
  return mapping[priority];
}

// Frontend ticket status type
export type FrontendTicketStatus = 'open' | 'in_progress' | 'pending_approval' | 'approved' | 'closed';

export function mapBackendStatusToFrontend(status: BackendReportStatus): FrontendTicketStatus {
  const mapping: Record<BackendReportStatus, FrontendTicketStatus> = {
    SUBMITTED: 'open',
    TRIAGED: 'in_progress',
    ASSIGNED: 'in_progress',
    IN_ASSESSMENT: 'in_progress',
    AWAITING_VILLAGE_DECISION: 'pending_approval',
    FOLLOW_UP: 'in_progress',
    AWAITING_NATIONAL_REVIEW: 'pending_approval',
    CLOSED: 'closed',
  };
  return mapping[status];
}

export function mapFrontendStatusToBackend(status: FrontendTicketStatus): BackendReportStatus {
  const mapping: Record<FrontendTicketStatus, BackendReportStatus> = {
    open: 'SUBMITTED',
    in_progress: 'IN_ASSESSMENT',
    pending_approval: 'AWAITING_VILLAGE_DECISION',
    approved: 'FOLLOW_UP',
    closed: 'CLOSED',
  };
  return mapping[status];
}

// Get role display name
export function getRoleDisplayName(role: UserRole | BackendRole): string {
  const displayNames: Record<string, string> = {
    // Frontend roles
    normal: 'Déclarant',
    psychologue: 'Psychologue',
    dir_village: 'Directeur Village',
    dir_national: 'Directeur National',
    admin_it: 'Administrateur IT',
    // Backend roles
    DECLARANT: 'Déclarant',
    PSYCHOLOGUE: 'Psychologue',
    RESPONSABLE_SOCIAL: 'Responsable Social',
    SAFEGUARDING: 'Safeguarding',
    DIRECTEUR_VILLAGE: 'Directeur Village',
    NATIONAL: 'Directeur National',
    ADMIN_IT: 'Administrateur IT',
  };
  
  return displayNames[role] || role;
}
