import React, { useEffect, useCallback } from 'react';
import { debounce } from 'lodash';
import { XMarkIcon, DocumentDuplicateIcon, DocumentTextIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useTranslation } from '@/lib/i18n';

interface DraftManagerProps {
  formData: Record<string, any>;
  hasDraft: boolean;
  setHasDraft: (hasDraft: boolean) => void;
  discardDraft?: () => void;
  isFormEmpty: boolean;
}

/**
 * Manages draft saving, loading, and status display for forms
 * Extracted from AddTaskForm to improve component modularity and reusability
 */
export function DraftManager({ 
  formData, 
  hasDraft, 
  setHasDraft, 
  discardDraft,
  isFormEmpty
}: DraftManagerProps) {
  const { t } = useTranslation();
  const [draftStatus, setDraftStatus] = React.useState<'none' | 'saving' | 'saved'>('none');
  
  // Auto-save draft (debounced)
  const saveDraft = useCallback(
    debounce((data) => {
      localStorage.setItem('taskDraft', JSON.stringify(data));
      setDraftStatus('saved');
      setHasDraft(true);
      
      // Auto-hide the "saved" message after 3 seconds
      setTimeout(() => {
        setDraftStatus('none');
      }, 3000);
    }, 1000),
    [setHasDraft]
  );
  
  // Save draft whenever form data changes
  useEffect(() => {
    // Only save if there's actually content
    if (!isFormEmpty) {
      setDraftStatus('saving');
      saveDraft(formData);
    }
  }, [formData, saveDraft, isFormEmpty]);

  // Handle discard
  const handleDiscard = () => {
    if (discardDraft) {
      discardDraft();
    } else {
      localStorage.removeItem('taskDraft');
      setHasDraft(false);
    }
  };
  
  // Status indicator and draft controls
  if (!hasDraft && draftStatus === 'none') {
    return null;
  }
  
  return (
    <div className="flex items-center text-sm">
      <div className={`inline-flex items-center rounded-lg px-2.5 py-1 text-sm ${
        draftStatus === 'saving' 
          ? 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20'
          : 'text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/20'
      }`}>
        {draftStatus === 'saving' && (
          <>
            <ArrowPathIcon className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            Saving draft...
          </>
        )}
        {draftStatus === 'saved' && (
          <>
            <DocumentTextIcon className="h-3.5 w-3.5 mr-1.5" />
            Draft saved
          </>
        )}
        {draftStatus === 'none' && hasDraft && (
          <>
            <DocumentDuplicateIcon className="h-3.5 w-3.5 mr-1.5" />
            Draft available
          </>
        )}
      </div>
      
      {hasDraft && (
        <button
          type="button"
          onClick={handleDiscard}
          className="ml-2 rounded-lg p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300"
          aria-label="Discard draft"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      )}
    </div>
  );
} 