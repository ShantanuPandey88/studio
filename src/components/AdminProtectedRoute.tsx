
'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { Skeleton } from './ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

export default function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, claims, isLoading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (!claims?.admin) {
        router.push('/');
      }
    }
  }, [user, claims, isLoading, router]);
  
  if (isLoading || !user || !claims?.admin) {
     return (
        <div className="flex min-h-screen flex-col bg-muted/40 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-6">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-10 w-24" />
            </div>
            <Skeleton className="h-12 w-full mb-4" />
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-4 w-2/3" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-64 w-full" />
                </CardContent>
            </Card>
        </div>
    );
  }

  return <>{children}</>;
}
