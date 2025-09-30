import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { ArrowLeftIcon, SearchIcon, YouTubeIcon, ThumbsUpIcon, ThumbsDownIcon, ShareIcon, BellIcon, SparklesIcon, UserIcon, ChevronDownIcon, CloseIcon, EnterTheaterModeIcon, ExitTheaterModeIcon } from './icons/GeneralIcons';
import type { VideoContent, VideoAnalysis, Topic } from '../types';
import { searchVideos, getVideoSearchSuggestions, getRelatedVideos } from '../services/youtubeService';
import { analyzeVideoContent } from '../services/geminiService';
import YouTubePlayer from './YouTubePlayer';
import { PRELOADED_VIDEOS } from '../preloadedVideos';
import { TOPICS } from '../constants';
import QuizUI from './QuizUI';
import VoiceTypingButton from './VoiceTypingButton';

const YOUTUBE_SEARCH_HISTORY_KEY = 'youtube_search_history';

const VideoCard: React.FC<{ video: VideoContent; onSelect: (video: VideoContent) => void; layout?: 'grid' | 'list' }> = ({ video, onSelect, layout = 'grid' }) => {
    // Shared part: video thumbnail
    const videoThumbnail = (
        <div className={`relative ${layout === 'grid' ? 'w-full aspect-video' : 'w-40 flex-shrink-0 aspect-video'} rounded-lg overflow-hidden`}>
            <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" loading="lazy" />
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <YouTubeIcon className="w-10 h-10 text-white" />
            </div>
            {video.duration && (
              <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/80 text-white text-xs font-semibold rounded">
                {video.duration}
              </div>
            )}
        </div>
    );

    // Shared part: video text details
    const videoDetails = (
        <div className="flex-1">
            <h3 className={`font-semibold text-gray-800 dark:text-white ${layout === 'grid' ? 'text-base' : 'text-sm'} line-clamp-2`}>{video.title}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">{video.channelTitle}</p>
            {(video.viewCount || video.publishedAt) && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    {video.viewCount}{video.viewCount && video.publishedAt && ' • '}{video.publishedAt}
                </p>
            )}
        </div>
    );

    if (layout === 'grid') {
        return (
            <button onClick={() => onSelect(video)} className="group w-full text-left transition-all duration-200 rounded-lg p-2 hover:bg-white/20 dark:hover:bg-black/20">
                {videoThumbnail}
                <div className="flex gap-3 mt-3">
                    {video.channelThumbnail ? (
                        <img src={video.channelThumbnail} alt={video.channelTitle} className="w-9 h-9 rounded-full flex-shrink-0 object-cover" />
                    ) : (
                        <div className="w-9 h-9 rounded-full bg-gray-300 dark:bg-gray-700 flex-shrink-0"></div>
                    )}
                    {videoDetails}
                </div>
            </button>
        );
    }

    // List layout for "Up Next"
    return (
        <button onClick={() => onSelect(video)} className="group w-full text-left flex gap-3 items-start transition-all duration-200 rounded-lg p-2 hover:bg-white/20 dark:hover:bg-black/20">
            {videoThumbnail}
            {videoDetails}
        </button>
    );
};

const VideoDetail: React.FC<{
    video: VideoContent;
    analysis: VideoAnalysis | null;
    isLoading: boolean;
    onTimestampClick: (ts: string) => void;
    isTheaterMode: boolean;
    toggleTheaterMode: () => void;
}> = ({ video, analysis, isLoading, onTimestampClick, isTheaterMode, toggleTheaterMode }) => {
    const { t } = useTranslation();
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isLinkCopied, setIsLinkCopied] = useState(false);
    
    const dummyTopic: Topic = { id: video.id, name: video.title, icon: YouTubeIcon, prompt: '', gradient: '' };

    const handleShare = async () => {
        const shareData = {
            title: video.title,
            text: `Check out this educational video: ${video.title}`,
            url: video.url,
        };

        if (navigator.share) { // Web Share API is preferred
            try {
                await navigator.share(shareData);
            } catch (error) {
                // Ignore AbortError which is thrown when the user cancels the share dialog
                if ((error as DOMException).name !== 'AbortError') {
                    console.error('Error sharing:', error);
                    alert(t('shareError'));
                }
            }
        } else { // Fallback to clipboard
            try {
                await navigator.clipboard.writeText(video.url);
                setIsLinkCopied(true);
                setTimeout(() => setIsLinkCopied(false), 2000); // Reset after 2 seconds
            } catch (err) {
                console.error('Failed to copy link:', err);
                alert(t('shareError'));
            }
        }
    };

    return (
        <div className="mt-4">
            <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">{video.title}</h1>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-3 gap-3">
                <div className="flex items-center gap-3">
                    {video.channelThumbnail ? (
                        <img src={video.channelThumbnail} alt={video.channelTitle} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">{video.channelTitle.charAt(0)}</div>
                    )}
                    <div>
                        <p className="font-semibold text-gray-800 dark:text-white">{video.channelTitle}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">1.2M subscribers</p>
                    </div>
                    <button onClick={() => setIsSubscribed(!isSubscribed)} className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-colors ${isSubscribed ? 'bg-white/30 dark:bg-black/30' : 'bg-gray-800 dark:bg-white text-white dark:text-black'}`}>
                        <BellIcon className="w-5 h-5"/>
                        <span>{t(isSubscribed ? 'subscribed' : 'subscribe')}</span>
                    </button>
                </div>
                <div className="flex items-center gap-2">
                     <button onClick={toggleTheaterMode} className="p-2.5 rounded-full bg-white/30 dark:bg-black/30 hover:bg-white/50 dark:hover:bg-black/50" aria-label={t('aria_toggleTheaterMode')}>
                       {isTheaterMode ? <ExitTheaterModeIcon className="w-5 h-5" /> : <EnterTheaterModeIcon className="w-5 h-5" />}
                    </button>
                    <div className="flex items-center bg-white/30 dark:bg-black/30 rounded-full">
                        <button className="flex items-center gap-2 px-4 py-2 hover:bg-white/50 dark:hover:bg-black/50 rounded-l-full border-r border-border-light dark:border-border-dark"><ThumbsUpIcon className="w-5 h-5" /> <span>12K</span></button>
                        <button className="px-4 py-2 hover:bg-white/50 dark:hover:bg-black/50 rounded-r-full"><ThumbsDownIcon className="w-5 h-5" /></button>
                    </div>
                    <button 
                        onClick={handleShare} 
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-white/30 dark:bg-black/30 rounded-full hover:bg-white/50 dark:hover:bg-black/50 transition-all w-28"
                        aria-label={t('aria_shareVideo')}
                    >
                        <ShareIcon className="w-5 h-5" /> 
                        <span>{isLinkCopied ? t('linkCopied') : t('share')}</span>
                    </button>
                </div>
            </div>
            <div className="mt-4 p-4 bg-glass-light dark:bg-glass-dark border border-border-light dark:border-border-dark rounded-xl backdrop-blur-3xl">
                 <div className="flex items-center gap-4 text-sm font-semibold mb-3">
                    {video.viewCount && <span>{video.viewCount}</span>}
                    {video.publishedAt && <span>{video.publishedAt}</span>}
                </div>
                 {isLoading ? (
                         <div className="text-center p-8 flex flex-col items-center justify-center">
                            <SparklesIcon className="w-10 h-10 text-purple-400 mb-4 animate-pulse"/>
                            <p className="font-semibold text-gray-700 dark:text-gray-300">{t('analysisLoading')}</p>
                         </div>
                    ) : analysis ? (
                        <div className="space-y-2">
                            <details className="group" open>
                                <summary className="flex justify-between items-center cursor-pointer p-2 -m-2 rounded-lg hover:bg-white/10 dark:hover:bg-black/10">
                                    <h3 className="text-lg font-bold flex items-center gap-2"><SparklesIcon className="w-5 h-5 text-purple-500"/>{t('summary')}</h3>
                                    <ChevronDownIcon className="w-5 h-5 transition-transform duration-300 group-open:rotate-180" />
                                </summary>
                                <p className="mt-2 text-sm leading-relaxed p-2">{analysis.summary}</p>
                            </details>
                             <details className="group">
                                <summary className="flex justify-between items-center cursor-pointer p-2 -m-2 rounded-lg hover:bg-white/10 dark:hover:bg-black/10">
                                    <h3 className="text-lg font-bold">{t('valuableSegments')}</h3>
                                    <ChevronDownIcon className="w-5 h-5 transition-transform duration-300 group-open:rotate-180" />
                                </summary>
                                <ul className="mt-2 space-y-2 text-sm">
                                {analysis.valuableSegments.map((seg, i) => (
                                    <li key={i} onClick={() => onTimestampClick(seg.timestamp)} className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/20 dark:hover:bg-black/20 cursor-pointer transition-colors">
                                        <div className="px-2 py-1 bg-purple-500/20 text-purple-800 dark:text-purple-200 rounded font-mono font-semibold">{seg.timestamp}</div>
                                        <p className="flex-1">{seg.description}</p>
                                    </li>
                                ))}
                                </ul>
                            </details>
                            <details className="group">
                                <summary className="flex justify-between items-center cursor-pointer p-2 -m-2 rounded-lg hover:bg-white/10 dark:hover:bg-black/10">
                                    <h3 className="text-lg font-bold">{t('keyConcepts')}</h3>
                                    <ChevronDownIcon className="w-5 h-5 transition-transform duration-300 group-open:rotate-180" />
                                </summary>
                                <div className="flex flex-wrap gap-2 mt-2 p-2">
                                    {analysis.keyConcepts.map((c, i) => <span key={i} className="px-3 py-1 bg-white/30 dark:bg-black/30 text-sm rounded-full">{c}</span>)}
                                </div>
                            </details>
                            <details className="group">
                                <summary className="flex justify-between items-center cursor-pointer p-2 -m-2 rounded-lg hover:bg-white/10 dark:hover:bg-black/10">
                                    <h3 className="text-lg font-bold">{t('relatedTopics')}</h3>
                                    <ChevronDownIcon className="w-5 h-5 transition-transform duration-300 group-open:rotate-180" />
                                </summary>
                                <div className="flex flex-wrap gap-2 mt-2 p-2">
                                    {analysis.relatedTopics.map((c, i) => <span key={i} className="px-3 py-1 bg-white/30 dark:bg-black/30 text-sm rounded-full">{c}</span>)}
                                </div>
                            </details>
                             <details className="group">
                                <summary className="flex justify-between items-center cursor-pointer p-2 -m-2 rounded-lg hover:bg-white/10 dark:hover:bg-black/10">
                                    <h3 className="text-lg font-bold">{t('knowledgeCheck')}</h3>
                                    <ChevronDownIcon className="w-5 h-5 transition-transform duration-300 group-open:rotate-180" />
                                </summary>
                                <QuizUI quiz={analysis.quiz} topic={dummyTopic} />
                            </details>
                        </div>
                    ) : (
                        <p className="text-center p-4 text-gray-600 dark:text-gray-400">AI analysis could not be generated for this video.</p>
                    )
                }
            </div>
        </div>
    )
}

const CommentsSection = () => {
    const { t } = useTranslation();
    return (
        <div className="mt-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg">{t('commentsCount', {count: 245})}</h3>
                <div className="flex items-center gap-2 text-sm">
                    <ChevronDownIcon className="w-5 h-5"/>
                    <span className="font-semibold">{t('sortby')}</span>
                </div>
            </div>
            <div className="flex items-start gap-3 mb-8">
                <UserIcon className="w-10 h-10 p-2 rounded-full bg-white/30 dark:bg-black/30" />
                <input type="text" placeholder={t('addComment')} className="w-full bg-transparent border-b-2 border-border-light dark:border-border-dark focus:border-purple-500 outline-none p-2 transition-colors" />
            </div>
            <div className="space-y-6">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-400 to-blue-500 flex-shrink-0"></div>
                    <div>
                        <p className="text-sm"><span className="font-semibold">Learner123</span> <span className="text-gray-500 dark:text-gray-400">2 months ago</span></p>
                        <p>This was incredibly helpful! The explanation at 5:23 really cleared things up for me.</p>
                    </div>
                </div>
                 <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-green-400 to-teal-500 flex-shrink-0"></div>
                    <div>
                        <p className="text-sm"><span className="font-semibold">CuriousCat</span> <span className="text-gray-500 dark:text-gray-400">1 month ago</span></p>
                        <p>Great video. Could you do a follow-up on quantum entanglement?</p>
                    </div>
                </div>
            </div>
        </div>
    )
};

const VideoGridSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="animate-pulse p-2">
                <div className="w-full aspect-video bg-white/20 dark:bg-black/20 rounded-lg"></div>
                <div className="mt-2 h-4 bg-white/20 dark:bg-black/20 rounded w-3/4"></div>
                <div className="mt-1 h-3 bg-white/20 dark:bg-black/20 rounded w-1/2"></div>
            </div>
        ))}
    </div>
);

const UpNextUI: React.FC<{
    videos: VideoContent[];
    onSelectVideo: (video: VideoContent) => void;
}> = ({ videos, onSelectVideo }) => {
    const { t } = useTranslation();

    return (
        <div className="w-full lg:w-96 flex-shrink-0">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">{t('upNext')}</h2>
            </div>
            
            <div className="space-y-3 lg:max-h-[calc(100vh-15rem)] lg:overflow-y-auto pr-1">
                {videos.map(video => (
                    <VideoCard key={video.id} video={video} onSelect={onSelectVideo} layout="list" />
                ))}
            </div>
        </div>
    );
};


const YouTubePage: React.FC<{
  onBack: () => void;
}> = ({ onBack }) => {
    const { t } = useTranslation();
    const [searchQuery, setSearchQuery] = useState('');
    const [videos, setVideos] = useState<VideoContent[]>([]);
    const [selectedVideo, setSelectedVideo] = useState<VideoContent | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [history, setHistory] = useState<string[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    
    const [analysis, setAnalysis] = useState<VideoAnalysis | null>(null);
    const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
    const [seekToTimestamp, setSeekToTimestamp] = useState<string | null>(null);
    const [isMiniplayer, setIsMiniplayer] = useState(false);
    
    const [isTheaterMode, setIsTheaterMode] = useState(false);

    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);
    const [hasMore, setHasMore] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const loaderRef = useRef<HTMLDivElement>(null);
    
    const [upNextVideos, setUpNextVideos] = useState<VideoContent[]>([]);
    
    const searchInputRef = useRef<HTMLInputElement>(null);
    const initialSearchPerformed = useRef(false);
    const playerContainerRef = useRef<HTMLDivElement>(null);
    const suggestionTimeoutRef = useRef<number | null>(null);

    useEffect(() => {
        try {
            const storedHistory = localStorage.getItem(YOUTUBE_SEARCH_HISTORY_KEY);
            setHistory(storedHistory ? JSON.parse(storedHistory) : []);
        } catch (e) { console.warn('Could not parse YouTube search history.', e); }
    }, []);

    const addSearchToHistory = (query: string) => {
        if (!query.trim()) return;
        const normalizedQuery = query.trim().toLowerCase();
        const newHistory = [query.trim(), ...history.filter(h => h.toLowerCase() !== normalizedQuery)].slice(0, 10);
        setHistory(newHistory);
        localStorage.setItem(YOUTUBE_SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
    };
    
    const fetchMoreVideos = useCallback(async () => {
        if (isFetchingMore || !hasMore || !nextPageToken) return;
        setIsFetchingMore(true);
        const query = activeCategory || searchQuery || t('educationHubDefaultSearch');
        const { videos: newVideos, nextPageToken: newNextPageToken } = await searchVideos(query, nextPageToken);
        if (newVideos.length > 0) {
            setVideos(prev => [...prev, ...newVideos]);
            setNextPageToken(newNextPageToken);
        }
        if (!newNextPageToken) {
            setHasMore(false);
        }
        setIsFetchingMore(false);
    }, [isFetchingMore, hasMore, activeCategory, searchQuery, nextPageToken, t]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    fetchMoreVideos();
                }
            },
            { threshold: 1.0 }
        );
        const currentLoader = loaderRef.current;
        if (currentLoader) {
            observer.observe(currentLoader);
        }
        return () => {
            if (currentLoader) {
                observer.unobserve(currentLoader);
            }
        };
    }, [fetchMoreVideos]);


    const handleSearch = useCallback(async (query: string, saveToHistory: boolean = true) => {
        if (!query.trim()) return;
        setIsLoading(true);
        setSelectedVideo(null);
        setAnalysis(null);
        setVideos([]);
        setNextPageToken(undefined);
        setHasMore(true);
        setActiveCategory(null);
        
        if(saveToHistory) addSearchToHistory(query);
        setShowHistory(false);
        setSuggestions([]);
        searchInputRef.current?.blur();
        
        try {
            const { videos: results, nextPageToken: newNextPageToken } = await searchVideos(query);
            setVideos(results.length > 0 ? results : PRELOADED_VIDEOS);
            setNextPageToken(newNextPageToken);
            if (!newNextPageToken || results.length < 12) {
                setHasMore(false);
            }
        } catch (error) {
            console.error('Search failed:', error);
            setVideos(PRELOADED_VIDEOS);
        } finally { setIsLoading(false); }
    }, []);
    
    const handleCategorySelect = (topic: Topic | null) => {
        const query = topic ? t(topic.name) : t('trending');
        setActiveCategory(topic ? t(topic.name) : null);
        setSearchQuery(topic ? t(topic.name) : '');
        handleSearch(query, false);
    };

    useEffect(() => {
        if (!initialSearchPerformed.current) {
            handleCategorySelect(null); // Start with trending
            initialSearchPerformed.current = true;
        }
    }, [t, handleSearch]);

    useEffect(() => {
        if (suggestionTimeoutRef.current) clearTimeout(suggestionTimeoutRef.current);
        if (searchQuery.trim().length >= 3 && showHistory) {
            suggestionTimeoutRef.current = window.setTimeout(async () => {
                const suggs = await getVideoSearchSuggestions(searchQuery);
                setSuggestions(suggs);
            }, 300);
        } else {
            setSuggestions([]);
        }
    }, [searchQuery, showHistory]);

    const handleSelectVideo = useCallback(async (video: VideoContent) => {
        setSelectedVideo(video);
        setAnalysis(null);
        setUpNextVideos([]); // Clear previous related videos
        window.scrollTo(0, 0);

        setIsLoadingAnalysis(true);
        const [analysisResult, relatedResult] = await Promise.all([
            analyzeVideoContent(video.title),
            getRelatedVideos(video)
        ]);
        
        setAnalysis(analysisResult);
        
        if (relatedResult.length > 0) {
            setUpNextVideos(relatedResult);
        } else {
            const currentIndex = videos.findIndex(v => v.id === video.id);
            const nextInSearch = (currentIndex !== -1 && currentIndex < videos.length - 1) 
                ? videos.slice(currentIndex + 1)
                : videos.filter(v => v.id !== video.id);
            setUpNextVideos(nextInSearch);
        }

        setIsLoadingAnalysis(false);

    }, [videos]);
    
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (!entry.isIntersecting && selectedVideo) setIsMiniplayer(true);
                else setIsMiniplayer(false);
            },
            { rootMargin: "0px", threshold: 0.1 }
        );
        const currentRef = playerContainerRef.current;
        if (currentRef) observer.observe(currentRef);
        return () => { if (currentRef) observer.unobserve(currentRef); };
    }, [selectedVideo]);
    

    return (
      <div className={`p-0 bg-transparent flex flex-col h-full animate-fade-in transition-colors duration-500 ${isTheaterMode && selectedVideo ? 'bg-black' : ''}`}>
            <header className="flex-shrink-0 w-full sticky top-[70px] z-20 bg-glass-light dark:bg-glass-dark backdrop-blur-3xl p-3 border-b border-border-light dark:border-border-dark rounded-t-2xl shadow-xl">
                <div className="flex items-center gap-2">
                    {!selectedVideo && <button onClick={onBack} className="p-2 rounded-full hover:bg-white/20 dark:hover:bg-black/20 transition-colors" aria-label={t('aria_goBack')}><ArrowLeftIcon className="w-6 h-6 text-gray-800 dark:text-white" /></button>}
                    <YouTubeIcon className="w-8 h-8 text-red-500 flex-shrink-0" />
                    <div className="flex-grow flex justify-center">
                        <div className="relative w-full max-w-xl">
                            <form onSubmit={(e) => { e.preventDefault(); handleSearch(searchQuery); }} className="flex">
                                <div className="relative flex-grow">
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onFocus={() => setShowHistory(true)}
                                        onBlur={() => setTimeout(() => {setShowHistory(false); setSuggestions([])}, 200)}
                                        placeholder={t('searchOnEducationHub')}
                                        className="w-full pl-5 pr-12 py-2 rounded-l-full bg-white/50 dark:bg-black/20 focus:ring-2 focus:ring-purple-500 border-y border-l border-border-light dark:border-border-dark outline-none transition text-gray-800 dark:text-white"
                                    />
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                        <VoiceTypingButton onTranscript={(transcript) => {
                                            setSearchQuery(transcript);
                                            handleSearch(transcript, true);
                                        }} />
                                    </div>
                                </div>
                                <button type="submit" className="px-5 py-2 rounded-r-full bg-white/80 dark:bg-black/30 hover:bg-white dark:hover:bg-black/50 border-y border-r border-border-light dark:border-border-dark">
                                    <SearchIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                                </button>
                            </form>
                            {(showHistory || suggestions.length > 0) && (
                                <div className="absolute top-full mt-2 w-full bg-glass-light dark:bg-glass-dark border border-border-light dark:border-border-dark rounded-lg shadow-2xl backdrop-blur-3xl z-20 animate-fade-in">
                                    <ul>
                                        {suggestions.map((sugg, i) => (
                                          <li key={`sugg-${i}`}><button onClick={() => { setSearchQuery(sugg); handleSearch(sugg); }} className="w-full text-left px-4 py-2 hover:bg-white/20 dark:hover:bg-black/20 flex items-center gap-2"><SparklesIcon className="w-4 h-4 text-purple-400"/> {sugg}</button></li>  
                                        ))}
                                        {suggestions.length > 0 && history.length > 0 && <hr className="border-border-light dark:border-border-dark"/>}
                                        {showHistory && history.map((item, index) => (
                                            <li key={index}><button onClick={() => { setSearchQuery(item); handleSearch(item); }} className="w-full text-left px-4 py-2 hover:bg-white/20 dark:hover:bg-black/20">{item}</button></li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                {!selectedVideo && (
                    <div className="w-full overflow-x-auto py-2 -mb-2 no-scrollbar">
                        <div className="flex items-center gap-3 w-max mx-auto px-4">
                            <button onClick={() => handleCategorySelect(null)} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${!activeCategory ? 'bg-gray-800 text-white dark:bg-white dark:text-black' : 'bg-white/30 dark:bg-black/30 hover:bg-white/50 dark:hover:bg-black/50'}`}>{t('trending')}</button>
                            {TOPICS.map(topic => (
                                <button key={topic.id} onClick={() => handleCategorySelect(topic)} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${activeCategory === t(topic.name) ? 'bg-gray-800 text-white dark:bg-white dark:text-black' : 'bg-white/30 dark:bg-black/30 hover:bg-white/50 dark:hover:bg-black/50'}`}>{t(topic.name)}</button>
                            ))}
                        </div>
                    </div>
                )}
            </header>

            <main className={`flex-grow p-4 bg-glass-light dark:bg-glass-dark backdrop-blur-3xl border-b border-l border-r border-border-light dark:border-border-dark rounded-b-2xl shadow-xl transition-colors duration-500 ${isTheaterMode && selectedVideo ? 'bg-black' : ''}`}>
                {selectedVideo ? (
                    <div className={`flex flex-col mx-auto ${isTheaterMode ? 'max-w-6xl' : 'max-w-full lg:flex-row gap-6'}`}>
                        <div className="w-full lg:flex-1">
                            <div ref={playerContainerRef} className={`transition-all duration-300 ${isMiniplayer ? 'opacity-0 pointer-events-none h-0' : 'opacity-100'}`}>
                                <YouTubePlayer video={selectedVideo} seekToTimestamp={seekToTimestamp} onTimestampHandled={() => setSeekToTimestamp(null)} />
                            </div>
                            <VideoDetail video={selectedVideo} analysis={analysis} isLoading={isLoadingAnalysis} onTimestampClick={setSeekToTimestamp} isTheaterMode={isTheaterMode} toggleTheaterMode={() => setIsTheaterMode(!isTheaterMode)} />
                             {!isTheaterMode && <CommentsSection />}
                        </div>
                        <div className={`${isTheaterMode ? 'w-full' : 'lg:w-96'}`}>
                            <UpNextUI videos={upNextVideos} onSelectVideo={handleSelectVideo} />
                             {isTheaterMode && <CommentsSection />}
                        </div>
                    </div>
                ) : (
                    <div className="w-full">
                        <h2 className="text-2xl font-bold mb-4 capitalize">{activeCategory || searchQuery || t('trendingVideos')}</h2>
                        {isLoading ? ( <VideoGridSkeleton/> ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {videos.map(video => (
                                    <VideoCard key={video.id} video={video} onSelect={handleSelectVideo} layout="grid" />
                                ))}
                            </div>
                        )}
                        <div ref={loaderRef} className="h-16 flex items-center justify-center">
                            {isFetchingMore && <div className="w-8 h-8 border-4 border-purple-300 border-t-purple-600 rounded-full animate-spin"></div>}
                        </div>
                    </div>
                )}
            </main>
            {selectedVideo && isMiniplayer && (
                 <div className="fixed bottom-4 right-4 w-[384px] max-w-[90vw] z-50 shadow-2xl animate-fade-in rounded-lg overflow-hidden bg-black">
                     <button
                        onClick={() => setSelectedVideo(null)}
                        className="absolute top-1 right-1 z-10 p-1 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors"
                        aria-label={t('aria_closeMiniplayer')}
                    >
                        <CloseIcon className="w-5 h-5" />
                    </button>
                    <YouTubePlayer video={selectedVideo} seekToTimestamp={seekToTimestamp} onTimestampHandled={() => setSeekToTimestamp(null)} />
                </div>
            )}
        </div>
    );
};

export default YouTubePage;