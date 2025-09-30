import type React from 'react';

export interface Topic {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  prompt: string;
  gradient: string;
}

export enum MessageSender {
  USER = 'user',
  AI = 'ai',
}

export type VideoSource = 'youtube' | 'web';

export interface VideoContent {
  id: string; // youtube video id or a unique id for web videos
  title: string;
  thumbnail: string;
  source: VideoSource;
  url: string; // full url for web videos, or youtube watch url
  description?: string;
  channelTitle: string;
  channelThumbnail?: string;
  duration?: string;
  viewCount?: string;
  publishedAt?: string;
}

export interface QuizQuestion {
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
}

export interface Quiz {
  questions: QuizQuestion[];
}

export interface ChatMessage {
  sender: MessageSender;
  text: string;
  videos?: VideoContent[];
  suggestedQuestions?: string[];
  quiz?: Quiz;
  feedback?: 'like' | 'dislike' | null;
}

export interface VideoAnalysis {
  summary: string;
  valuableSegments: {
    timestamp: string;
    description: string;
  }[];
  keyConcepts: string[];
  relatedTopics: string[];
  quiz: Quiz;
}

export interface Source {
  id: string;
  title: string;
  content: string;
}

export interface SavedLesson {
  id: string;
  topicName: string; // The key from constants, not the translated name
  timestamp: string;
  messages: ChatMessage[];
}

export interface QuizResult {
  id: string;
  topicName: string;
  score: number;
  total: number;
  timestamp: string;
}