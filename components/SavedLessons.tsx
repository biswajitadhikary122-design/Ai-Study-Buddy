import React from 'react';
import type { SavedLesson, Topic } from '../types';
import { TOPICS } from '../constants';
import { ReplayIcon, TrashIcon, SparklesIcon } from './icons/GeneralIcons';
import { useTranslation } from '../contexts/LanguageContext';

interface SavedLessonsProps {
  savedLessons: SavedLesson[];
  onReplay: (lesson: SavedLesson) => void;
  onDelete: (lessonId: string) => void;
}

const SavedLessons: React.FC<SavedLessonsProps> = ({ savedLessons, onReplay, onDelete }) => {
  const { t } = useTranslation();
  const getTopicByKey = (key: string): Topic | undefined => {
    return TOPICS.find(t => t.name === key);
  };
    
  return (
    <div className="mt-6 p-4 md:p-6 bg-glass-light dark:bg-glass-dark border border-border-light dark:border-border-dark rounded-2xl shadow-2xl backdrop-blur-3xl transition-all duration-300 ease-out hover:shadow-2xl hover:-translate-y-1">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{t('savedLessonsTitle')}</h2>
      {savedLessons.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400">{t('noSavedLessons')}</p>
      ) : (
        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
          {savedLessons.map((lesson) => {
            const topic = getTopicByKey(lesson.topicName);
            const translatedTopicName = t(lesson.topicName);
            const isCustom = !topic;

            return (
              <div key={lesson.id} className="p-3 bg-white/50 dark:bg-black/20 rounded-lg flex justify-between items-center group">
                <div className="flex items-center gap-3 overflow-hidden">
                  {isCustom ? (
                    <SparklesIcon className={`w-6 h-6 p-1 rounded-md text-white bg-gradient-to-br from-slate-500 to-gray-700 flex-shrink-0`} />
                  ) : (
                    topic && <topic.icon className={`w-6 h-6 p-1 rounded-md text-white bg-gradient-to-br ${topic.gradient} flex-shrink-0`} />
                  )}
                  <div className="truncate">
                    <p className="font-semibold text-gray-800 dark:text-white truncate" title={translatedTopicName}>{translatedTopicName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{lesson.timestamp}</p>
                  </div>
                </div>
                <div className="flex items-center flex-shrink-0">
                    <button 
                      onClick={() => onReplay(lesson)} 
                      className="p-2 rounded-full hover:bg-white/80 dark:hover:bg-black/30 transition-colors"
                      aria-label={t('aria_replayLesson', { lesson: translatedTopicName })}
                      >
                      <ReplayIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                    </button>
                    <button 
                      onClick={() => onDelete(lesson.id)}
                      className="p-2 rounded-full hover:bg-red-500/20 transition-colors"
                      aria-label={t('aria_deleteLesson', { lesson: translatedTopicName })}
                    >
                      <TrashIcon className="w-5 h-5 text-gray-700 dark:text-gray-300 group-hover:text-red-500 transition-colors" />
                    </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SavedLessons;