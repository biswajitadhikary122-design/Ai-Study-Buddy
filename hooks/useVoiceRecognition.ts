import { useState, useEffect, useRef, useCallback } from 'react';

// FIX: Add type definitions for the Web Speech API to resolve TypeScript errors.
// These interfaces describe the shape of the browser's experimental SpeechRecognition objects.
interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

type SpeechRecognitionErrorCode =
  | 'no-speech'
  | 'aborted'
  | 'audio-capture'
  | 'network'
  | 'not-allowed'
  | 'service-not-allowed'
  | 'bad-grammar'
  | 'language-not-supported';

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: SpeechRecognitionErrorCode;
  readonly message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  start: () => void;
  stop: () => void;
}

interface VoiceRecognitionOptions {
  onResult: (transcript: string) => void;
  continuous?: boolean;
}

// @ts-ignore
// FIX: Renamed constant to avoid shadowing the global `SpeechRecognition` type.
const SpeechRecognitionImpl = window.SpeechRecognition || window.webkitSpeechRecognition;
const hasRecognitionSupport = !!SpeechRecognitionImpl;

export const useVoiceRecognition = ({ onResult, continuous = true }: VoiceRecognitionOptions) => {
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        // This can happen if start() is called again before 'end' event fires.
        console.error("Speech recognition error on start:", error);
        // We don't set isListening to false here because the 'end' or 'error' event will handle it.
      }
    }
  }, [isListening]);
  
  useEffect(() => {
    if (!hasRecognitionSupport) {
      return;
    }

    const recognition: SpeechRecognition = new SpeechRecognitionImpl();
    recognition.continuous = continuous;
    recognition.interimResults = true;
    recognition.lang = document.documentElement.lang || 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setInterimTranscript('');
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let final = '';
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setInterimTranscript(interim);
      if (final && onResultRef.current) {
        onResultRef.current(final.trim());
      }
    };
    
    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, [continuous]);

  useEffect(() => {
    if (recognitionRef.current) {
        recognitionRef.current.lang = document.documentElement.lang || 'en-US';
    }
  }, [document.documentElement.lang]);

  return {
    isListening,
    interimTranscript,
    startListening,
    stopListening,
    hasRecognitionSupport,
  };
};