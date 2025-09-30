import React, { useState, useEffect } from 'react';
import type { Source } from '../types';

const STORAGE_KEY = 'ai-study-buddy-sources';

export const useSources = (): { sources: Source[], setSources: React.Dispatch<React.SetStateAction<Source[]>> } => {
  const [sources, setSources] = useState<Source[]>([]);

  useEffect(() => {
    try {
      const storedSources = localStorage.getItem(STORAGE_KEY);
      if (storedSources) {
        setSources(JSON.parse(storedSources));
      }
    } catch (error) {
      console.error("Failed to load sources from localStorage:", error);
      setSources([]);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sources));
    } catch (error) {
      console.error("Failed to save sources to localStorage:", error);
    }
  }, [sources]);

  return { sources, setSources };
};