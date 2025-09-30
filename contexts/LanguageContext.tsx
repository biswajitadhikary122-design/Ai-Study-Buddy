import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

export const SUPPORTED_LANGUAGES = {
  en: 'English',
  bn: 'বাংলা',
};

export type Language = keyof typeof SUPPORTED_LANGUAGES;

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, replacements?: { [key: string]: string | number }) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');
  const [translations, setTranslations] = useState<{ [key: string]: any } | null>(null);

  useEffect(() => {
    const storedLang = localStorage.getItem('app-lang') as Language | null;
    const browserLang = navigator.language.split('-')[0] as Language;
    const initialLang = storedLang || (SUPPORTED_LANGUAGES[browserLang] ? browserLang : 'en');
    setLanguage(initialLang);

    const loadTranslations = async () => {
        try {
            const translationPromises = Object.keys(SUPPORTED_LANGUAGES).map(lang =>
                fetch(`./locales/${lang}.json`).then(res => {
                    if (!res.ok) throw new Error(`Failed to load ${lang}.json`);
                    return res.json().then(data => ({ [lang]: data }));
                })
            );
            
            const loadedTranslationsArray = await Promise.all(translationPromises);
            const allTranslations = loadedTranslationsArray.reduce((acc, current) => ({ ...acc, ...current }), {});
            setTranslations(allTranslations);
            
        } catch (error) {
            console.error("Failed to load translations:", error);
            try {
                const enResponse = await fetch('./locales/en.json');
                const enData = await enResponse.json();
                setTranslations({ en: enData });
            } catch (e) {
                console.error("Failed to load fallback English translation:", e);
                setTranslations({ en: {} });
            }
        }
    };
    loadTranslations();
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    if (language === 'ar') {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }
  }, [language]);

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('app-lang', lang);
  };

  const t = useCallback((key: string, replacements?: { [key: string]: string | number }) => {
    if (!translations) {
        return key; // Fallback to key if translations are not loaded yet
    }
    let translation = translations[language]?.[key] || translations['en']?.[key] || key;
    if (replacements) {
        Object.keys(replacements).forEach(placeholder => {
            const value = replacements[placeholder];
            translation = translation.replace(new RegExp(`{{${placeholder}}}`, 'g'), String(value));
        });
    }
    return translation;
  }, [language, translations]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage: changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};