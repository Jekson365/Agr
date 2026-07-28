import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import en from '@/locales/en.json';
import ka from '@/locales/ka.json';

export type Language = 'en' | 'ka';

type Dictionary = Record<string, unknown>;

const DICTIONARIES: Record<Language, Dictionary> = { en, ka };

const LANGUAGE_LABELS: Record<Language, string> = { en: 'EN', ka: 'ქა' };

const STORAGE_KEY = 'farm.language';

type LanguageContextValue = {
  language: Language;
  languageLabel: string;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

function resolve(dict: Dictionary, key: string): unknown {
  if (typeof key !== 'string') return undefined;
  return key.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object') {
      return (acc as Dictionary)[part];
    }
    return undefined;
  }, dict);
}

function readStoredLanguage(): Language {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === 'en' || stored === 'ka' ? stored : 'ka';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(readStoredLanguage);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo<LanguageContextValue>(() => {
    const dict = DICTIONARIES[language];
    const setLanguage = (next: Language) => {
      localStorage.setItem(STORAGE_KEY, next);
      setLanguageState(next);
    };
    return {
      language,
      languageLabel: LANGUAGE_LABELS[language],
      setLanguage,
      toggleLanguage: () => setLanguage(language === 'ka' ? 'en' : 'ka'),
      t: (key, params) => {
        const value = resolve(dict, key);
        if (typeof value !== 'string') return typeof key === 'string' ? key : '';
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
