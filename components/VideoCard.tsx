import React, { useState, useEffect } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { getWebsiteMetadata } from '../services/geminiService';
import type { VideoContent } from '../types';
import { PlayIcon, LinkIcon, YouTubeIcon } from './icons/GeneralIcons';

interface VideoCardProps {
  video: VideoContent;
  onPlayVideo: (video: VideoContent) => void;
}

const VideoCard: React.FC<VideoCardProps> = ({ video, onPlayVideo }) => {
  const { t } = useTranslation();
  const [thumbnail, setThumbnail] = useState(video.thumbnail);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchThumbnail = async () => {
      // This effect handles both fetching for web videos and updating for any video prop change.
      if (video.source === 'web' && !video.thumbnail) {
        setIsLoading(true);
        setThumbnail(''); // Clear previous thumbnail to avoid showing a stale image.
        const metadata = await getWebsiteMetadata(video.url);
        if (isMounted) {
          setThumbnail(metadata.imageUrl || ''); // Set new thumbnail or fallback to empty string.
        }
        setIsLoading(false);
      } else {
        // For YouTube videos or web videos with an existing thumbnail, just update the state.
        setThumbnail(video.thumbnail);
        setIsLoading(false); // Ensure loading is off.
      }
    };

    fetchThumbnail();

    return () => {
      isMounted = false; // Cleanup to prevent state updates on unmounted component.
    };
  }, [video]); // Re-run this effect whenever the video prop changes.
  
  const handleImageError = () => {
    // If a fetched thumbnail URL is broken, clear it to show the fallback icon.
    setThumbnail('');
  };

  return (
    <div className="w-48 flex-shrink-0">
      <button
        onClick={() => onPlayVideo(video)}
        className="relative w-full aspect-video group rounded-lg overflow-hidden shadow-md bg-white/20 dark:bg-black/20"
        aria-label={t('aria_playVideo', { videoTitle: video.title })}
      >
        {isLoading ? (
          <div className="w-full h-full animate-pulse bg-white/30 dark:bg-black/30"></div>
        ) : thumbnail ? (
          <img src={thumbnail} alt={video.title} className="w-full h-full object-cover" onError={handleImageError} />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-white p-2 text-center bg-gradient-to-br from-slate-600 to-slate-800">
            <LinkIcon className="w-8 h-8 opacity-70" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity opacity-0 group-hover:opacity-100">
          <PlayIcon className="w-10 h-10 text-white/80" />
        </div>
        {video.duration && (
            <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/80 text-white text-xs font-semibold rounded">
                {video.duration}
            </div>
        )}
        {video.source === 'youtube' && (
          <div className="absolute bottom-1 left-1 p-0.5 bg-black/60 rounded">
            <YouTubeIcon className="w-5 h-3" />
          </div>
        )}
      </button>
      <p className="text-xs mt-1.5 font-semibold text-gray-700 dark:text-gray-300 line-clamp-2" title={video.title}>
        {video.title}
      </p>
      <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {video.channelThumbnail && (
              <img src={video.channelThumbnail} alt="" className="w-5 h-5 rounded-full flex-shrink-0 object-cover" />
          )}
          <p className="truncate">{video.channelTitle}</p>
      </div>
      {(video.viewCount || video.publishedAt) && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
            {video.viewCount}{video.viewCount && video.publishedAt && ' \u2022 '}{video.publishedAt}
        </p>
      )}
    </div>
  );
};

export default VideoCard;