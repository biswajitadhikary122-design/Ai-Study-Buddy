import React, { useState, useEffect } from 'react';
import { CloseIcon, UserIcon, CogIcon, SparklesIcon, LanguageIcon, YouTubeIcon, ArrowLeftIcon, NotebookIcon, PencilSquareIcon } from './icons/GeneralIcons';
import { useTranslation } from '../contexts/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';
import { useSettings } from '../contexts/SettingsContext';

interface SidebarMenuProps {
  isOpen: boolean;
  onClose: () => void;
  notificationCount: number;
  onNavigateToNotebook: () => void;
  onNavigateToStudio: () => void;
  onNavigateToYouTube: () => void;
}

const ToggleSwitch: React.FC<{
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}> = ({ label, description, checked, onChange }) => (
    <div className="flex items-center justify-between px-3 py-2">
      <div className="flex-grow">
        <label className="block text-sm font-medium text-gray-800 dark:text-white">{label}</label>
        <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors flex-shrink-0 ${checked ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'}`}
        role="switch"
        aria-checked={checked}
      >
        <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
);


const SidebarMenu: React.FC<SidebarMenuProps> = ({ isOpen, onClose, notificationCount, onNavigateToNotebook, onNavigateToStudio, onNavigateToYouTube }) => {
  const { t } = useTranslation();
  const { 
      isVoiceControlEnabled,
      setIsVoiceControlEnabled,
      enableSmartSuggestions,
      setEnableSmartSuggestions
  } = useSettings();
  const [view, setView] = useState<'main' | 'settings'>('main');

  useEffect(() => {
    if (!isOpen) {
      // Reset view to main when menu is closed, after animation
      const timer = setTimeout(() => setView('main'), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);
  
  const accountItems = [
    { nameKey: 'sidebarProfile', icon: UserIcon, action: () => { alert(t('featureComingSoon', { feature: t('sidebarProfile') })); onClose(); } },
    { nameKey: 'sidebarSettings', icon: CogIcon, action: () => setView('settings') },
    { nameKey: 'sidebarCreateBuddy', icon: SparklesIcon, action: () => { alert(t('featureComingSoon', { feature: t('sidebarCreateBuddy') })); onClose(); } },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 z-20 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />
      {/* Menu */}
      <div
        className={`fixed top-0 left-0 h-full w-72 max-w-[80vw] z-30 bg-glass-light dark:bg-glass-dark border-r border-border-light dark:border-border-dark shadow-2xl backdrop-blur-3xl transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex justify-between items-center p-4 border-b border-border-light dark:border-border-dark flex-shrink-0">
          <h2 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500">
            {t('sidebarMenuTitle')}
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/20 dark:hover:bg-black/20 transition-colors" aria-label={t('aria_closeMenu')}>
            <CloseIcon className="w-6 h-6 text-gray-800 dark:text-white" />
          </button>
        </div>
        <nav className="flex-grow relative overflow-y-auto no-scrollbar">
          {/* Main Menu Panel */}
          <div className={`absolute top-0 left-0 w-full h-full p-4 transition-transform duration-300 ease-in-out ${view === 'main' ? 'translate-x-0' : '-translate-x-full'}`}>
            <h3 className="px-3 pb-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('sidebarAccount')}</h3>
            <ul>
              {accountItems.map((item) => (
                <li key={item.nameKey}>
                  <a
                    href="#"
                    onClick={(e) => { e.preventDefault(); item.action(); }}
                    className="flex items-center gap-4 p-3 rounded-lg text-gray-800 dark:text-white hover:bg-white/50 dark:hover:bg-black/20 transition-colors duration-200"
                  >
                    <item.icon className="w-6 h-6" />
                    <span>{t(item.nameKey)}</span>
                  </a>
                </li>
              ))}
            </ul>
            <h3 className="px-3 pt-4 pb-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('sidebarTools')}</h3>
            <ul>
                 <li>
                    <a
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            onNavigateToStudio();
                        }}
                        className="flex items-center justify-between gap-4 p-3 rounded-lg text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        aria-label={t('aria_openStudio')}
                    >
                        <div className="flex items-center gap-4">
                            <PencilSquareIcon className="w-6 h-6" />
                            <span className="font-semibold">{t('sidebarStudio')}</span>
                        </div>
                        <span className="text-xs bg-white/30 text-white font-bold rounded-full px-2 py-0.5">{t('newTag')}</span>
                    </a>
                </li>
                 <li>
                    <a
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            onNavigateToYouTube();
                        }}
                        className="flex items-center gap-4 p-3 rounded-lg text-gray-800 dark:text-white hover:bg-white/50 dark:hover:bg-black/20 transition-colors duration-200"
                        aria-label={t('aria_openEducationHub')}
                    >
                        <YouTubeIcon className="w-6 h-6" />
                        <span>{t('sidebarEducationHub')}</span>
                    </a>
                </li>
                <li>
                    <a
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            onNavigateToNotebook();
                        }}
                        className="flex items-center gap-4 p-3 rounded-lg text-gray-800 dark:text-white hover:bg-white/50 dark:hover:bg-black/20 transition-colors duration-200"
                        aria-label={t('aria_openNotebook')}
                    >
                        <NotebookIcon className="w-6 h-6" />
                        <span>{t('sidebarNotebook')}</span>
                    </a>
                </li>
            </ul>
          </div>
          {/* Settings Panel */}
          <div className={`absolute top-0 left-0 w-full h-full p-4 transition-transform duration-300 ease-in-out space-y-4 ${view === 'settings' ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="flex items-center -mt-1">
                <button onClick={() => setView('main')} className="p-2 -ml-2 rounded-full hover:bg-white/20 dark:hover:bg-black/20 transition-colors" aria-label={t('sidebarBack')}>
                    <ArrowLeftIcon className="w-6 h-6 text-gray-800 dark:text-white" />
                </button>
                <h3 className="text-base font-bold text-gray-800 dark:text-white ml-2">{t('sidebarSettings')}</h3>
            </div>
            <div>
                <h3 className="px-3 pb-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('sidebarAIassistant')}</h3>
                <ToggleSwitch 
                    label={t('settingEnableSmartSuggestions')}
                    description={t('settingEnableSmartSuggestionsDesc')}
                    checked={enableSmartSuggestions}
                    onChange={setEnableSmartSuggestions}
                />
            </div>
             <div>
                <h3 className="px-3 pb-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('sidebarVoiceControl')}</h3>
                <ToggleSwitch 
                    label={t('settingEnableVoiceControl')}
                    description={t('settingEnableVoiceControlDesc')}
                    checked={isVoiceControlEnabled}
                    onChange={setIsVoiceControlEnabled}
                />
            </div>
          </div>
        </nav>
        <div className="p-4 border-t border-border-light dark:border-border-dark">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <LanguageIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm font-semibold text-gray-800 dark:text-white">{t('sidebarLanguage')}</span>
                </div>
                <LanguageSwitcher />
            </div>
        </div>
      </div>
    </>
  );
};

export default SidebarMenu;