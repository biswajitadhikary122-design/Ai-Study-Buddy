import React from 'react';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import { MicrophoneIcon } from './icons/GeneralIcons';
import { useTranslation } from '../contexts/LanguageContext';

interface VoiceTypingButtonProps {
  onTranscript: (transcript: string) => void;
  className?: string;
}

const VoiceTypingButton: React.FC<VoiceTypingButtonProps> = ({ onTranscript, className }) => {
  const { t } = useTranslation();

  const handleResult = (transcript: string) => {
    onTranscript(transcript);
  };

  const { isListening, startListening, stopListening, hasRecognitionSupport } = useVoiceRecognition({
    onResult: handleResult,
    continuous: false, // Set to false for dictation-style input
  });

  if (!hasRecognitionSupport) {
    return null;
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`relative p-1 rounded-full transition-colors ${className} ${isListening ? 'text-red-500' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'}`}
      aria-label={t(isListening ? 'aria_stopDictation' : 'aria_startDictation')}
    >
      <MicrophoneIcon className="w-5 h-5" />
      {isListening && <div className="absolute -inset-0.5 rounded-full bg-red-500/20 animate-pulse"></div>}
    </button>
  );
};

export default VoiceTypingButton;
