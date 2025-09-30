import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { ArrowLeftIcon, PhotoIcon, SparklesIcon, DownloadIcon, ShareIcon, VideoCameraIcon, EnterFullscreenIcon, CloseIcon, ChevronDownIcon } from './icons/GeneralIcons';
import { CheckCircleIcon } from './icons/FeedbackIcons';
import { generateImage, generateVideo } from '../services/geminiService';

interface StudioPageProps {
  onBack: () => void;
}

const dataURLtoFile = (dataurl: string, filename: string): File | null => {
    const arr = dataurl.split(',');
    if (arr.length < 2) return null;
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) return null;
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
};


const StudioPage: React.FC<StudioPageProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'image' | 'video'>('image');
  const [prompt, setPrompt] = useState("");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoStatusKey, setVideoStatusKey] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isModeSelectorOpen, setIsModeSelectorOpen] = useState(false);

  const modeSelectorRef = useRef<HTMLDivElement>(null);

  const videoProgressSteps = [
    'studioVideoProgress_sending',
    'studioVideoProgress_started',
    'studioVideoProgress_warming',
    'studioVideoProgress_choreographing',
    'studioVideoProgress_rendering',
    'studioVideoProgress_polishing',
    'studioVideoProgress_preparing',
    'studioVideoProgress_downloading',
    'studioVideoProgress_done'
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (modeSelectorRef.current && !modeSelectorRef.current.contains(event.target as Node)) {
            setIsModeSelectorOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


  const handleGenerate = async () => {
    if (!prompt.trim() || isLoading) return;
    setIsLoading(true);
    setError(null);
    setResultUrl(null);
    
    if (mode === 'image') {
      const result = await generateImage(prompt);
      if (result) {
        setResultUrl(result);
      } else {
        setError(t('studioError'));
      }
    } else {
      const result = await generateVideo(prompt, (status, key) => {
        setVideoStatusKey(key);
      });
      if (result) {
        setResultUrl(result);
      } else {
        setError(t('studioError'));
      }
      setVideoStatusKey(null);
    }
    
    setIsLoading(false);
  };

  const handleDownload = () => {
    if (!resultUrl) return;
    const link = document.createElement('a');
    link.href = resultUrl;
    const fileExtension = mode === 'image' ? 'jpeg' : 'mp4';
    link.download = `ai-generated-${mode}-${Date.now()}.${fileExtension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
    if (!resultUrl) return;
    const fileExtension = mode === 'image' ? 'jpeg' : 'mp4';
    const mimeType = mode === 'image' ? 'image/jpeg' : 'video/mp4';
    const filename = `ai-generated-${mode}-${Date.now()}.${fileExtension}`;
    
    let file: File | null = null;
    try {
        if (mode === 'image') {
            file = dataURLtoFile(resultUrl, filename);
        } else {
            const response = await fetch(resultUrl);
            const blob = await response.blob();
            file = new File([blob], filename, { type: mimeType });
        }
    } catch (e) {
        console.error("Error creating file for sharing:", e);
        alert(t('studioShareError'));
        return;
    }
    
    if (!file) {
        alert(t('studioShareError'));
        return;
    }

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
            await navigator.share({
                title: 'AI Generated Content',
                text: prompt.substring(0, 100) + '...',
                files: [file],
            });
        } catch (error) {
            if ((error as DOMException).name !== 'AbortError') {
                console.error('Error sharing:', error);
                alert(t('studioShareError'));
            }
        }
    } else {
        alert(t('studioShareNotSupported'));
    }
  };

  return (
    <>
      <div className="p-4 md:p-6 bg-glass-light dark:bg-glass-dark border border-border-light dark:border-border-dark rounded-2xl shadow-2xl backdrop-blur-3xl animate-fade-in transition-all duration-300 ease-out hover:shadow-2xl hover:-translate-y-1 flex flex-col h-[calc(100vh-7rem)]">
        <div className="flex items-center mb-6 flex-shrink-0">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-white/20 dark:hover:bg-black/20 transition-colors mr-2 sm:mr-4" aria-label={t('aria_goBack')}>
            <ArrowLeftIcon className="w-6 h-6 text-gray-800 dark:text-white" />
          </button>
          <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-white flex items-center gap-2">
            <SparklesIcon className="w-7 h-7" />
            <span>{t('studioTitle')}</span>
          </h2>
        </div>
        
        {/* Search Bar Controls */}
        <div className="w-full max-w-3xl mx-auto mb-6 flex-shrink-0">
            <form onSubmit={(e) => { e.preventDefault(); handleGenerate(); }} className="relative">
                <div className="flex items-center gap-2 bg-white/20 dark:bg-black/20 rounded-full shadow-lg p-1.5 pr-2.5 text-gray-800 dark:text-white transition-shadow focus-within:ring-2 focus-within:ring-purple-500">
                    <div ref={modeSelectorRef} className="relative">
                        <button
                            type="button"
                            onClick={() => setIsModeSelectorOpen(prev => !prev)}
                            className="flex items-center gap-2 pl-4 pr-3 py-2.5 rounded-full hover:bg-white/20 dark:hover:bg-black/30 transition-colors"
                        >
                            {mode === 'image' ? <PhotoIcon className="w-5 h-5" /> : <VideoCameraIcon className="w-5 h-5" />}
                            <span className="font-semibold text-sm">{t(mode === 'image' ? 'studioModeImage' : 'studioModeVideo')}</span>
                            <ChevronDownIcon className={`w-4 h-4 transition-transform ${isModeSelectorOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isModeSelectorOpen && (
                            <div className="absolute top-full mt-2 w-48 bg-glass-light dark:bg-glass-dark border border-border-light dark:border-border-dark rounded-lg shadow-xl backdrop-blur-3xl z-10 animate-fade-in py-1">
                                <button onClick={() => { setMode('image'); setIsModeSelectorOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 hover:bg-white/20 dark:hover:bg-black/20 transition-colors text-sm">
                                    <PhotoIcon className="w-5 h-5" /> {t('studioModeImage')}
                                </button>
                                <button onClick={() => { setMode('video'); setIsModeSelectorOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 hover:bg-white/20 dark:hover:bg-black/20 transition-colors text-sm">
                                    <VideoCameraIcon className="w-5 h-5" /> {t('studioModeVideo')}
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="w-px h-6 bg-white/30 dark:bg-black/30 rounded-full"></div>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGenerate(); } }}
                        placeholder={t('studioPromptPlaceholder')}
                        className="w-full flex-grow p-2 bg-transparent focus:outline-none placeholder-gray-500 dark:placeholder-gray-400 resize-none text-base leading-tight"
                        rows={1}
                        aria-label={t('studioPromptPlaceholder')}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !prompt.trim()}
                        className="flex-shrink-0 p-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white disabled:opacity-50 transition-all duration-200 active:scale-95 hover:shadow-lg"
                        aria-label={t('studioGenerate')}
                    >
                        {isLoading ? (
                            <div className="w-6 h-6 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <SparklesIcon className="w-6 h-6" />
                        )}
                    </button>
                </div>
            </form>
        </div>

        {/* Display Area */}
        <div className="flex-grow flex items-center justify-center bg-white/10 dark:bg-black/10 rounded-lg p-4 overflow-hidden relative">
          {isLoading && (
            <div className="w-full h-full flex flex-col items-center justify-center text-center text-gray-600 dark:text-gray-400">
              {mode === 'video' ? (
                <div className="text-left w-full max-w-sm">
                  <p className="text-center font-semibold mb-4">{t('studioGeneratingVideo')}</p>
                  <ul className="space-y-2">
                    {videoProgressSteps.map((stepKey) => {
                      const currentIndex = videoProgressSteps.indexOf(videoStatusKey || '');
                      const stepIndex = videoProgressSteps.indexOf(stepKey);
                      const isCompleted = stepIndex < currentIndex;
                      const isCurrent = stepIndex === currentIndex;

                      return (
                        <li key={stepKey} className={`flex items-center gap-3 transition-opacity duration-300 ${!isCompleted && !isCurrent ? 'opacity-40' : 'opacity-100'}`}>
                          {isCompleted ? (
                            <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                          ) : isCurrent ? (
                            <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                              <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                            </div>
                          ) : (
                            <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                              <div className="w-2.5 h-2.5 bg-gray-500 rounded-full"></div>
                            </div>
                          )}
                          <span className={`${isCurrent ? 'font-semibold' : ''}`}>{t(stepKey)}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-purple-500"></div>
                  <p className="mt-4 font-semibold">{t('studioGeneratingImage')}</p>
                </>
              )}
            </div>
          )}
          {!isLoading && error && (
            <div className="text-center text-red-500">
                <p>{error}</p>
            </div>
          )}
          {!isLoading && !error && resultUrl && (
            <div className="relative flex flex-col items-center justify-center h-full w-full group">
                <button
                    onClick={() => setIsFullscreen(true)}
                    className="absolute top-2 right-2 z-10 p-2 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label={t('aria_enterFullscreenPreview')}
                >
                    <EnterFullscreenIcon className="w-6 h-6" />
                </button>
                {mode === 'image' ? (
                  <img src={resultUrl} alt={prompt.substring(0, 50)} className="max-w-full max-h-[calc(100%-4rem)] object-contain rounded-md shadow-lg" />
                ) : (
                  <video src={resultUrl} controls autoPlay loop className="max-w-full max-h-[calc(100%-4rem)] object-contain rounded-md shadow-lg" />
                )}
                <div className="flex items-center gap-4 mt-4 animate-fade-in">
                    <button
                        onClick={handleDownload}
                        className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white/50 dark:bg-black/20 text-gray-800 dark:text-white font-semibold transition-colors hover:bg-white/80 dark:hover:bg-black/30"
                        aria-label={t('aria_downloadContent')}
                    >
                        <DownloadIcon className="w-5 h-5" />
                        <span>{t('studioDownload')}</span>
                    </button>
                    <button
                        onClick={handleShare}
                        className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white/50 dark:bg-black/20 text-gray-800 dark:text-white font-semibold transition-colors hover:bg-white/80 dark:hover:bg-black/30"
                        aria-label={t('aria_shareContent')}
                    >
                        <ShareIcon className="w-5 h-5" />
                        <span>{t('studioShare')}</span>
                    </button>
                </div>
            </div>
          )}
          {!isLoading && !error && !resultUrl && (
             <div className="text-center text-gray-600 dark:text-gray-400 p-4">
                <SparklesIcon className="w-16 h-16 mx-auto mb-4" />
                <p className="text-lg">{t('studioWelcome')}</p>
            </div>
          )}
        </div>
      </div>
      {isFullscreen && resultUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsFullscreen(false)}
          role="dialog"
          aria-modal="true"
        >
          <button
            onClick={(e) => { e.stopPropagation(); setIsFullscreen(false); }}
            className="absolute top-4 right-4 p-2 rounded-full text-white bg-white/20 hover:bg-white/40 transition-colors"
            aria-label={t('aria_exitFullscreenPreview')}
          >
            <CloseIcon className="w-8 h-8" />
          </button>
          <div className="relative max-w-[95vw] max-h-[95vh]" onClick={(e) => e.stopPropagation()}>
            {mode === 'image' ? (
              <img src={resultUrl} alt={prompt.substring(0, 50)} className="w-auto h-auto max-w-full max-h-full object-contain rounded-lg" />
            ) : (
              <video src={resultUrl} controls autoPlay loop className="w-auto h-auto max-w-full max-h-full object-contain rounded-lg" />
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default StudioPage;