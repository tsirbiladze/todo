import React, { memo } from 'react';
import { useTranslation, Language } from '@/lib/i18n';
import { GlobeAltIcon } from '@heroicons/react/24/outline';

/**
 * Language selector component with accessibility features
 * Allows users to switch between available languages
 */
function LanguageSelectorComponent() {
  const { language, setLanguage, getLanguageName, availableLanguages } = useTranslation();
  
  return (
    <div className="relative inline-block">
      <label htmlFor="language-select" className="sr-only">
        Select language
      </label>
      
      <div className="flex items-center gap-1.5">
        <GlobeAltIcon className="h-4 w-4 text-gray-500" aria-hidden="true" />
        
        <select
          id="language-select"
          value={language}
          onChange={(e) => setLanguage(e.target.value as Language)}
          className="form-select py-1 pl-2 pr-7 bg-transparent text-sm font-medium rounded-md border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 cursor-pointer"
          aria-label="Select language"
        >
          {availableLanguages.map((lang) => (
            <option key={lang} value={lang}>
              {getLanguageName(lang)}
            </option>
          ))}
        </select>
        
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
          <svg
            className="h-4 w-4 text-gray-500"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact version of the language selector for mobile/sidebar
 */
function CompactLanguageSelectorComponent() {
  const { language, setLanguage, availableLanguages } = useTranslation();
  
  return (
    <div className="flex gap-2 items-center">
      {availableLanguages.map((lang) => (
        <button
          key={lang}
          onClick={() => setLanguage(lang)}
          className={`px-2 py-1 text-xs font-medium rounded-md ${
            language === lang
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          aria-label={`Switch to ${lang} language`}
          aria-pressed={language === lang}
        >
          {lang.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

// Memoize components to prevent unnecessary re-renders
export const LanguageSelector = memo(LanguageSelectorComponent);
export const CompactLanguageSelector = memo(CompactLanguageSelectorComponent); 