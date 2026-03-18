import React, { createContext, useState, useCallback, useMemo } from 'react';
import { Language } from '@/types';
import { translations } from '@/utils/localization';

interface LocalizationContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

export const LocalizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(Language.en);

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    let translation = translations[key]?.[language] || key;
    if (params) {
      Object.keys(params).forEach(pKey => {
        const regex = new RegExp(`{${pKey}}`, 'g');
        translation = translation.replace(regex, String(params[pKey]));
      });
    }
    return translation;
  }, [language]);

  const value = useMemo(() => ({
    language,
    setLanguage,
    t
  }), [language, t]);

  return (
    <LocalizationContext.Provider value={value}>
      {children}
    </LocalizationContext.Provider>
  );
};