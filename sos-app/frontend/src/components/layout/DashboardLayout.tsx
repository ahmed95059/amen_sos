'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#eef3f7]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-[#00abec]" />
          <p className="text-[#5f7290]">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#eef3f7]">
      <Sidebar />
      <main className="lg:pl-72">
        <div className="min-h-screen">
          <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-[#d8e6f2]">
            <div className="mx-auto w-full max-w-[1400px] px-4 py-3 lg:px-8">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="rounded-xl bg-white px-3 py-2 shadow-sm border border-[#e4edf5]">
                    <Image
                      src="/sos-logo.png"
                      alt="SOS Villages d'Enfants"
                      width={150}
                      height={44}
                      className="h-auto w-[150px]"
                    />
                  </div>
                  <nav className="hidden lg:flex items-center gap-6 text-sm text-[#5f7290]">
                    <span className="hover:text-[#00abec] cursor-pointer">Nous connaitre</span>
                    <span className="hover:text-[#00abec] cursor-pointer">Actions en Tunisie</span>
                    <span className="hover:text-[#00abec] cursor-pointer">Actualites</span>
                  </nav>
                </div>
                <div className="flex items-center gap-3">
                  <button className="hidden sm:inline-flex h-9 items-center rounded-full bg-[#00abec] px-4 text-sm font-semibold text-white shadow-md shadow-[#00abec]/30 hover:bg-[#0096d2]">
                    Rejoignez-nous
                  </button>
                  <button className="h-9 px-4 rounded-full bg-[#de5a6c] text-white text-sm font-semibold shadow-md shadow-[#de5a6c]/25 hover:bg-[#c94b5f]">
                    Faire un don
                  </button>
                </div>
              </div>
            </div>
          </header>
          <div className="mx-auto w-full max-w-[1400px] p-4 lg:p-8 pt-6">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
