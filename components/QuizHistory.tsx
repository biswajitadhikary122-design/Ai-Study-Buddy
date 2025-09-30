import React, { useState, useEffect } from 'react';
import type { QuizResult, Topic } from '../types';
import { useTranslation } from '../contexts/LanguageContext';
import { TOPICS } from '../constants';
import { SparklesIcon } from './icons/GeneralIcons';

const QuizHistory: React.FC = () => {
    const { t } = useTranslation();
    const [history, setHistory] = useState<QuizResult[]>([]);

    useEffect(() => {
        const handleStorageChange = () => {
            const storedHistory = JSON.parse(localStorage.getItem('quiz-history') || '[]');
            setHistory(storedHistory);
        };
        
        handleStorageChange();

        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    const getTopicDetails = (topicNameKey: string): { translatedName: string; icon: React.ComponentType<{ className?: string }>, gradient: string } => {
        const topic = TOPICS.find(t => t.name === topicNameKey);
        if (topic) {
            return {
                translatedName: t(topic.name),
                icon: topic.icon,
                gradient: topic.gradient,
            }
        }
        return {
            translatedName: topicNameKey,
            icon: SparklesIcon,
            gradient: 'from-slate-500 to-gray-700'
        }
    }

    return (
        <div className="mt-6 p-4 md:p-6 bg-glass-light dark:bg-glass-dark border border-border-light dark:border-border-dark rounded-2xl shadow-2xl backdrop-blur-3xl transition-all duration-300 ease-out hover:shadow-2xl hover:-translate-y-1">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{t('quizHistoryTitle')}</h2>
            {history.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400">{t('noQuizHistory')}</p>
            ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {history.map((result) => {
                        const { translatedName, icon: Icon, gradient } = getTopicDetails(result.topicName);
                        return (
                          <div key={result.id} className="p-3 bg-white/50 dark:bg-black/20 rounded-lg flex justify-between items-center">
                              <div className="flex items-center gap-3 overflow-hidden">
                                <div className={`w-8 h-8 rounded-md text-white bg-gradient-to-br ${gradient} flex-shrink-0 flex items-center justify-center`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <div className="truncate">
                                    <p className="font-semibold text-gray-800 dark:text-white truncate" title={translatedName}>{translatedName}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{result.timestamp}</p>
                                </div>
                              </div>
                              <div className="font-bold text-lg text-gray-800 dark:text-white flex-shrink-0 ml-4">
                                  {result.score}/{result.total}
                              </div>
                          </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default QuizHistory;