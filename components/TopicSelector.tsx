import React, { useState } from 'react';
import { TOPICS } from '../constants';
import type { Topic } from '../types';
import { SearchIcon, EllipsisIcon, SparklesIcon } from './icons/GeneralIcons';
import { useTranslation } from '../contexts/LanguageContext';
import VoiceTypingButton from './VoiceTypingButton';

interface TopicSelectorProps {
  selectedTopic: Topic | null;
  onSelectTopic: (topic: Topic) => void;
  onShowMore: () => void;
}

const TopicSelector: React.FC<TopicSelectorProps> = ({ selectedTopic, onSelectTopic, onShowMore }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { t } = useTranslation();

  const filteredTopics = TOPICS.filter(topic =>
    t(topic.name).toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const topicsToShow = searchQuery ? filteredTopics : filteredTopics.slice(0, 3);
  const showMoreButton = !searchQuery && filteredTopics.length > 3;

  const handleCustomTopic = () => {
    if (!searchQuery.trim()) return;

    const customTopic: Topic = {
      id: `custom_${searchQuery.toLowerCase().replace(/\s+/g, '_')}`,
      name: searchQuery.trim(),
      icon: SparklesIcon,
      prompt: `prompt_custom_topic`,
      gradient: 'from-slate-500 to-gray-700',
    };
    onSelectTopic(customTopic);
  };

  return (
    <div className="p-4 md:p-6 bg-glass-light dark:bg-glass-dark border border-border-light dark:border-border-dark rounded-2xl shadow-2xl backdrop-blur-3xl transition-all duration-300 ease-out hover:shadow-2xl hover:-translate-y-1">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white shrink-0">{t('chooseSubject')}</h2>
        <div className="relative w-full sm:max-w-xs">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchSubject')}
            className="w-full pl-10 pr-10 py-2 rounded-lg bg-white/50 dark:bg-black/20 focus:ring-2 focus:ring-purple-500 border border-transparent focus:border-purple-300 outline-none transition text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            aria-label={t('searchSubject')}
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </div>
          <div className="absolute inset-y-0 right-0 pr-2 flex items-center">
            <VoiceTypingButton onTranscript={setSearchQuery} />
          </div>
        </div>
      </div>
      
      {filteredTopics.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {topicsToShow.map((topic) => (
            <button
              key={topic.id}
              onClick={() => onSelectTopic(topic)}
              className={`p-3 rounded-lg text-white font-semibold transition-all duration-300 flex flex-col items-center justify-center aspect-square
                bg-gradient-to-br ${topic.gradient} 
                ${selectedTopic?.id === topic.id ? 'ring-4 ring-white/80 scale-105' : 'opacity-70 hover:opacity-100'}`}
              aria-pressed={selectedTopic?.id === topic.id}
              aria-label={t('aria_selectSubject', { subject: t(topic.name) })}
            >
              <topic.icon className="w-8 h-8 mb-2" />
              <span className="text-center">{t(topic.name)}</span>
            </button>
          ))}
          {showMoreButton && (
             <button
              onClick={onShowMore}
              className="p-3 rounded-lg text-white font-semibold transition-all duration-300 flex flex-col items-center justify-center aspect-square bg-gradient-to-br from-slate-400 to-gray-500 opacity-70 hover:opacity-100"
              aria-label={t('aria_showMoreSubjects')}
            >
              <EllipsisIcon className="w-8 h-8 mb-2" />
              <span>{t('more')}</span>
            </button>
          )}
        </div>
      ) : (
          searchQuery.trim() ? (
            <div className="text-center py-4 animate-fade-in">
              <p className="text-gray-600 dark:text-gray-400 mb-4">{t('noSubjectsFound', { query: `"${searchQuery}"` })}</p>
              <button
                onClick={handleCustomTopic}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold transition-transform duration-200 active:scale-95 hover:scale-105"
                aria-label={t('createCustomLesson', { subject: searchQuery })}
              >
                <SparklesIcon className="w-5 h-5" />
                <span>{t('createCustomLesson', { subject: searchQuery })}</span>
              </button>
            </div>
        ) : (
            <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-400">{t('noSubjectsFound', { query: `"${searchQuery}"` })}</p>
            </div>
        )
      )}
    </div>
  );
};

export default TopicSelector;