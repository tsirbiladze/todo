'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';

export default function ProfileRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the actual profile page
    router.push('/settings/profile');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <LoadingIndicator size="lg" text="Redirecting to profile..." />
      </div>
    </div>
  );
} 