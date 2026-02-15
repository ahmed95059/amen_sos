"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Ticket, 
  FileText, 
  CheckSquare, 
  BarChart3, 
  Users, 
  Settings,
  LogOut,
  Heart,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';
import Image from 'next/image';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  permission?: keyof ReturnType<typeof import('@/types').getPermissions>;
}

export function Sidebar() {
  const pathname = usePathname();
  const { user, permissions, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const navItems: NavItem[] = [
    {
      href: '/dashboard',
      label: 'Tableau de bord',
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      href: '/tickets',
      label: 'Mes Tickets',
      icon: <Ticket className="h-5 w-5" />,
      permission: 'canViewOwnTicket',
    },
    {
      href: '/tickets/create',
      label: 'Creer un Ticket',
      icon: <FileText className="h-5 w-5" />,
      permission: 'canCreateTicket',
    },
    {
      href: '/cases',
      label: 'Cas du Village',
      icon: <Heart className="h-5 w-5" />,
      permission: 'canViewVillageCases',
    },
    {
      href: '/reports',
      label: 'Rapports',
      icon: <FileText className="h-5 w-5" />,
      permission: 'canWriteReports',
    },
    {
      href: '/approvals',
      label: 'Approbations',
      icon: <CheckSquare className="h-5 w-5" />,
      permission: 'canApproveActionPlan',
    },
    {
      href: '/analytics',
      label: 'Analytique nationale',
      icon: <BarChart3 className="h-5 w-5" />,
      permission: 'canViewNationalAnalytics',
    },
    {
      href: '/users',
      label: 'Gestion Utilisateurs',
      icon: <Users className="h-5 w-5" />,
      permission: 'canManageUsers',
    },
  ];

  const filteredNavItems = navItems.filter(item => {
    if (!item.permission) return true;
    // UX requirement: psychologue works through "Cas du Village" and "Rapports",
    // not via "Mes Tickets" / "Créer un Ticket".
    if (user?.role === 'psychologue' && (item.href === '/tickets' || item.href === '/tickets/create')) {
      return false;
    }
    // UX requirement: directeur works only through "Approbations".
    if (
      user?.role === 'dir_village' &&
      (item.href === '/dashboard' || item.href === '/tickets' || item.href === '/tickets/create' || item.href === '/cases')
    ) {
      return false;
    }
    // UX requirement: responsable sauvegarde works through "Approbations" only.
    if (
      user?.role === 'responsable_save' &&
      (item.href === '/dashboard' || item.href === '/tickets' || item.href === '/tickets/create' || item.href === '/cases' || item.href === '/reports')
    ) {
      return false;
    }
    return permissions?.[item.permission];
  });

  const NavContent = () => (
    <>
      <div className="flex items-center gap-3 px-5 py-6 border-b border-white/20">
        <div className="rounded-xl bg-white px-3 py-2 shadow-sm">
          <Image
            src="/sos-logo.png"
            alt="SOS Villages d'Enfants"
            width={170}
            height={50}
            className="h-auto w-[170px]"
            priority
          />
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {filteredNavItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-white/15 text-white'
                  : 'text-white/90 hover:bg-white/10'
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/20 p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
            <span className="text-[#00abec] font-semibold text-sm">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-white/75 truncate">
              {user?.role === 'normal' && 'Personnel'}
              {user?.role === 'psychologue' && 'Psychologue'}
              {user?.role === 'dir_village' && 'Dir. Village'}
              {user?.role === 'responsable_save' && 'Resp. Sauvegarde'}
              {user?.role === 'admin_it' && 'Admin IT'}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Link
            href="/settings"
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <Settings className="h-4 w-4" />
            <span>Parametres</span>
          </Link>
          <button
            onClick={logout}
            className="flex items-center justify-center gap-2 px-3 py-2 text-sm text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-[#00abec] text-white rounded-lg shadow-md"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={cn(
          'lg:hidden fixed inset-y-0 left-0 z-40 w-72 bg-[#00abec] flex flex-col transform transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <NavContent />
      </aside>

      <aside className="hidden lg:flex lg:flex-col lg:w-72 lg:bg-[#00abec] lg:fixed lg:inset-y-0">
        <NavContent />
      </aside>
    </>
  );
}
