import React, { createContext, useContext, ReactNode } from 'react';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { useConfirmation } from '@/hooks/useConfirmation';
import { DialogType } from '@/components/ui/ConfirmationDialog';

// Context type definition
interface ConfirmationContextType {
  confirm: (options: {
    title: string;
    message: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    type?: DialogType;
  }) => Promise<boolean>;
}

// Create context with a default value
const ConfirmationContext = createContext<ConfirmationContextType | undefined>(undefined);

// Provider component
export function ConfirmationProvider({ children }: { children: ReactNode }) {
  const {
    confirmationState,
    askConfirmation,
    handleCancel,
    handleConfirm,
  } = useConfirmation();

  return (
    <ConfirmationContext.Provider
      value={{
        confirm: askConfirmation,
      }}
    >
      {children}

      {confirmationState && (
        <ConfirmationDialog
          isOpen={confirmationState.isOpen}
          title={confirmationState.title}
          message={confirmationState.message}
          confirmText={confirmationState.confirmText}
          cancelText={confirmationState.cancelText}
          type={confirmationState.type}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          isLoading={confirmationState.isLoading}
        />
      )}
    </ConfirmationContext.Provider>
  );
}

// Custom hook to use the confirmation dialog
export function useConfirmationDialog() {
  const context = useContext(ConfirmationContext);
  
  if (context === undefined) {
    throw new Error('useConfirmationDialog must be used within a ConfirmationProvider');
  }
  
  return context;
} 