import React, { useState, useEffect } from 'react';
import { useTheme } from './hooks/useTheme';
import { useTextToSpeech } from './hooks/useTextToSpeech';
import type { Topic, VideoContent, SavedLesson, ChatMessage, Source } from './types';
import Header from './components/Header';
import TopicSelector from './components/TopicSelector';
import ChatWindow from './components/ChatWindow';
import SidebarMenu from './components/SidebarMenu';
import { useTranslation } from './contexts/LanguageContext';
import AllSubjectsPage from './components/AllSubjectsPage';
import FloatingBot from './components/FloatingBot';
import BotModal from './components/BotModal';
import { useSettings } from './contexts/SettingsContext';
import VideoPlayerModal from './components/VideoPlayerModal';
import NotebookLMPage from './components/NotebookLMPage';
import SavedLessons from './components/SavedLessons';
import QuizHistory from './components/QuizHistory';
import { TOPICS } from './constants';
import { useSources } from './hooks/useSources';
import StudioPage from './components/ImageStudioPage';
import YouTubePage from './components/YouTubePage';
import VoiceControl from './components/VoiceControl';

type View = 'main' | 'allSubjects' | 'notebooklm' | 'studio' | 'youtube';

const App: React.FC = () => {
  const [theme, toggleTheme] = useTheme();
  const { t, language } = useTranslation();
  const { isSpeaking, isPaused, speak, cancel, pause, resume } = useTextToSpeech(language);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState<View>('main');
  const [isBotModalOpen, setIsBotModalOpen] = useState(false);
  const [activeVideo, setActiveVideo] = useState<VideoContent | null>(null);
  const { isVoiceControlEnabled } = useSettings();
  const [savedLessons, setSavedLessons] = useState<SavedLesson[]>([]);
  const [replayMessages, setReplayMessages] = useState<ChatMessage[] | null>(null);
  const { sources, setSources } = useSources();
  const [notificationCount, setNotificationCount] = useState(3);
  const [replayTrigger, setReplayTrigger] = useState(0);

  useEffect(() => {
    const loadedLessons = JSON.parse(localStorage.getItem('saved-lessons') || '[]');
    setSavedLessons(loadedLessons);
  }, []);

  const handleReplay = (lesson: SavedLesson) => {
    const topic = TOPICS.find(t => t.name === lesson.topicName);
    if (topic) {
        setReplayMessages(lesson.messages);
        handleSelectTopic(topic);
    }
  };

  const handleDelete = (lessonId: string) => {
    const updatedLessons = savedLessons.filter(l => l.id !== lessonId);
    setSavedLessons(updatedLessons);
    localStorage.setItem('saved-lessons', JSON.stringify(updatedLessons));
  };


  const handleSelectTopic = (topic: Topic) => {
    cancel(); // Stop any speech when changing topics
    setActiveVideo(null); // Close any open video player
    setSelectedTopic(topic);
    setCurrentView('main'); // Switch back to the main view
  };
  
  const handleMenuToggle = () => {
      setIsMenuOpen(!isMenuOpen);
  }

  const handleBackClick = () => {
    cancel();
    setActiveVideo(null);
    setSelectedTopic(null);
    setReplayMessages(null); // Reset replay state
  };

  const handleCommand = (command: string) => {
    const lowerCaseCommand = command.toLowerCase();

    // Modal dismissal commands
    const closeKeywords = [t('voice_command_close').toLowerCase(), t('voice_command_dismiss').toLowerCase()];
    if (closeKeywords.some(kw => lowerCaseCommand.includes(kw))) {
        if(isBotModalOpen) setIsBotModalOpen(false);
        if(activeVideo) setActiveVideo(null);
        return;
    }

    // Context: In a chat session
    if (selectedTopic) {
      const backKeywords = [t('voice_command_back').toLowerCase(), t('voice_command_change_subject').toLowerCase()];
      if (backKeywords.some(kw => lowerCaseCommand.includes(kw))) {
        handleBackClick();
        return;
      }

      const replayKeywords = [t('voice_command_replay').toLowerCase(), t('voice_command_read_again').toLowerCase()];
      if (replayKeywords.some(kw => lowerCaseCommand.includes(kw))) {
        setReplayTrigger(c => c + 1);
        return;
      }
    }
    // Context: On the main page, no topic selected
    else if (currentView === 'main' && !selectedTopic) {
      const selectKeywords = [t('voice_command_select').toLowerCase(), t('voice_command_goto').toLowerCase()];
      for (const keyword of selectKeywords) {
        if (lowerCaseCommand.startsWith(keyword)) {
          const topicName = lowerCaseCommand.substring(keyword.length).trim();
          // FIX: Renamed `t` parameter in `find` to `topic` to avoid shadowing the translation function `t`.
          const matchedTopic = TOPICS.find(topic => t(topic.name).toLowerCase() === topicName);
          if (matchedTopic) {
            handleSelectTopic(matchedTopic);
            return;
          }
        }
      }
    }
  };

  const renderContent = () => {
    switch (currentView) {
      case 'allSubjects':
        return <AllSubjectsPage 
          onBack={() => setCurrentView('main')} 
          onSelectTopic={(topic) => {
            setReplayMessages(null);
            handleSelectTopic(topic);
          }} 
        />;
      case 'notebooklm':
        return <NotebookLMPage
          onBack={() => setCurrentView('main')}
          sources={sources}
          setSources={setSources}
        />;
      case 'studio':
        return <StudioPage onBack={() => setCurrentView('main')} />;
      case 'youtube':
        return <YouTubePage onBack={() => setCurrentView('main')} />;
      case 'main':
      default:
        return (
          <>
            {selectedTopic ? (
              <div className="flex flex-col flex-grow">
                <ChatWindow 
                  topic={selectedTopic}
                  isSpeaking={isSpeaking && !isBotModalOpen}
                  isPaused={isPaused && !isBotModalOpen}
                  speak={speak}
                  pause={pause}
                  resume={resume}
                  onPlayVideo={setActiveVideo}
                  initialMessages={replayMessages}
                  sources={sources}
                  setSources={setSources}
                  replayTrigger={replayTrigger}
                  onBack={handleBackClick}
                />
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                <TopicSelector 
                  selectedTopic={selectedTopic} 
                  onSelectTopic={(topic) => {
                    setReplayMessages(null);
                    handleSelectTopic(topic);
                  }}
                  onShowMore={() => setCurrentView('allSubjects')}
                />
                <div className="grid md:grid-cols-2 gap-6">
                    <SavedLessons savedLessons={savedLessons} onReplay={handleReplay} onDelete={handleDelete} />
                    <QuizHistory />
                </div>
                <div className="p-10 text-center bg-glass-light dark:bg-glass-dark border border-border-light dark:border-border-dark rounded-2xl shadow-2xl backdrop-blur-3xl transition-all duration-300 ease-out hover:shadow-2xl hover:-translate-y-1">
                  <h2 className="text-2xl font-bold">{t('welcomeTitle')}</h2>
                  <p className="mt-2 text-gray-600 dark:text-gray-300">{t('welcomeMessage')}</p>
                </div>
              </div>
            )}
          </>
        );
    }
  }

  const isAnyModalOpen = isBotModalOpen || !!activeVideo || isMenuOpen;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100 transition-colors duration-500 flex flex-col">
      <div className="fixed inset-0 -z-0 h-full w-full bg-gradient-to-br from-indigo-100/30 via-white to-sky-100/30 dark:from-gray-800 dark:via-gray-900 dark:to-black animate-gradient-bg bg-400%"></div>
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[-20%] left-[-20%] w-[60vw] h-[60vw] max-w-lg max-h-lg bg-purple-400/30 dark:bg-purple-600/20 rounded-full blur-3xl animate-move-orb-1"></div>
        <div className="absolute bottom-[-30%] right-[-10%] w-[70vw] h-[70vw] max-w-xl max-h-xl bg-sky-400/30 dark:bg-sky-600/20 rounded-full blur-3xl animate-move-orb-2"></div>
        <div className="hidden md:block absolute top-[20%] right-[20%] w-[40vw] h-[40vw] max-w-md max-h-md bg-pink-400/20 dark:bg-pink-600/10 rounded-full blur-3xl animate-move-orb-3"></div>
      </div>
      <div className="relative z-10 flex flex-col flex-grow">
        <SidebarMenu 
          isOpen={isMenuOpen} 
          onClose={() => setIsMenuOpen(false)} 
          notificationCount={notificationCount}
          onNavigateToNotebook={() => {
            cancel();
            setSelectedTopic(null);
            setActiveVideo(null);
            setCurrentView('notebooklm');
            setIsMenuOpen(false);
          }}
          onNavigateToStudio={() => {
            cancel();
            setSelectedTopic(null);
            setActiveVideo(null);
            setCurrentView('studio');
            setIsMenuOpen(false);
          }}
           onNavigateToYouTube={() => {
            cancel();
            setSelectedTopic(null);
            setActiveVideo(null);
            setCurrentView('youtube');
            setIsMenuOpen(false);
          }}
        />
        <Header theme={theme} toggleTheme={toggleTheme} onMenuClick={handleMenuToggle} />
        <main className={`container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 flex flex-col flex-grow ${!selectedTopic && currentView === 'main' ? 'justify-center' : ''}`}>
          {renderContent()}
        </main>
        <FloatingBot onOpen={() => setIsBotModalOpen(true)} />
        {isVoiceControlEnabled && <VoiceControl onCommand={handleCommand} isModalOpen={isAnyModalOpen} />}
        <BotModal 
          isOpen={isBotModalOpen} 
          onClose={() => setIsBotModalOpen(false)} 
          onPlayVideo={setActiveVideo}
          isSpeaking={isSpeaking && isBotModalOpen}
          isPaused={isPaused && isBotModalOpen}
          speak={speak}
          cancel={cancel}
          pause={pause}
          resume={resume}
          sources={sources}
          setSources={setSources}
        />
        <VideoPlayerModal 
          video={activeVideo} 
          onClose={() => setActiveVideo(null)} 
        />
      </div>
    </div>
  );
};

export default App;