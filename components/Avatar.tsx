
import React from 'react';

interface AvatarProps {
  isSpeaking: boolean;
  isLoading: boolean;
  isPaused: boolean;
  size?: 'small' | 'medium' | 'large';
}

const Avatar: React.FC<AvatarProps> = ({ isSpeaking, isLoading, isPaused, size = 'large' }) => {
  const outerRingClass = isSpeaking && !isPaused
    ? 'animate-pulse-slow'
    : isLoading
    ? 'animate-pulse' // A medium-speed pulse for thinking
    : 'animate-float'; // The idle floating animation

  const innerBodyClass = isLoading ? 'animate-thinking' : '';

  const mouthClass = isSpeaking && !isPaused
    ? 'animate-lip-sync'
    : isLoading
    ? 'scale-y-[0.35]' // A thin, thoughtful line
    : 'scale-y-50'; // The default idle mouth

  let containerSize, eyeGap, eyeSize, mouthSize, padding;

  switch (size) {
    case 'small':
      containerSize = 'w-10 h-10';
      eyeGap = 'gap-1.5 mb-1';
      eyeSize = 'w-1 h-1.5';
      mouthSize = 'w-4 h-0.5';
      padding = 'p-1';
      break;
    case 'medium':
      containerSize = 'w-16 h-16';
      eyeGap = 'gap-2.5 mb-1.5';
      eyeSize = 'w-2 h-2.5';
      mouthSize = 'w-6 h-1';
      padding = 'p-2';
      break;
    case 'large':
    default:
      containerSize = 'w-24 h-24 md:w-32 md:h-32';
      eyeGap = 'gap-4 mb-3';
      eyeSize = 'w-3 h-4';
      mouthSize = 'w-8 h-2';
      padding = 'p-4';
      break;
  }


  return (
    <div className={`relative ${containerSize} flex items-center justify-center flex-shrink-0`}>
      <div
        className={`absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 transition-transform duration-500 ${outerRingClass}`}
      ></div>
      <div
        className={`relative w-[90%] h-[90%] bg-white/30 dark:bg-black/20 rounded-full backdrop-blur-md flex flex-col items-center justify-center overflow-hidden ${padding} transition-transform duration-300 ${innerBodyClass}`}
      >
        {/* Eyes */}
        <div className={`flex ${eyeGap}`}>
          <div className={`${eyeSize} bg-white/70 dark:bg-white/50 rounded-full animate-blink`}></div>
          <div className={`${eyeSize} bg-white/70 dark:bg-white/50 rounded-full animate-blink [animation-delay:250ms]`}></div>
        </div>
        {/* Mouth */}
        <div 
          className={`${mouthSize} bg-white/70 dark:bg-white/50 rounded-full transition-transform duration-100 origin-center ${mouthClass}`}
        ></div>
      </div>
    </div>
  );
};

export default Avatar;