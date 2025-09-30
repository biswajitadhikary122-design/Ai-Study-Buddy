import React, { createContext, useState, useContext, useEffect } from 'react';

interface SettingsContextType {
  isVoiceControlEnabled: boolean;
  setIsVoiceControlEnabled: (enabled: boolean) => void;
  enableSmartSuggestions: boolean;
  setEnableSmartSuggestions: (enabled: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isVoiceControlEnabled, setIsVoiceControlEnabledState] = useState(false);
  const [enableSmartSuggestions, setEnableSmartSuggestionsState] = useState(true);

  useEffect(() => {
    const storedVoiceControl = localStorage.getItem('isVoiceControlEnabled');
    if (storedVoiceControl) {
      setIsVoiceControlEnabledState(JSON.parse(storedVoiceControl));
    }
    const storedSmartSuggestions = localStorage.getItem('enableSmartSuggestions');
    if (storedSmartSuggestions) {
      setEnableSmartSuggestionsState(JSON.parse(storedSmartSuggestions));
    }
  }, []);

  const setIsVoiceControlEnabled = (enabled: boolean) => {
    setIsVoiceControlEnabledState(enabled);
    localStorage.setItem('isVoiceControlEnabled', JSON.stringify(enabled));
  };

  const setEnableSmartSuggestions = (enabled: boolean) => {
    setEnableSmartSuggestionsState(enabled);
    localStorage.setItem('enableSmartSuggestions', JSON.stringify(enabled));
  };

  return (
    <SettingsContext.Provider value={{ 
        isVoiceControlEnabled,
        setIsVoiceControlEnabled,
        enableSmartSuggestions,
        setEnableSmartSuggestions
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};