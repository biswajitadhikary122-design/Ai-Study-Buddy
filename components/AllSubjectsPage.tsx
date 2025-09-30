import React from 'react';
import { TOPICS } from '../constants';
import type { Topic } from '../types';
import { useTranslation } from '../contexts/LanguageContext';
import { ArrowLeftIcon } from './icons/GeneralIcons';

interface AllSubjectsPageProps {
  onBack: () => void;
  onSelectTopic: (topic: Topic) => void;
}

const AllSubjectsPage: React.FC<AllSubjectsPageProps> = ({ onBack, onSelectTopic }) => {
  const { t } = useTranslation();

  return (
    <div className="p-4 md:p-6 bg-glass-light dark:bg-glass-dark border border-border-light dark:border-border-dark rounded-2xl shadow-2xl backdrop-blur-3xl animate-fade-in transition-all duration-300 ease-out hover:shadow-2xl hover:-translate-y-1">
      <div className="flex items-center mb-6">
        <button 
          onClick={onBack} 
          className="p-2 rounded-full hover:bg-white/20 dark:hover:bg-black/20 transition-colors mr-2 sm:mr-4"
          aria-label={t('aria_goBack')}
        >
          <ArrowLeftIcon className="w-6 h-6 text-gray-800 dark:text-white" />
        </button>
        <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-white">{t('allSubjectsTitle')}</h2>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
        {TOPICS.map((topic) => (
          <button
            key={topic.id}
            onClick={() => onSelectTopic(topic)}
            className={`p-3 rounded-lg text-white font-semibold transition-all duration-300 flex flex-col items-center justify-center aspect-square text-center
            bg-gradient-to-br ${topic.gradient} opacity-80 hover:opacity-100 transform hover:scale-105`}
            aria-label={t('aria_selectSubject', { subject: t(topic.name) })}
          >
            <topic.icon className="w-8 h-8 sm:w-10 sm:h-10 mb-2" />
            <span className="text-xs sm:text-sm">{t(topic.name)}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default AllSubjectsPage;