import React, { useState, useEffect, useRef } from 'react';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import { useTranslation } from '../contexts/LanguageContext';
import { MicrophoneIcon } from './icons/GeneralIcons';

interface VoiceControlProps {
  onCommand: (command: string) => void;
  isModalOpen: boolean; 
}

const VoiceControl: React.FC<VoiceControlProps> = ({ onCommand, isModalOpen }) => {
  const { t } = useTranslation();
  const [lastTranscript, setLastTranscript] = useState('');
  const [showTranscript, setShowTranscript] = useState(false);
  const transcriptTimerRef = useRef<number | null>(null);

  const handleResult = (transcript: string) => {
    setLastTranscript(transcript);
    onCommand(transcript);
    setShowTranscript(true);
    if (transcriptTimerRef.current) {
      clearTimeout(transcriptTimerRef.current);
    }
    transcriptTimerRef.current = window.setTimeout(() => {
      setShowTranscript(false);
    }, 4000);
  };
  
  const {
    isListening,
    interimTranscript,
    startListening,
    stopListening,
    hasRecognitionSupport,
  } = useVoiceRecognition({ onResult: handleResult });

  useEffect(() => {
    // If a modal opens while listening, stop listening.
    if (isModalOpen && isListening) {
      stopListening();
    }
  }, [isModalOpen, isListening, stopListening]);

  if (!hasRecognitionSupport) {
    return null;
  }
  
  const transcriptToShow = isListening ? interimTranscript : (showTranscript ? lastTranscript : '');

  return (
    <>
      <div className={`fixed bottom-5 right-24 z-20 flex flex-col items-center gap-2 transition-opacity duration-300 ${isModalOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <div className={`transition-all duration-300 transform ${transcriptToShow ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}>
          <div className="px-4 py-2 bg-glass-dark border border-border-dark rounded-full shadow-lg backdrop-blur-3xl">
            <p className="text-white text-sm italic">{transcriptToShow || t('voice_listening')}</p>
          </div>
        </div>
        <button
          onClick={isListening ? stopListening : startListening}
          className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg
            ${isListening ? 'bg-red-500' : 'bg-gradient-to-r from-purple-500 to-pink-500'}`}
          aria-label={isListening ? 'Stop listening' : 'Start listening'}
        >
          {isListening && (
            <div className="absolute inset-0 rounded-full bg-red-400 animate-pulse-slow"></div>
          )}
          <MicrophoneIcon className="w-8 h-8 text-white" />
        </button>
      </div>
    </>
  );
};

export default VoiceControl;
