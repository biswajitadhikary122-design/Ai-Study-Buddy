import React from 'react';
import type { VideoContent } from '../types';
import { CloseIcon } from './icons/GeneralIcons';
import { useTranslation } from '../contexts/LanguageContext';

interface VideoPlayerModalProps {
  video: VideoContent | null;
  onClose: () => void;
}

const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({ video, onClose }) => {
  const { t } = useTranslation();

  if (!video) {
    return null;
  }

  const embedUrl = video.source === 'youtube'
    ? `https://www.youtube.com/embed/${video.id}?autoplay=1&rel=0`
    : video.url;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="video-player-title">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-3xl"
        aria-hidden="true"
      ></div>
      <div className="relative w-full max-w-3xl bg-glass-dark border border-border-dark rounded-2xl shadow-2xl backdrop-blur-3xl animate-scale-in p-4">
        <div className="flex justify-between items-center mb-2">
            <h2 id="video-player-title" className="text-lg font-bold text-white truncate pr-4">{video.title}</h2>
            <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/20 transition-colors flex-shrink-0"
                aria-label={t('aria_closeVideo')}
            >
                <CloseIcon className="w-6 h-6 text-white" />
            </button>
        </div>
        <div className="aspect-video bg-black rounded-lg overflow-hidden">
          <iframe
            src={embedUrl}
            title={video.title}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          ></iframe>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayerModal;