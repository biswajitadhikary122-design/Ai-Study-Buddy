

import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage, Topic, VideoContent, Source } from '../types';
import { MessageSender } from '../types';
import { getAIResponse, getGroundedAIResponse } from '../services/geminiService';
import Avatar from './Avatar';
import { SendIcon, PlayIcon, PauseIcon, ThumbsUpIcon, ThumbsDownIcon, PaperClipIcon, ArrowLeftIcon } from './icons/GeneralIcons';
import { useTranslation } from '../contexts/LanguageContext';
import type { SpeakOptions } from '../hooks/useTextToSpeech';
import QuizUI from './QuizUI';
import VideoCard from './VideoCard';
import SourcesModal from './SourcesModal';

interface ChatWindowProps {
  topic: Topic;
  isSpeaking: boolean;
  isPaused: boolean;
  speak: (text: string, options?: SpeakOptions) => void;
  pause: () => void;
  resume: () => void;
  onPlayVideo: (video: VideoContent) => void;
  initialMessages?: ChatMessage[] | null;
  sources: Source[];
  setSources: React.Dispatch<React.SetStateAction<Source[]>>;
  replayTrigger: number;
  onBack: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ 
  topic, 
  isSpeaking, 
  isPaused,
  speak, 
  pause,
  resume,
  onPlayVideo,
  initialMessages,
  sources,
  setSources,
  replayTrigger,
  onBack
}) => {
  const { t, language } = useTranslation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [spokenMessageIndex, setSpokenMessageIndex] = useState<number | null>(null);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(-1);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const speakTimeoutRef = useRef<number | null>(null);
  const activeSpeechIdRef = useRef<number | null>(null);
  
  const [selectedSourceIds, setSelectedSourceIds] = useState<Set<string>>(new Set());
  const [isSourcesModalOpen, setIsSourcesModalOpen] = useState(false);

  const isCustomTopic = topic.id.startsWith('custom_');
  const topicName = isCustomTopic ? topic.name : t(topic.name);

  useEffect(() => {
    // Reset selected sources when topic changes
    setSelectedSourceIds(new Set());
  }, [topic.id]);


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);
  
  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages);
    } else {
      const initialMessage = t('initialGreeting', { topic: topicName });
      setMessages([{ sender: MessageSender.AI, text: initialMessage }]);
    }
    setSpokenMessageIndex(null);
    setCurrentSentenceIndex(-1);
    activeSpeechIdRef.current = null;
  }, [topic, language, t, topicName, initialMessages]);
  
  useEffect(() => {
    // Clear timeout on component unmount
    return () => {
      if (speakTimeoutRef.current) {
        clearTimeout(speakTimeoutRef.current);
      }
    };
  }, []);

  const cleanTextForDisplay = (text: string) => {
    // Removes markdown characters like **, *, _, ` so they aren't shown.
    return text.replace(/(\*\*|\*|_|`)/g, '');
  };

  const handleSpeak = (message: ChatMessage, messageIndex: number, startSentenceIndex: number = 0) => {
    const speechId = Date.now();
    activeSpeechIdRef.current = speechId;
    
    const cleanedText = cleanTextForDisplay(message.text);
    const sentences = cleanedText.match(/([^\.!\?]+[\.!\?]+)|([^\.!\?]+$)/g)
      ?.filter(s => s.trim().length > 0) || [cleanedText];

    if (startSentenceIndex >= sentences.length) {
      console.error("Attempted to start speech from an invalid sentence index.");
      return;
    }
    
    setSpokenMessageIndex(messageIndex);
    setCurrentSentenceIndex(startSentenceIndex);

    const textToSpeak = sentences.slice(startSentenceIndex).join(' ');

    const sentenceStartChars: number[] = [];
    let currentIndex = 0;
    for (const sentence of sentences) {
      const startIndex = cleanedText.indexOf(sentence, currentIndex);
      if (startIndex !== -1) {
        sentenceStartChars.push(startIndex);
        currentIndex = startIndex + sentence.length;
      } else {
        sentenceStartChars.push(currentIndex);
        currentIndex += sentence.length;
      }
    }
    
    const startCharOffset = sentenceStartChars[startSentenceIndex];

    speak(textToSpeak, {
      onBoundary: (event: SpeechSynthesisEvent) => {
        if (activeSpeechIdRef.current !== speechId) return;

        if (event.name === 'word') {
          const absoluteCharIndex = event.charIndex + startCharOffset;
          
          let activeSentenceIndex = -1;
          for (let i = sentenceStartChars.length - 1; i >= 0; i--) {
            if (absoluteCharIndex >= sentenceStartChars[i]) {
              activeSentenceIndex = i;
              break;
            }
          }
          
          if (activeSentenceIndex !== -1) {
            setCurrentSentenceIndex(activeSentenceIndex);
          }
        }
      },
      onEnd: () => {
        if (activeSpeechIdRef.current === speechId) {
          setSpokenMessageIndex(null);
          setCurrentSentenceIndex(-1);
          activeSpeechIdRef.current = null;
        }
      },
    });
  };

  useEffect(() => {
    if (replayTrigger > 0 && messages.length > 0) {
      const lastAiMessage = [...messages].reverse().find(m => m.sender === MessageSender.AI);
      if (lastAiMessage) {
        const lastAiMessageIndex = messages.lastIndexOf(lastAiMessage);
        handleSpeak(lastAiMessage, lastAiMessageIndex);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [replayTrigger]);

  const handleTogglePlayPause = () => {
    if (isPaused) resume();
    else pause();
  };

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: ChatMessage = { sender: MessageSender.USER, text: messageText };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    let newAiMessage: ChatMessage;

    if (selectedSourceIds.size > 0) {
      const selectedSources = sources.filter(s => selectedSourceIds.has(s.id));
      const sourcesText = selectedSources.map(s => `## ${s.title}\n\n${s.content}`).join('\n\n---\n\n');
      const aiResponseData = await getGroundedAIResponse(messages, messageText, sourcesText);
      newAiMessage = {
        sender: MessageSender.AI,
        text: aiResponseData.text,
        suggestedQuestions: aiResponseData.suggestedQuestions,
      };
    } else {
      const baseInstruction = isCustomTopic
        ? t(topic.prompt, { topic: topicName })
        : t(topic.prompt);
        
      const systemInstruction = `${baseInstruction} ${t('prompt_flexibility')} ${t('prompt_natural_speech')} ${t('prompt_suggest_questions')} ${t('prompt_offer_quiz')}`;
      const aiResponseData = await getAIResponse(messages, messageText, systemInstruction);
      
      newAiMessage = {
        sender: MessageSender.AI,
        text: aiResponseData.text,
        videos: aiResponseData.videos,
        suggestedQuestions: aiResponseData.suggestedQuestions,
        quiz: aiResponseData.quiz,
      };
    }
    
    const finalMessages = [...newMessages, newAiMessage];
    setMessages(finalMessages);
    setIsLoading(false);
    
    if (speakTimeoutRef.current) clearTimeout(speakTimeoutRef.current);
    
    speakTimeoutRef.current = window.setTimeout(() => {
      handleSpeak(newAiMessage, finalMessages.length - 1, 0);
    }, 1000);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMessage(userInput);
    setUserInput('');
  };

  const handleSuggestionClick = async (question: string) => {
    await sendMessage(question);
  };

  const handleFeedback = (messageIndex: number, feedback: 'like' | 'dislike') => {
    setMessages(prevMessages => {
        const newMessages = [...prevMessages];
        const message = newMessages[messageIndex];
        if (message) {
            // Toggle feedback: if same feedback is clicked again, reset to null
            message.feedback = message.feedback === feedback ? null : feedback;
        }
        return newMessages;
    });
  };

  const lastMessage = messages[messages.length - 1];
  const suggestions = lastMessage?.sender === MessageSender.AI && !isLoading && lastMessage.suggestedQuestions
    ? lastMessage.suggestedQuestions
    : [];
    
  const statusText = isLoading 
    ? t('statusThinking') 
    : isPaused 
    ? t('statusPaused') 
    : isSpeaking 
    ? t('statusSpeaking') 
    : t('statusReady');

  return (
    <div className="p-4 md:p-6 bg-glass-light dark:bg-glass-dark border border-border-light dark:border-border-dark rounded-2xl shadow-2xl backdrop-blur-3xl flex flex-col flex-grow transition-all duration-300 ease-out hover:shadow-2xl hover:-translate-y-1">
      <SourcesModal
        isOpen={isSourcesModalOpen}
        onClose={() => setIsSourcesModalOpen(false)}
        sources={sources}
        setSources={setSources}
        selectedSourceIds={selectedSourceIds}
        setSelectedSourceIds={setSelectedSourceIds}
      />
      <div className="flex items-center justify-between pb-4">
        <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-full bg-white/30 dark:bg-black/20 hover:bg-white/50 dark:hover:bg-black/40 border border-border-light dark:border-border-dark text-gray-800 dark:text-white transition-colors flex-shrink-0"
              aria-label={t('aria_changeSubject')}
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <Avatar isSpeaking={isSpeaking} isLoading={isLoading} isPaused={isPaused} />
            <div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">{t('teacherTitle', { topic: topicName })}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300" aria-live="polite">{statusText}</p>
            </div>
        </div>
      </div>
      <div className="flex-grow overflow-y-auto my-4 pr-2 space-y-4">
        {messages.map((msg, index) => {
          const cleanedText = cleanTextForDisplay(msg.text);
          const sentences = cleanedText.match(/([^\.!\?]+[\.!\?]+)|([^\.!\?]+$)/g)?.filter(s => s.trim().length > 0) || [cleanedText];
          return (
            <div key={index} className={`flex items-start gap-2 ${msg.sender === MessageSender.USER ? 'justify-end' : 'justify-start'}`}>
              {msg.sender === MessageSender.AI && <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${topic.gradient} flex-shrink-0 mt-1`}></div>}
              <div className={`p-3 rounded-2xl text-base ${
                msg.sender === MessageSender.USER
                  ? 'max-w-xs md:max-w-md lg:max-w-lg bg-blue-500 text-white rounded-br-none'
                  : 'max-w-md md:max-w-xl lg:max-w-2xl bg-glass-light dark:bg-glass-dark backdrop-blur-3xl border border-border-light dark:border-border-dark text-gray-800 dark:text-gray-200 rounded-bl-none'
              }`}>
                <div className="leading-relaxed">
                    {sentences.map((sentence, sentenceIndex) => (
                      <span
                        key={sentenceIndex}
                        onClick={() => handleSpeak(msg, index, sentenceIndex)}
                        className={`cursor-pointer px-1 rounded transition-colors duration-200 ease-in-out ${
                          index === spokenMessageIndex && sentenceIndex === currentSentenceIndex
                            ? 'bg-purple-500/20 dark:bg-purple-400/20'
                            : 'bg-transparent hover:bg-purple-500/10'
                        }`}
                      >
                        {sentence}
                      </span>
                    ))}
                </div>
                {msg.videos && msg.videos.length > 0 && (
                  <div className="mt-3 -mb-1">
                    <div className="flex gap-3 pb-2 overflow-x-auto">
                      {msg.videos.map((video) => (
                        <VideoCard key={video.id} video={video} onPlayVideo={onPlayVideo} />
                      ))}
                    </div>
                  </div>
                )}
                {msg.quiz && <QuizUI quiz={msg.quiz} topic={topic} />}
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
          );
        })}
        {isLoading && (
            <div className="flex items-end gap-2 justify-start">
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${topic.gradient} flex-shrink-0 mt-1 animate-pulse`}></div>
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
      </div>

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

      <footer className="pt-4 border-t border-border-light dark:border-border-dark">
        <form onSubmit={handleFormSubmit} className="flex items-center gap-3">
            <button 
              type="button" 
              onClick={handleTogglePlayPause}
              disabled={isLoading || spokenMessageIndex === null}
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
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder={selectedSourceIds.size > 0 ? t('askAboutSources') : t('askQuestion')}
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
  );
};

export default ChatWindow;