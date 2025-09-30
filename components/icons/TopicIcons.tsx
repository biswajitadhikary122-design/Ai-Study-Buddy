import React from 'react';

// Science & Nature: A laboratory beaker.
export const FlaskIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 8.25h13.5m-13.5 0a2.25 2.25 0 012.25-2.25h9a2.25 2.25 0 012.25 2.25v9.75a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25V8.25z" />
  </svg>
);

// Technology & Engineering: A microchip.
export const ChipIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 21v-1.5M15.75 3v1.5m0 16.5v-1.5m3.75-12H21m-18 0h1.5m15 3.75H21m-18 0h1.5M15.75 21v-1.5m-7.5 0v-1.5m7.5 0v-1.5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 7.5h6v9H9v-9z" />
  </svg>
);

// Humanities & Social Sciences: An open book.
export const BookIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
  </svg>
);

// Arts & Culture: An artist's palette.
export const PaletteIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.82m5.84-2.56a12.022 12.022 0 00-5.84-2.56m0 0a12.025 12.025 0 01-5.84 2.56m5.84-2.56V4.72a6 6 0 0112 0v2.92a6 6 0 01-5.84 7.38z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 14.25a2.25 2.25 0 01-2.25 2.25 2.25 2.25 0 01-2.25-2.25 2.25 2.25 0 012.25-2.25 2.25 2.25 0 012.25 2.25z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 11.25a2.25 2.25 0 01-2.25 2.25 2.25 2.25 0 01-2.25-2.25 2.25 2.25 0 012.25-2.25 2.25 2.25 0 012.25 2.25z" />
  </svg>
);

// Society & Human Development: A group of users.
export const UsersIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m-7.5-2.28a4.5 4.5 0 00-1.397 8.267 6.002 6.002 0 00-3.498 1.13M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12c0-3.516 2.24-6.503 5.25-7.733 3.01-.23 5.92.51 8.25 2.28M15 12a4.5 4.5 0 014.5 4.5v1.25m-16.5 0v-1.25c0-1.572.52-3.024 1.397-4.14M6.75 4.5a4.5 4.5 0 014.5 4.5v1.25m-12 0v-1.25c0-1.572.52-3.024 1.397-4.14" />
  </svg>
);

// Global & Practical Knowledge: A globe.
export const GlobeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 0a9.02 9.02 0 010-3.75 9.02 9.02 0 010 3.75z" />
  </svg>
);

// Personal & Everyday Life: A home icon.
export const HomeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a.75.75 0 011.06 0l8.955 8.955M3 10.5v8.25c0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75v-4.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75v4.5a.75.75 0 00.75.75h4.5a.75.75 0 00.75-.75V10.5M4.5 19.5h15" />
  </svg>
);

// Frontier & Emerging Fields: A rocket.
export const RocketIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.82m5.84-2.56a12.022 12.022 0 00-5.84-2.56m0 0V3.34a1.125 1.125 0 00-1.125-1.125h-1.5A1.125 1.125 0 006.94 3.34v8.29m1.125 0c-.225.534-.48.98-1.125 1.125m1.5-1.125a12.022 12.022 0 015.84 2.56" />
  </svg>
);

// Music: A musical note
export const MusicNoteIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
  </svg>
);