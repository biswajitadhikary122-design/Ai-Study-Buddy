import React from 'react';
import { SunIcon, MoonIcon, HamburgerIcon } from './icons/GeneralIcons';
import { useTranslation } from '../contexts/LanguageContext';

interface HeaderProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ theme, toggleTheme, onMenuClick }) => {
  const { t } = useTranslation();
  return (
    <header className="fixed top-0 left-0 right-0 z-10 bg-glass-light dark:bg-glass-dark border-b border-border-light dark:border-border-dark backdrop-blur-3xl shadow-xl">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2 sm:gap-4">
          <button 
            onClick={onMenuClick} 
            className="p-2 rounded-full hover:bg-white/20 dark:hover:bg-black/20 transition-colors"
            aria-label={t('aria_openMenu')}
          >
            <HamburgerIcon className="w-6 h-6 text-gray-800 dark:text-white" />
          </button>
          <h1 className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500">
            {t('appName')}
          </h1>
        </div>
        <button
          onClick={toggleTheme}
          className="w-12 h-7 rounded-full p-1 flex items-center transition-colors duration-300 ease-in-out bg-gray-300 dark:bg-gray-700"
          aria-label={t(theme === 'light' ? 'aria_switchToDarkMode' : 'aria_switchToLightMode')}
        >
          <div
            className={`relative w-5 h-5 rounded-full bg-white dark:bg-gray-900 shadow-md transform transition-all duration-300 ease-in-out ${
              theme === 'dark' ? 'translate-x-5' : 'translate-x-0'
            }`}
          >
            <SunIcon
              className={`absolute inset-0 p-1 text-yellow-500 transition-all duration-300 ease-in-out
                ${theme === 'light' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-50'}`
              }
            />
            <MoonIcon
              className={`absolute inset-0 p-1 text-blue-300 transition-all duration-300 ease-in-out
                ${theme === 'dark' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'}`
              }
            />
          </div>
        </button>
      </div>
    </header>
  );
};

export default Header;