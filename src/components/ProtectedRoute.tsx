
'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { Skeleton } from './ui/skeleton';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
          <header className="bg-card border-b shadow-sm sticky top-0 z-40">
            <div className="container mx-auto flex items-center justify-between h-16 px-4 md:px-8">
                  <Skeleton className="h-8 w-32" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-28" />
                  </div>
            </div>
          </header>
          <div className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row gap-8">
                <aside className="w-full md:w-[340px] flex-shrink-0 space-y-8">
                    <Skeleton className="h-96 w-full" />
                    <Skeleton className="h-64 w-full" />
                </aside>
                <main className="flex-grow">
                      <Skeleton className="h-full w-full" />
                </main>
            </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
