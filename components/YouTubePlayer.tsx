import React, { useState, useEffect } from 'react';
import type { VideoContent } from '../types';

// This helper function remains useful for the 'start' parameter
const parseTimestamp = (ts: string): number => {
    const parts = ts.split(':').map(Number).reverse(); // [ss, mm, hh]
    let seconds = 0;
    if (parts.length > 0 && !isNaN(parts[0])) seconds += parts[0];
    if (parts.length > 1 && !isNaN(parts[1])) seconds += parts[1] * 60;
    if (parts.length > 2 && !isNaN(parts[2])) seconds += parts[2] * 3600;
    return seconds;
}

interface YouTubePlayerProps {
    video: VideoContent;
    seekToTimestamp?: string | null;
    onTimestampHandled?: () => void;
}

const YouTubePlayer: React.FC<YouTubePlayerProps> = ({ video, seekToTimestamp, onTimestampHandled }) => {
    const [embedUrl, setEmbedUrl] = useState('');

    useEffect(() => {
        let url = `https://www.youtube.com/embed/${video.id}?autoplay=1&rel=0&playsinline=1&modestbranding=1`;
        
        if (seekToTimestamp) {
            const seconds = parseTimestamp(seekToTimestamp);
            if (!isNaN(seconds)) {
                url += `&start=${seconds}`;
            }
            if(onTimestampHandled) onTimestampHandled();
        }

        setEmbedUrl(url);
    }, [video.id, seekToTimestamp, onTimestampHandled]);


    return (
        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
            {embedUrl && (
                <iframe
                    // Using a key ensures the iframe reloads when the video ID or seek time changes.
                    key={embedUrl} 
                    src={embedUrl}
                    title={video.title}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                ></iframe>
            )}
        </div>
    );
};

export default YouTubePlayer;