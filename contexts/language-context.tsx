import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import en from '@/locales/en.json';
import ka from '@/locales/ka.json';

export type Language = 'en' | 'ka';

type Dictionary = Record<string, unknown>;

const DICTIONARIES: Record<Language, Dictionary> = { en, ka };

const LANGUAGE_LABELS: Record<Language, string> = { en: 'EN', ka: 'ქა' };

type LanguageContextValue = {
  language: Language;
  languageLabel: string;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

function resolve(dict: Dictionary, key: string): unknown {
  return key.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object') {
      return (acc as Dictionary)[part];
    }
    return undefined;
  }, dict);
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('ka');

  const value = useMemo<LanguageContextValue>(() => {
    const dict = DICTIONARIES[language];
    return {
      language,
      languageLabel: LANGUAGE_LABELS[language],
      setLanguage,
      toggleLanguage: () => setLanguage((prev) => (prev === 'ka' ? 'en' : 'ka')),
      t: (key, params) => {
        const value = resolve(dict, key);
        if (typeof value !== 'string') return key;
        if (!params) return value;
        return value.replace(/\{(\w+)\}/g, (_, token) => String(params[token] ?? ''));
      },
    };
  }, [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
