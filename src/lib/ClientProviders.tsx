"use client";

import React, { ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';
import { UserProvider } from '@/lib/auth/UserContext';
import { ThemeProvider } from '@/lib/theme/ThemeProvider';
import { ConfirmationProvider } from '@/providers/ConfirmationProvider';

interface ClientProvidersProps {
  children: ReactNode;
}

/**
 * ClientProviders component that groups all client-side providers together.
 * This is used in the app layout to avoid "use client" directive issues when
 * using context providers within server components.
 */
export default function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <SessionProvider>
      <UserProvider>
        <ThemeProvider>
          <ConfirmationProvider>
            {children}
          </ConfirmationProvider>
        </ThemeProvider>
      </UserProvider>
    </SessionProvider>
  );
} 