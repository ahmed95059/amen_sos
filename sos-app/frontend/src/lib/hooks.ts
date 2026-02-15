// Custom hooks for data fetching - supports both mock and real API modes

import { useState, useEffect, useCallback } from 'react';
import { Ticket, Report } from '@/types';
import { mockTickets, mockReports, mockActionPlans } from '@/data/mockData';
import { 
  reportsApi, 
  notificationsApi,
  BackendReportOut,
  BackendNotification,
} from './api';
import {
  mapBackendUrgencyToFrontend,
  mapBackendStatusToFrontend,
} from './roleMapping';

// Check if using mock data
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

// ==================== TICKETS/REPORTS HOOKS ====================

interface UseTicketsResult {
  tickets: Ticket[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Transform backend report to frontend ticket format
function transformReportToTicket(report: BackendReportOut): Ticket {
  return {
    id: `TKT-${report.id.toString().padStart(3, '0')}`,
    title: `${report.incident_type} - ${report.child_pseudo_code}`,
    description: report.public_status,
    status: mapBackendStatusToFrontend(report.status),
    priority: mapBackendUrgencyToFrontend(report.urgency),
    createdBy: report.created_by?.toString() || 'anonymous',
    createdByName: report.is_anonymous ? 'Anonyme' : `Utilisateur ${report.created_by}`,
    village: `Village ${report.village_id}`,
    createdAt: new Date(report.created_at),
    updatedAt: new Date(report.created_at),
    isSensitive: true,
  };
}

export function useTickets(): UseTicketsResult {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    if (USE_MOCK_DATA) {
      // Mock mode
      await new Promise(resolve => setTimeout(resolve, 500));
      setTickets(mockTickets);
      setIsLoading(false);
      return;
    }

    // Real API mode
    try {
      const reports = await reportsApi.list();
      const transformedTickets = reports.map(transformReportToTicket);
      setTickets(transformedTickets);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tickets');
      // Fallback to mock data if API fails
      setTickets(mockTickets);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  return { tickets, isLoading, error, refetch: fetchTickets };
}

// ==================== SINGLE TICKET HOOK ====================

interface UseTicketResult {
  ticket: Ticket | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useTicket(id: string): UseTicketResult {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTicket = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 300));
      const found = mockTickets.find(t => t.id === id);
      setTicket(found || null);
      setIsLoading(false);
      return;
    }

    // Extract numeric ID from TKT-XXX format
    const numericId = parseInt(id.replace('TKT-', ''));
    if (isNaN(numericId)) {
      setError('Invalid ticket ID');
      setIsLoading(false);
      return;
    }

    try {
      const report = await reportsApi.get(numericId);
      setTicket(transformReportToTicket(report));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch ticket');
      // Fallback to mock
      const found = mockTickets.find(t => t.id === id);
      setTicket(found || null);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

  return { ticket, isLoading, error, refetch: fetchTicket };
}

// ==================== REPORTS HOOK ====================

interface UseReportsResult {
  reports: Report[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useReports(ticketId?: string): UseReportsResult {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 300));
      const filtered = ticketId 
        ? mockReports.filter(r => r.ticketId === ticketId)
        : mockReports;
      setReports(filtered);
      setIsLoading(false);
      return;
    }

    // Real API: Reports are fetched with ticket details
    // For now, use mock as the backend structure is different
    const filtered = ticketId 
      ? mockReports.filter(r => r.ticketId === ticketId)
      : mockReports;
    setReports(filtered);
    setIsLoading(false);
  }, [ticketId]);

  useEffect(() => {
    void (async () => {
      await fetchReports();
    })();
  }, [fetchReports]);

  return { reports, isLoading, error, refetch: fetchReports };
}

// ==================== NOTIFICATIONS HOOK ====================

interface Notification {
  id: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  payload?: Record<string, unknown>;
}

interface UseNotificationsResult {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  markAsRead: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

function transformBackendNotification(notif: BackendNotification): Notification {
  return {
    id: notif.id.toString(),
    type: notif.notif_type,
    message: getNotificationMessage(notif.notif_type, notif.payload),
    isRead: notif.is_read,
    createdAt: new Date(notif.created_at),
    payload: notif.payload,
  };
}

function getNotificationMessage(type: string, payload: Record<string, unknown>): string {
  const messages: Record<string, string> = {
    NEW_REPORT: `Nouveau signalement #${payload.report_id}`,
    REPORT_ASSIGNED: `Signalement #${payload.report_id} vous a été assigné`,
    STATUS_CHANGED: `Le statut du signalement #${payload.report_id} a changé`,
    SLA_WARNING: `Attention: SLA proche pour le signalement #${payload.report_id}`,
    SLA_BREACH: `SLA dépassé pour le signalement #${payload.report_id}`,
  };
  return messages[type] || `Notification: ${type}`;
}

// Mock notifications for demo
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'NEW_REPORT',
    message: 'Nouveau signalement créé',
    isRead: false,
    createdAt: new Date(),
  },
  {
    id: '2',
    type: 'STATUS_CHANGED',
    message: 'Un signalement a été mis à jour',
    isRead: true,
    createdAt: new Date(Date.now() - 3600000),
  },
];

export function useNotifications(): UseNotificationsResult {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 300));
      setNotifications(mockNotifications);
      setIsLoading(false);
      return;
    }

    try {
      const backendNotifs = await notificationsApi.list();
      setNotifications(backendNotifs.map(transformBackendNotification));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
      setNotifications(mockNotifications);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    if (USE_MOCK_DATA) {
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
      return;
    }

    try {
      await notificationsApi.markAsRead(parseInt(id));
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return { notifications, unreadCount, isLoading, error, markAsRead, refetch: fetchNotifications };
}

// ==================== ACTION PLANS HOOK ====================

import { ActionPlan } from '@/types';

interface UseActionPlansResult {
  actionPlans: ActionPlan[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useActionPlans(ticketId?: string): UseActionPlansResult {
  const [actionPlans, setActionPlans] = useState<ActionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActionPlans = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    // For now, use mock data as backend integration for action plans
    // would require additional endpoint mapping
    await new Promise(resolve => setTimeout(resolve, 300));
    const filtered = ticketId 
      ? mockActionPlans.filter(ap => ap.ticketId === ticketId)
      : mockActionPlans;
    setActionPlans(filtered);
    setIsLoading(false);
  }, [ticketId]);

  useEffect(() => {
    void (async () => {
      await fetchActionPlans();
    })();
  }, [fetchActionPlans]);

  return { actionPlans, isLoading, error, refetch: fetchActionPlans };
}

// ==================== CREATE REPORT HOOK ====================

interface CreateReportInput {
  programName: string;
  abuserFirstName: string;
  abuserLastName: string;
  childFirstName: string;
  childLastName: string;
  incidentType: string;
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  description: string;
  isAnonymous?: boolean;
}

interface UseCreateReportResult {
  createReport: (data: CreateReportInput) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
}

export function useCreateReport(): UseCreateReportResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createReport = useCallback(async (data: CreateReportInput): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsLoading(false);
      return true;
    }

    const urgencyMap: Record<string, 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'> = {
      low: 'LOW',
      medium: 'MEDIUM',
      high: 'HIGH',
      urgent: 'CRITICAL',
    };

    try {
      await reportsApi.create({
        program_name: data.programName,
        abuser_first_name: data.abuserFirstName,
        abuser_last_name: data.abuserLastName,
        child_first_name: data.childFirstName,
        child_last_name: data.childLastName,
        incident_type: data.incidentType,
        urgency: urgencyMap[data.urgency],
        description: data.description,
        is_anonymous: data.isAnonymous || false,
      });
      setIsLoading(false);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create report');
      setIsLoading(false);
      return false;
    }
  }, []);

  return { createReport, isLoading, error };
}
