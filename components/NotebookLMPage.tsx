import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { ArrowLeftIcon, NotebookIcon, SendIcon, SparklesIcon, ThumbsUpIcon, ThumbsDownIcon } from './icons/GeneralIcons';
import type { Source, ChatMessage } from '../types';
import { MessageSender } from '../types';
import { getGroundedAIResponse } from '../services/geminiService';
import Avatar from './Avatar';
import SourcesModal from './SourcesModal';
import SourcesPanel from './SourcesPanel';

interface NotebookLMPageProps {
  onBack: () => void;
  sources: Source[];
  setSources: React.Dispatch<React.SetStateAction<Source[]>>;
}

const NotebookLMPage: React.FC<NotebookLMPageProps> = ({ onBack, sources, setSources }) => {
  const { t } = useTranslation();
  
  const [selectedSourceIds, setSelectedSourceIds] = useState<Set<string>>(new Set());
  const [isSourcesModalOpen, setIsSourcesModalOpen] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  useEffect(() => {
    // When the selection of sources changes, reset the conversation
    // to ensure the context is always relevant.
    setMessages([]);
  }, [selectedSourceIds]);

  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading || selectedSourceIds.size === 0) return;

    const userMessage: ChatMessage = { sender: MessageSender.USER, text: messageText };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    const selectedSources = sources.filter(s => selectedSourceIds.has(s.id));
    const sourcesText = selectedSources.map(s => `## ${s.title}\n\n${s.content}`).join('\n\n---\n\n');
    
    const response = await getGroundedAIResponse(messages, messageText, sourcesText);

    const aiMessage: ChatMessage = {
      sender: MessageSender.AI,
      text: response.text,
      suggestedQuestions: response.suggestedQuestions,
    };

    setMessages(prev => [...prev, aiMessage]);
    setIsLoading(false);
  };
  
  const handleFormSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      await handleSendMessage(userInput);
      setUserInput('');
  };

  const handleSuggestionClick = async (question: string) => {
    await handleSendMessage(question);
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

  const handleDeleteSource = (sourceId: string) => {
    setSources(prevSources => prevSources.filter(s => s.id !== sourceId));
    setSelectedSourceIds(prevIds => {
      const newIds = new Set(prevIds);
      newIds.delete(sourceId);
      return newIds;
    });
  };

  const lastMessage = messages[messages.length - 1];
  const suggestions = lastMessage?.sender === MessageSender.AI && !isLoading && lastMessage.suggestedQuestions
    ? lastMessage.suggestedQuestions
    : [];

  return (
    <div className="p-4 md:p-6 bg-glass-light dark:bg-glass-dark border border-border-light dark:border-border-dark rounded-2xl shadow-2xl backdrop-blur-3xl animate-fade-in transition-all duration-300 ease-out hover:shadow-2xl hover:-translate-y-1 flex flex-col h-[calc(100vh-7rem)]">
      <header className="flex items-center mb-4 flex-shrink-0">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-white/20 dark:hover:bg-black/20 transition-colors mr-2 sm:mr-4" aria-label={t('aria_goBack')}>
          <ArrowLeftIcon className="w-6 h-6 text-gray-800 dark:text-white" />
        </button>
        <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-white flex items-center gap-2">
          <NotebookIcon className="w-7 h-7" />
          <span>{t('notebookTitle')}</span>
        </h2>
      </header>

      <SourcesModal
        isOpen={isSourcesModalOpen}
        onClose={() => setIsSourcesModalOpen(false)}
        sources={sources}
        setSources={setSources}
        selectedSourceIds={selectedSourceIds}
        setSelectedSourceIds={setSelectedSourceIds}
      />

      <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
        {/* Left Panel: Sources */}
        <div className="md:col-span-1 h-full flex flex-col">
          <SourcesPanel
            sources={sources}
            selectedSourceIds={selectedSourceIds}
            onToggleSource={handleToggleSourceSelection}
            onDeleteSource={handleDeleteSource}
            onAddSource={() => setIsSourcesModalOpen(true)}
          />
        </div>

        {/* Right Panel: Chat */}
        <div className="md:col-span-2 h-full flex flex-col bg-white/10 dark:bg-black/10 rounded-lg overflow-hidden relative">
            {selectedSourceIds.size === 0 && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center text-gray-600 dark:text-gray-400 p-4 bg-white/10 dark:bg-black/10 backdrop-blur-[2px] rounded-lg">
                    <SparklesIcon className="w-16 h-16 mb-4 opacity-50" />
                    <p className="text-lg font-semibold">{t('notebookLM_start_title')}</p>
                    <p>{t('notebookLM_start_body')}</p>
                </div>
            )}
            <div className="flex-grow overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && !isLoading && selectedSourceIds.size > 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center text-gray-600 dark:text-gray-400 p-4">
                  <p className="text-lg">{t('notebookLM_ask_about_sources', { count: selectedSourceIds.size })}</p>
                </div>
              )}
              {messages.map((msg, index) => (
                <div key={index} className={`flex items-start gap-3 ${msg.sender === MessageSender.USER ? 'justify-end' : 'justify-start'}`}>
                  {msg.sender === MessageSender.AI && <Avatar isSpeaking={false} isLoading={false} isPaused={false} size="small" />}
                  <div className={`p-4 rounded-2xl ${
                    msg.sender === MessageSender.USER
                      ? 'max-w-md lg:max-w-xl bg-blue-500 text-white rounded-br-none'
                      : 'max-w-xl lg:max-w-3xl bg-glass-light dark:bg-glass-dark backdrop-blur-3xl border border-border-light dark:border-border-dark text-gray-800 dark:text-gray-200 rounded-bl-none'
                  }`}>
                    <p className="leading-relaxed text-base">{msg.text}</p>
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
                <div className="flex items-end gap-3 justify-start">
                  <Avatar isSpeaking={false} isLoading={true} isPaused={false} size="small" />
                  <div className="max-w-xs p-4 rounded-2xl bg-glass-light dark:bg-glass-dark rounded-bl-none">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {suggestions.length > 0 && (
              <div className="px-4 pb-3 flex flex-wrap justify-start items-center gap-2 animate-fade-in">
                {suggestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestionClick(q)}
                    className="px-4 py-2 text-sm bg-white/50 dark:bg-black/20 text-gray-800 dark:text-gray-200 rounded-full border border-border-light dark:border-border-dark hover:bg-white/80 dark:hover:bg-black/30 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            <div className="p-4 border-t border-border-light dark:border-border-dark flex-shrink-0">
              <form onSubmit={handleFormSubmit} className="flex items-center gap-3">
                <div className="relative flex-grow">
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder={t(selectedSourceIds.size > 0 ? 'askAboutSources' : 'selectSourceToChat')}
                    className="w-full p-3 pl-4 rounded-lg bg-white/50 dark:bg-black/20 focus:ring-2 focus:ring-purple-500 border border-transparent focus:border-purple-300 outline-none transition text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    disabled={isLoading || selectedSourceIds.size === 0}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !userInput.trim() || selectedSourceIds.size === 0}
                  className="p-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white disabled:opacity-50 transition-transform duration-200 active:scale-95 flex-shrink-0"
                  aria-label={t('aria_sendMessage')}
                >
                  <SendIcon className="w-6 h-6" />
                </button>
              </form>
            </div>
        </div>
      </div>
    </div>
  );
};

export default NotebookLMPage;
