import React from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { DocumentTextIcon, TrashIcon } from './icons/GeneralIcons';
import type { Source } from '../types';

interface SourcesPanelProps {
  sources: Source[];
  selectedSourceIds: Set<string>;
  onToggleSource: (sourceId: string) => void;
  onDeleteSource: (sourceId: string) => void;
  onAddSource: () => void;
}

const SourcesPanel: React.FC<SourcesPanelProps> = ({ sources, selectedSourceIds, onToggleSource, onDeleteSource, onAddSource }) => {
  const { t } = useTranslation();

  return (
    <div className="bg-white/10 dark:bg-black/10 rounded-lg p-4 flex flex-col h-full">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{t('sourcesTitle')}</h3>
      <div className="flex-grow overflow-y-auto pr-2 space-y-2 mb-4">
        {sources.length === 0 ? (
          <div className="text-center text-gray-600 dark:text-gray-400 py-8">
            <DocumentTextIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>{t('noSources')}</p>
          </div>
        ) : (
          sources.map(source => (
            <div
              key={source.id}
              className={`p-3 rounded-lg flex items-center justify-between gap-2 transition-colors cursor-pointer border ${selectedSourceIds.has(source.id) ? 'bg-purple-500/20 border-purple-500' : 'bg-white/30 dark:bg-black/30 border-transparent hover:bg-white/50 dark:hover:bg-black/50'}`}
              onClick={() => onToggleSource(source.id)}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <input
                  type="checkbox"
                  id={`source-check-panel-${source.id}`}
                  checked={selectedSourceIds.has(source.id)}
                  onChange={() => onToggleSource(source.id)}
                  className="form-checkbox h-5 w-5 rounded text-purple-600 bg-gray-700 border-gray-600 focus:ring-purple-500 flex-shrink-0 cursor-pointer"
                />
                <label htmlFor={`source-check-panel-${source.id}`} className="font-semibold text-base truncate cursor-pointer" title={source.title}>{source.title}</label>
              </div>
              <button onClick={(e) => { e.stopPropagation(); onDeleteSource(source.id); }} className="p-1 rounded-full hover:bg-red-500/20 text-gray-600 dark:text-gray-300 hover:text-red-500 transition-colors flex-shrink-0" aria-label={t('deleteSource')}>
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>
          ))
        )}
      </div>
      <button
        onClick={onAddSource}
        className="w-full p-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
      >
        {t('addSource')}
      </button>
    </div>
  );
};

export default SourcesPanel;
