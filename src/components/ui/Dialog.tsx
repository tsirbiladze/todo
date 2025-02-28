import React, { Fragment, memo, ReactNode } from 'react';
import { Dialog as HeadlessDialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from './Button';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeButton?: boolean;
}

/**
 * Accessible dialog component built with HeadlessUI
 * Supports different sizes, titles, descriptions, and custom content
 * Includes proper ARIA attributes and keyboard navigation
 */
function DialogComponent({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeButton = true,
}: DialogProps) {
  // Map size to max-width class
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full',
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <HeadlessDialog
        as="div"
        className="relative z-50"
        onClose={onClose}
        aria-labelledby="dialog-title"
        aria-describedby={description ? "dialog-description" : undefined}
      >
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25" aria-hidden="true" />
        </Transition.Child>

        {/* Full-screen container for centering the panel */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            {/* Dialog panel with animation */}
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <HeadlessDialog.Panel 
                className={`w-full ${sizeClasses[size]} transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all`}
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <HeadlessDialog.Title
                    id="dialog-title"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    {title}
                  </HeadlessDialog.Title>
                  
                  {closeButton && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={onClose}
                      aria-label="Close dialog"
                      className="h-8 w-8 rounded-full"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </Button>
                  )}
                </div>

                {/* Description */}
                {description && (
                  <div className="mt-2">
                    <p id="dialog-description" className="text-sm text-gray-500">
                      {description}
                    </p>
                  </div>
                )}

                {/* Content */}
                {children && <div className="mt-4">{children}</div>}

                {/* Footer */}
                {footer && <div className="mt-6">{footer}</div>}
              </HeadlessDialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </HeadlessDialog>
    </Transition>
  );
}

/**
 * Confirmation dialog with standard actions (confirm/cancel)
 */
interface ConfirmDialogProps extends Omit<DialogProps, 'footer' | 'children'> {
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  confirmVariant?: 'primary' | 'danger';
  isConfirmLoading?: boolean;
}

function ConfirmDialogComponent({
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  confirmVariant = 'primary',
  isConfirmLoading = false,
  ...props
}: ConfirmDialogProps) {
  const footer = (
    <div className="flex justify-end space-x-2">
      <Button variant="secondary" onClick={props.onClose}>
        {cancelLabel}
      </Button>
      <Button 
        variant={confirmVariant} 
        onClick={onConfirm}
        isLoading={isConfirmLoading}
      >
        {confirmLabel}
      </Button>
    </div>
  );

  return <Dialog {...props} footer={footer} />;
}

// Memoize the components to prevent unnecessary re-renders
export const Dialog = memo(DialogComponent);
export const ConfirmDialog = memo(ConfirmDialogComponent); 