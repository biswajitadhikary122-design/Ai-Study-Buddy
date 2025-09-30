
import { useState, useEffect, useCallback, useRef } from 'react';
import type { Language } from '../contexts/LanguageContext';

export interface SpeakOptions {
  onBoundary?: (event: SpeechSynthesisEvent) => void;
  onEnd?: () => void;
}

export const useTextToSpeech = (language: Language) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speechRate, setSpeechRate] = useState(1);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const onEndCallbackRef = useRef<(() => void) | null>(null);

  // Load and update the list of available voices when they change.
  useEffect(() => {
    const handleVoicesChanged = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    };

    if (window.speechSynthesis) {
      window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
      handleVoicesChanged(); // Also call it once to get initial list.
    }

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      }
    };
  }, []);

  // Select the best voice based on the current app language.
  useEffect(() => {
    if (voices.length > 0) {
      // Find a voice that matches the language code (e.g., 'en' matches 'en-US').
      const bestVoice = voices.find(voice => voice.lang.startsWith(language));
      // Fallback to the default voice, or the first available voice.
      setSelectedVoice(bestVoice || voices.find(voice => voice.default) || voices[0]);
    }
  }, [voices, language]);

  const cancel = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
      if (onEndCallbackRef.current) {
        onEndCallbackRef.current();
        onEndCallbackRef.current = null;
      }
    }
  }, []);

  const speak = useCallback((text: string, options?: SpeakOptions) => {
    if (!window.speechSynthesis) {
      console.warn("Text-to-speech is not supported in this browser.");
      return;
    }

    // Prevent errors from empty or whitespace-only text
    if (!text || !text.trim()) {
      if (options?.onEnd) {
        // Ensure dependent components can clean up their state (e.g., highlighting)
        options.onEnd();
      }
      return;
    }

    cancel(); // Cancel any ongoing speech to start fresh and trigger cleanup

    onEndCallbackRef.current = options?.onEnd || null;
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Use the selected language-specific voice.
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    utterance.lang = language; // Also set the lang property for better compatibility.
    utterance.rate = speechRate;
    
    utterance.onboundary = options?.onBoundary || null;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      if (onEndCallbackRef.current) {
        onEndCallbackRef.current();
        onEndCallbackRef.current = null;
      }
    };
    utterance.onerror = (e) => {
      // 'interrupted' and 'canceled' are not true errors in our case. They happen
      // when we programmatically stop speech to start a new one, which is expected.
      // We can safely ignore them to keep the console clean.
      if (e.error === 'interrupted' || e.error === 'canceled') {
        return;
      }

      // For any other actual error, log it for debugging.
      console.error(`Speech synthesis error: ${e.error}`, {
        text: text.substring(0, 100), // Log a snippet of the problematic text
        event: e,
      });

      // Ensure state is cleaned up on a real error.
      setIsSpeaking(false);
      setIsPaused(false);
      if (onEndCallbackRef.current) {
        onEndCallbackRef.current();
        onEndCallbackRef.current = null;
      }
    };
    window.speechSynthesis.speak(utterance);
  }, [speechRate, selectedVoice, language, cancel]);

  const pause = useCallback(() => {
    if (window.speechSynthesis && window.speechSynthesis.speaking && !isPaused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, [isPaused]);

  const resume = useCallback(() => {
    if (window.speechSynthesis && window.speechSynthesis.paused && isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  }, [isPaused]);

  useEffect(() => {
    // Cleanup function to stop any speech when the component unmounts.
    return () => {
      cancel();
    };
  }, [cancel]);

  return { isSpeaking, isPaused, speak, cancel, pause, resume, speechRate, setSpeechRate };
};
