
import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage, VideoContent, Source } from '../types';
import { MessageSender } from '../types';
import { getAIResponse, getGroundedAIResponse } from '../services/geminiService';
import Avatar from './Avatar';
import { CloseIcon, SendIcon, TrashIcon, PlayIcon, PauseIcon, ThumbsUpIcon, ThumbsDownIcon, PaperClipIcon } from './icons/GeneralIcons';
import { useTranslation } from '../contexts/LanguageContext';
import VideoCard from './VideoCard';
import SourcesModal from './SourcesModal';

interface BotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayVideo: (video: VideoContent) => void;
  isSpeaking: boolean;
  isPaused: boolean;
  speak: (text: string) => void;
  cancel: () => void;
  pause: () => void;
  resume: () => void;
  sources: Source[];
  setSources: React.Dispatch<React.SetStateAction<Source[]>>;
}

const BotModal: React.FC<BotModalProps> = ({ 
  isOpen, 
  onClose, 
  onPlayVideo,
  isSpeaking,
  isPaused,
  speak,
  cancel,
  pause,
  resume,
  sources,
  setSources
}) => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  const [selectedSourceIds, setSelectedSourceIds] = useState<Set<string>>(new Set());
  const [isSourcesModalOpen, setIsSourcesModalOpen] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);


  // Effect for modal open/close lifecycle
  useEffect(() => {
    // Cancel any ongoing speech when the modal's open state changes.
    // This ensures a clean state and prevents audio overlap.
    cancel();

    if (isOpen) {
      // If the chat is empty, initialize it with a greeting.
      if (messages.length === 0) {
        setMessages([{ sender: MessageSender.AI, text: t('botInitialGreeting') }]);
      }
      // Focus the input field for immediate user interaction.
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen, cancel, messages.length, t]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);
  
  const cleanTextForSpeech = (text: string) => {
    return text.replace(/(\*\*|\*|_|`)/g, '');
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const messageText = userInput.trim();
    if (!messageText || isLoading) return;
    
    cancel(); // Stop any current speech before sending a new message
    const newMessages: ChatMessage[] = [...messages, { sender: MessageSender.USER, text: messageText }];
    setMessages(newMessages);
    setUserInput('');
    setIsLoading(true);

    let aiResponse: { text: string; videos?: VideoContent[]; suggestedQuestions?: string[] };

    if (selectedSourceIds.size > 0) {
        const selectedSources = sources.filter(s => selectedSourceIds.has(s.id));
        const sourcesText = selectedSources.map(s => `## ${s.title}\n\n${s.content}`).join('\n\n---\n\n');
        aiResponse = await getGroundedAIResponse(messages, messageText, sourcesText);
    } else {
        const systemInstruction = `${t('botModalSystemPrompt')} ${t('prompt_natural_speech')} ${t('prompt_suggest_questions')}`;
        aiResponse = await getAIResponse(messages, messageText, systemInstruction);
    }

    setMessages([...newMessages, { 
      sender: MessageSender.AI, 
      text: aiResponse.text,
      videos: aiResponse.videos,
      suggestedQuestions: aiResponse.suggestedQuestions,
    }]);
    setIsLoading(false);
  };

  const handleClearConversation = () => {
    cancel();
    setShowConfirmDialog(true);
  };

  const handleConfirmClear = () => {
    setMessages([{ sender: MessageSender.AI, text: t('botInitialGreeting') }]);
    setShowConfirmDialog(false);
  };
  
  const handleToggleSpeak = () => {
    const lastAiMessage = messages.slice().reverse().find(m => m.sender === MessageSender.AI);
    if (!lastAiMessage) return;

    if (isSpeaking) {
      if (isPaused) {
        resume();
      } else {
        pause();
      }
    } else {
      const textToSpeak = cleanTextForSpeech(lastAiMessage.text);
      speak(textToSpeak);
    }
  };
  
  const handleFeedback = (messageIndex: number, feedback: 'like' | 'dislike') => {
    setMessages(prevMessages => {
        const newMessages = [...prevMessages];
        const message = newMessages[messageIndex];
        if (message) {
            message.feedback = message.feedback === feedback ? null : feedback;
        }
        return newMessages;
    });
  };

  const handleSuggestionClick = async (question: string) => {
    setUserInput(question);
    // We need a form submission to trigger the message sending logic.
    // A direct call might not have the latest state if not careful.
    // For simplicity, we can just set the input and let the user send.
    // Or we can create a wrapper function.
    const form = inputRef.current?.form;
    if (form) {
      // Temporarily set input, submit, then it will be cleared
      const tempSubmit = (e: Event) => {
        e.preventDefault();
        handleSendMessage(e as unknown as React.FormEvent);
      }
      form.addEventListener('submit', tempSubmit, { once: true });
      form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }
  };

  if (!isOpen) {
    return null;
  }
  
  const lastAiMessageExists = messages.some(m => m.sender === MessageSender.AI);
  const lastMessage = messages[messages.length - 1];
  const suggestions = lastMessage?.sender === MessageSender.AI && !isLoading && lastMessage.suggestedQuestions
    ? lastMessage.suggestedQuestions
    : [];

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        aria-hidden="true"
      ></div>
      
      <div
        className="relative w-full max-w-2xl h-[80vh] max-h-[700px] flex flex-col bg-glass-light dark:bg-glass-dark border border-border-light dark:border-border-dark rounded-2xl shadow-2xl backdrop-blur-3xl animate-scale-in transition-all duration-300 ease-out hover:shadow-[-10px_10px_30px_rgba(0,0,0,0.2)] dark:hover:shadow-[-10px_10px_40px_rgba(0,0,0,0.4)] hover:-translate-y-1"
      >
        <SourcesModal
          isOpen={isSourcesModalOpen}
          onClose={() => setIsSourcesModalOpen(false)}
          sources={sources}
          setSources={setSources}
          selectedSourceIds={selectedSourceIds}
          setSelectedSourceIds={setSelectedSourceIds}
        />
        <header 
          className="flex items-center justify-between p-4 border-b border-border-light dark:border-border-dark flex-shrink-0"
        >
            <div className="flex items-center gap-3">
                <Avatar isSpeaking={isSpeaking} isLoading={isLoading} isPaused={isPaused} size="small" />
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">{t('botModalTitle')}</h2>
            </div>
            <div className="flex items-center gap-2">
                 <button onClick={handleClearConversation} className="p-2 rounded-full hover:bg-white/20 dark:hover:bg-black/20 transition-colors" aria-label={t('aria_clearConversation')}>
                    <TrashIcon className="w-6 h-6 text-gray-800 dark:text-white" />
                </button>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-white/20 dark:hover:bg-black/20 transition-colors" aria-label={t('aria_closeBot')}>
                    <CloseIcon className="w-6 h-6 text-gray-800 dark:text-white" />
                </button>
            </div>
        </header>

        {showConfirmDialog && (
            <div className="absolute inset-0 z-10 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                <div className="bg-glass-light dark:bg-glass-dark p-6 rounded-xl shadow-lg border border-border-light dark:border-border-dark text-center">
                    <h3 className="text-lg font-bold mb-2 text-gray-800 dark:text-white">{t('clearConversation')}</h3>
                    <p className="mb-4 text-gray-700 dark:text-gray-300">{t('clearConversationConfirm')}</p>
                    <div className="flex justify-center gap-4">
                        <button onClick={() => setShowConfirmDialog(false)} className="px-4 py-2 rounded-lg bg-white/50 dark:bg-black/20 text-gray-800 dark:text-white font-semibold transition-colors">
                            {t('cancel')}
                        </button>
                        <button onClick={handleConfirmClear} className="px-4 py-2 rounded-lg bg-red-500 text-white font-semibold transition-colors">
                            {t('confirmClear')}
                        </button>
                    </div>
                </div>
            </div>
        )}
        
        <main className="flex-grow overflow-y-auto p-4 space-y-4">
            {messages.map((msg, index) => (
            <div key={index} className={`flex items-end gap-2 ${msg.sender === MessageSender.USER ? 'justify-end' : 'justify-start'}`}>
                {msg.sender === MessageSender.AI && <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0"></div>}
                <div className={`p-3 rounded-2xl text-base ${
                  msg.sender === MessageSender.USER
                    ? 'max-w-md bg-blue-500 text-white rounded-br-none'
                    : 'max-w-xl bg-glass-light dark:bg-glass-dark backdrop-blur-3xl border border-border-light dark:border-border-dark text-gray-800 dark:text-gray-200 rounded-bl-none'
                }`}>
                  <p>{msg.text}</p>
                  {msg.videos && msg.videos.length > 0 && (
                    <div className="mt-3 -mb-1">
                      <div className="flex gap-3 pb-2 overflow-x-auto">
                        {msg.videos.map((video) => (
                          <VideoCard key={video.id} video={video} onPlayVideo={onPlayVideo} />
                        ))}
                      </div>
                    </div>
                  )}
                  {msg.sender === MessageSender.AI && (
                      <div className="mt-2 flex items-center gap-2 text-gray-500 dark:text-gray-400">
                          <button
                              onClick={() => handleFeedback(index, 'like')}
                              className={`p-1 rounded-full transition-colors ${msg.feedback === 'like' ? 'text-blue-500 bg-blue-500/10' : 'hover:bg-gray-500/10'}`}
                              aria-label={t('aria_likeResponse')}
                          >
                              <ThumbsUpIcon className={`w-4 h-4 ${msg.feedback === 'like' ? 'fill-current' : ''}`} />
                          </button>
                          <button
                              onClick={() => handleFeedback(index, 'dislike')}
                              className={`p-1 rounded-full transition-colors ${msg.feedback === 'dislike' ? 'text-red-500 bg-red-500/10' : 'hover:bg-gray-500/10'}`}
                              aria-label={t('aria_dislikeResponse')}
                          >
                              <ThumbsDownIcon className={`w-4 h-4 ${msg.feedback === 'dislike' ? 'fill-current' : ''}`} />
                          </button>
                      </div>
                  )}
                </div>
            </div>
            ))}
            {isLoading && (
                <div className="flex items-end gap-2 justify-start">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0 animate-pulse"></div>
                    <div className="max-w-xs p-3 rounded-2xl bg-glass-light dark:bg-glass-dark backdrop-blur-3xl border border-border-light dark:border-border-dark rounded-bl-none">
                        <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                        </div>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </main>

        {suggestions.length > 0 && (
          <div className="px-4 pb-3 flex flex-wrap justify-start items-center gap-2 animate-fade-in">
            {suggestions.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSuggestionClick(q)}
                className="px-3 py-1.5 text-sm bg-white/50 dark:bg-black/20 text-gray-800 dark:text-gray-200 rounded-full border border-border-light dark:border-border-dark hover:bg-white/80 dark:hover:bg-black/30 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        <footer className="p-4 border-t border-border-light dark:border-border-dark flex-shrink-0">
            <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                <button 
                  type="button" 
                  onClick={handleToggleSpeak}
                  disabled={isLoading || !lastAiMessageExists}
                  className="p-3 rounded-lg bg-white/50 dark:bg-black/20 text-gray-800 dark:text-white disabled:opacity-50 transition-transform duration-200 active:scale-95 flex-shrink-0"
                  aria-label={t(isSpeaking && !isPaused ? 'aria_pause' : 'aria_play')}
                >
                  {isSpeaking && !isPaused ? (
                    <PauseIcon className="w-6 h-6" />
                  ) : (
                    <PlayIcon className="w-6 h-6" />
                  )}
                </button>
                <div className="relative flex-grow">
                  <button
                    type="button"
                    onClick={() => setIsSourcesModalOpen(true)}
                    className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors"
                    aria-label={t('addSource')}
                  >
                    <PaperClipIcon className="w-6 h-6" />
                  </button>
                  <input
                    ref={inputRef}
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder={selectedSourceIds.size > 0 ? t('askAboutSources') : t('askAnything')}
                    aria-label={t('askAnything')}
                    className="w-full p-3 pl-12 rounded-lg bg-white/50 dark:bg-black/20 focus:ring-2 focus:ring-purple-500 border border-transparent focus:border-purple-300 outline-none transition text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    disabled={isLoading}
                  />
                </div>
                <button 
                type="submit" 
                disabled={isLoading || !userInput.trim()} 
                className="p-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white disabled:opacity-50 transition-transform duration-200 active:scale-95"
                aria-label={t('aria_sendMessage')}
                >
                <SendIcon className="w-6 h-6" />
                </button>
            </form>
        </footer>
      </div>
    </div>
  );
};

export default BotModal;
