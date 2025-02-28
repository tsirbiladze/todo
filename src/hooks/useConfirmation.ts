import { useState, useCallback } from 'react';
import { DialogType } from '@/components/ui/ConfirmationDialog';

type ConfirmationOptions = {
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  type?: DialogType;
};

type ConfirmationState = ConfirmationOptions & {
  isOpen: boolean;
  resolve: (value: boolean) => void;
  isLoading: boolean;
};

export function useConfirmation() {
  const [confirmationState, setConfirmationState] = useState<ConfirmationState | null>(null);

  const askConfirmation = useCallback(
    (options: ConfirmationOptions): Promise<boolean> => {
      return new Promise<boolean>((resolve) => {
        setConfirmationState({
          ...options,
          isOpen: true,
          resolve,
          isLoading: false,
        });
      });
    },
    []
  );

  const handleCancel = useCallback(() => {
    if (confirmationState) {
      confirmationState.resolve(false);
      setConfirmationState(null);
    }
  }, [confirmationState]);

  const handleConfirm = useCallback(async () => {
    if (confirmationState) {
      // Set loading state
      setConfirmationState({
        ...confirmationState,
        isLoading: true,
      });
      
      // Resolve with true
      confirmationState.resolve(true);
      
      // Close the dialog
      setConfirmationState(null);
    }
  }, [confirmationState]);

  return {
    confirmationState,
    askConfirmation,
    handleCancel,
    handleConfirm,
  };
} 