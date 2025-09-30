import React, { useState } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { CloseIcon, TrashIcon, PhotoIcon, DocumentTextIcon, PaperClipIcon, CameraIcon } from './icons/GeneralIcons';
import type { Source } from '../types';

interface SourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
  sources: Source[];
  setSources: React.Dispatch<React.SetStateAction<Source[]>>;
  selectedSourceIds: Set<string>;
  setSelectedSourceIds: React.Dispatch<React.SetStateAction<Set<string>>>;
}

const SourceTypeButton: React.FC<{
  icon: React.ComponentType<{className?: string}>;
  label: string;
  onClick: () => void;
}> = ({ icon: Icon, label, onClick }) => (
  <button onClick={onClick} className="flex flex-col items-center justify-center gap-2 p-3 bg-white/30 dark:bg-black/30 rounded-lg hover:bg-white/50 dark:hover:bg-black/50 transition-colors">
    <Icon className="w-8 h-8" />
    <span className="text-xs font-semibold">{label}</span>
  </button>
);


const SourcesModal: React.FC<SourcesModalProps> = ({ isOpen, onClose, sources, setSources, selectedSourceIds, setSelectedSourceIds }) => {
  const { t } = useTranslation();
  const [showTextInput, setShowTextInput] = useState(false);
  const [newSourceTitle, setNewSourceTitle] = useState('');
  const [newSourceContent, setNewSourceContent] = useState('');

  if (!isOpen) return null;

  const handleAddTextSource = () => {
    if (!newSourceTitle.trim() || !newSourceContent.trim()) return;
    const newSource: Source = {
      id: `source_${Date.now()}`,
      title: newSourceTitle.trim(),
      content: newSourceContent.trim(),
    };
    setSources(prevSources => [newSource, ...prevSources]);
    setNewSourceTitle('');
    setNewSourceContent('');
    setShowTextInput(false);
  };

  const handleDeleteSource = (sourceId: string) => {
    setSources(prevSources => prevSources.filter(s => s.id !== sourceId));
    setSelectedSourceIds(prevIds => {
      const newIds = new Set(prevIds);
      newIds.delete(sourceId);
      return newIds;
    });
  };

  const handleToggleSourceSelection = (sourceId: string) => {
    setSelectedSourceIds(prevIds => {
      const newIds = new Set(prevIds);
      if (newIds.has(sourceId)) {
        newIds.delete(sourceId);
      } else {
        newIds.add(sourceId);
      }
      return newIds;
    });
  };
  
  const handleModalClose = () => {
    setShowTextInput(false);
    onClose();
  };

  const handleFileSelect = (accept: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.onchange = (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (file) {
            alert(`Selected file: ${file.name}. Feature to process this file is coming soon!`);
        }
    };
    input.click();
  };

  const handleCameraClick = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Camera API is not available in your browser.");
        return;
    }
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop()); // Important to release the camera
        alert(t('featureComingSoon', { feature: t('sourceTypeCamera') }));
        handleModalClose();
    } catch (err) {
        console.error("Camera access error:", err);
        alert("Could not access camera. Please check permissions.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
        <div
            onClick={handleModalClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
            aria-hidden="true"
        ></div>
        <div className="relative w-full max-w-2xl bg-glass-light dark:bg-glass-dark border border-border-light dark:border-border-dark rounded-2xl shadow-2xl p-6 animate-scale-in flex flex-col max-h-[80vh] backdrop-blur-3xl">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">{t('sourcesTitle')}</h3>
                <button onClick={handleModalClose} className="p-2 rounded-full hover:bg-white/20 dark:hover:bg-black/20" aria-label={t('aria_closeMenu')}>
                    <CloseIcon className="w-6 h-6 text-gray-800 dark:text-white" />
                </button>
            </div>

            <div className="flex-grow overflow-y-auto pr-2 mb-4">
              <div className="border-b border-border-light dark:border-border-dark pb-4 mb-4">
                  <h4 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">{t('addSource')}</h4>
                  <div className="grid grid-cols-3 gap-3 text-center text-gray-800 dark:text-white">
                      <SourceTypeButton icon={PhotoIcon} label={t('sourceTypeMedia')} onClick={() => handleFileSelect('image/*,video/*')} />
                      <SourceTypeButton icon={CameraIcon} label={t('sourceTypeCamera')} onClick={handleCameraClick} />
                      <SourceTypeButton icon={DocumentTextIcon} label={t('sourceTypeDocument')} onClick={() => setShowTextInput(prev => !prev)} />
                  </div>
                  {showTextInput && (
                      <div className="mt-4 animate-fade-in">
                          <div className="flex flex-col gap-4">
                              <input
                                  type="text"
                                  value={newSourceTitle}
                                  onChange={(e) => setNewSourceTitle(e.target.value)}
                                  placeholder={t('newSourceTitlePlaceholder')}
                                  className="w-full p-3 rounded-lg bg-white/50 dark:bg-black/20 focus:ring-2 focus:ring-purple-500 border border-transparent focus:border-purple-300 outline-none transition text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                              />
                              <textarea
                                  value={newSourceContent}
                                  onChange={(e) => setNewSourceContent(e.target.value)}
                                  placeholder={t('newSourceContentPlaceholder')}
                                  rows={4}
                                  className="w-full p-3 rounded-lg bg-white/50 dark:bg-black/20 focus:ring-2 focus:ring-purple-500 border border-transparent focus:border-purple-300 outline-none transition text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                              />
                          </div>
                          <div className="flex items-center gap-2 my-3">
                              <div className="flex-grow h-px bg-gray-300 dark:bg-gray-600"></div>
                              <span className="text-sm text-gray-500 dark:text-gray-400">{t('sourceOrDivider')}</span>
                              <div className="flex-grow h-px bg-gray-300 dark:bg-gray-600"></div>
                          </div>
                          <button
                              onClick={() => handleFileSelect('.pdf,.doc,.docx,.txt,.md')}
                              className="w-full p-3 rounded-lg bg-white/20 dark:bg-black/20 hover:bg-white/30 dark:hover:bg-black/30 transition-colors flex items-center justify-center gap-2"
                          >
                              <PaperClipIcon className="w-5 h-5" />
                              <span>{t('sourceUploadFile')}</span>
                          </button>
                          <div className="mt-4 flex justify-end gap-4">
                              <button onClick={() => setShowTextInput(false)} className="px-4 py-2 rounded-lg bg-white/50 dark:bg-black/20 text-gray-800 dark:text-white font-semibold transition-colors">
                                  {t('cancel')}
                              </button>
                              <button onClick={handleAddTextSource} disabled={!newSourceTitle.trim() || !newSourceContent.trim()} className="px-4 py-2 rounded-lg bg-green-500 text-white font-semibold hover:bg-green-600 transition-colors disabled:opacity-50">
                                  {t('saveSource')}
                              </button>
                          </div>
                      </div>
                  )}
              </div>
              
              <h4 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">{t('sourcesTitle')}</h4>

              {(sources.length === 0) ? (
                <p className="text-center text-gray-600 dark:text-gray-400 mt-4">{t('noSources')}</p>
              ) : (
                <div className="space-y-2">
                  {sources.map(source => (
                      <div key={source.id} className="p-3 bg-white/30 dark:bg-black/30 rounded-lg flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 overflow-hidden">
                              <input
                                  type="checkbox"
                                  id={`source-check-modal-${source.id}`}
                                  checked={selectedSourceIds.has(source.id)}
                                  onChange={() => handleToggleSourceSelection(source.id)}
                                  className="form-checkbox h-5 w-5 rounded text-purple-600 bg-gray-700 border-gray-600 focus:ring-purple-500 flex-shrink-0"
                              />
                              <label htmlFor={`source-check-modal-${source.id}`} className="font-semibold text-base truncate cursor-pointer" title={source.title}>{source.title}</label>
                          </div>
                          <button onClick={() => handleDeleteSource(source.id)} className="p-1 rounded-full hover:bg-red-500/20 text-gray-600 dark:text-gray-300 hover:text-red-500 transition-colors flex-shrink-0" aria-label={t('deleteSource')}>
                              <TrashIcon className="w-5 h-5" />
                          </button>
                      </div>
                  ))}
                </div>
              )}
            </div>
        </div>
    </div>
  );
};

export default SourcesModal;
