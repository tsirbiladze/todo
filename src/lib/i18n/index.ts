import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import enTranslations from './translations/en';
import esTranslations from './translations/es';
import frTranslations from './translations/fr';

// Available languages
export type Language = 'en' | 'es' | 'fr';

// Translation resources for each language
export const translations = {
  en: enTranslations,
  es: esTranslations,
  fr: frTranslations,
};

// Type for translation keys
type TranslationKey = keyof typeof enTranslations;

// Type for the i18n store
interface I18nStore {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  getLanguageName: (code: Language) => string;
  availableLanguages: Language[];
}

/**
 * Zustand store for managing internationalization
 * Persists language preference in localStorage
 */
export const useI18n = create<I18nStore>()(
  persist(
    (set, get) => ({
      // Default language is English
      language: 'en' as Language,
      
      // Available languages
      availableLanguages: ['en', 'es', 'fr'],
      
      // Set the current language
      setLanguage: (language: Language) => set({ language }),
      
      // Translate a key with optional parameters
      t: (key: TranslationKey, params?: Record<string, string | number>) => {
        const { language } = get();
        const translation = translations[language]?.[key] || translations.en[key] || key;
        
        // Replace parameters in the translation string
        if (params) {
          return Object.entries(params).reduce(
            (acc, [paramKey, paramValue]) => 
              acc.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(paramValue)),
            translation
          );
        }
        
        return translation;
      },
      
      // Get the language name
      getLanguageName: (code: Language) => {
        const languageNames = {
          en: 'English',
          es: 'Español',
          fr: 'Français',
        };
        
        return languageNames[code] || code;
      },
    }),
    {
      name: 'i18n-storage',
      partialize: (state) => ({ language: state.language }),
    }
  )
);

/**
 * React hook for using translations in components
 * @returns Translation function and language utilities
 */
export function useTranslation() {
  const { t, language, setLanguage, getLanguageName, availableLanguages } = useI18n();
  
  return {
    t,
    language,
    setLanguage,
    getLanguageName,
    availableLanguages,
  };
} 