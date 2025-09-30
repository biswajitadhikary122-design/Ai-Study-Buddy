import type { VideoContent } from '../types';
import { SimpleCache } from './cache';
import { GoogleGenAI, Type } from "@google/genai";

// API Key provided by the user for direct YouTube Data API access
const YOUTUBE_API_KEY = 'AIzaSyDf2r6eFuxCc9uIXyYw01wRJklUdjNkjEw';
const API_BASE_URL = 'https://www.googleapis.com/youtube/v3';

// Caching setup for different API calls
const videoSearchCache = new SimpleCache<{ videos: VideoContent[], nextPageToken?: string }>();
const relatedVideosCache = new SimpleCache<VideoContent[]>();
const suggestionsCache = new SimpleCache<string[]>();

// Gemini instance is kept only for generating search suggestions
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

// --- Helper Functions to format data from YouTube API ---

const formatDuration = (isoDuration: string): string => {
    const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
    const matches = isoDuration.match(regex);

    if (!matches) return '0:00';

    const hours = matches[1] ? parseInt(matches[1], 10) : 0;
    const minutes = matches[2] ? parseInt(matches[2], 10) : 0;
    const seconds = matches[3] ? parseInt(matches[3], 10) : 0;

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const formatViewCount = (countStr: string): string => {
    const count = parseInt(countStr, 10);
    if (isNaN(count)) return '';

    if (count >= 1_000_000_000) return `${(count / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B views`;
    if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, '')}M views`;
    if (count >= 1_000) return `${(count / 1_000).toFixed(0)}K views`;
    return `${count} views`;
};

const formatPublishedAt = (isoDate: string): string => {
    const date = new Date(isoDate);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return `${Math.floor(interval)} year${Math.floor(interval) > 1 ? 's' : ''} ago`;
    interval = seconds / 2592000;
    if (interval > 1) return `${Math.floor(interval)} month${Math.floor(interval) > 1 ? 's' : ''} ago`;
    interval = seconds / 604800;
    if (interval > 1) return `${Math.floor(interval)} week${Math.floor(interval) > 1 ? 's' : ''} ago`;
    interval = seconds / 86400;
    if (interval > 1) return `${Math.floor(interval)} day${Math.floor(interval) > 1 ? 's' : ''} ago`;
    interval = seconds / 3600;
    if (interval > 1) return `${Math.floor(interval)} hour${Math.floor(interval) > 1 ? 's' : ''} ago`;
    interval = seconds / 60;
    if (interval > 1) return `${Math.floor(interval)} minute${Math.floor(interval) > 1 ? 's' : ''} ago`;
    return `just now`;
};

const processVideoItems = async (items: any[]): Promise<VideoContent[]> => {
    if (!items || items.length === 0) return [];
    
    const videoIds = items.map((item: any) => item.id.videoId || item.id).filter(Boolean).join(',');
    if (!videoIds) return [];

    // Fetch video details (duration, view count) in a single batch call
    const videosParams = new URLSearchParams({
        part: 'snippet,contentDetails,statistics',
        id: videoIds,
        key: YOUTUBE_API_KEY,
    });
    const videosResponse = await fetch(`${API_BASE_URL}/videos?${videosParams.toString()}`);
    if (!videosResponse.ok) throw new Error('YouTube videos API request failed');
    const videosData = await videosResponse.json();
    const videosMap = new Map<string, any>(videosData.items.map((item: any) => [item.id, item]));

    // Fetch channel thumbnails in a single batch call
    const channelIds = [...new Set(videosData.items.map((item: any) => item.snippet.channelId))].join(',');
    if (!channelIds) return [];

    const channelsParams = new URLSearchParams({
        part: 'snippet',
        id: channelIds,
        key: YOUTUBE_API_KEY,
    });
    const channelsResponse = await fetch(`${API_BASE_URL}/channels?${channelsParams.toString()}`);
    if (!channelsResponse.ok) throw new Error('YouTube channels API request failed');
    const channelsData = await channelsResponse.json();
    const channelThumbnails = new Map<string, string>();
    channelsData.items.forEach((channel: any) => {
        channelThumbnails.set(channel.id, channel.snippet.thumbnails.default.url);
    });

    // Combine all data into our VideoContent format
    return Array.from(videosMap.values()).map(item => ({
        id: item.id,
        title: item.snippet.title,
        thumbnail: `https://i.ytimg.com/vi/${item.id}/sddefault.jpg`,
        source: 'youtube' as const,
        url: `https://www.youtube.com/watch?v=${item.id}`,
        channelTitle: item.snippet.channelTitle,
        channelThumbnail: channelThumbnails.get(item.snippet.channelId) || '',
        duration: formatDuration(item.contentDetails.duration),
        viewCount: formatViewCount(item.statistics.viewCount),
        publishedAt: formatPublishedAt(item.snippet.publishedAt),
    }));
};

// --- Main API Functions ---

export const searchVideos = async (query: string, pageToken?: string): Promise<{ videos: VideoContent[], nextPageToken?: string }> => {
  if (!query.trim()) return { videos: [] };
  
  // Prioritize educational content by refining the search query
  const educationalQuery = `${query} educational`;

  const cacheKey = `yt-search:${educationalQuery.toLowerCase()}:${pageToken || '1'}`;
  const cachedResult = videoSearchCache.get(cacheKey);
  if (cachedResult) return cachedResult;

  try {
    const searchParams = new URLSearchParams({
        part: 'snippet',
        q: educationalQuery,
        type: 'video',
        videoEmbeddable: 'true', // Ensures we only get videos that can be played in the iframe
        maxResults: '12',
        key: YOUTUBE_API_KEY,
    });
    if (pageToken) searchParams.append('pageToken', pageToken);

    const searchResponse = await fetch(`${API_BASE_URL}/search?${searchParams.toString()}`);
    if (!searchResponse.ok) {
        console.error('YouTube Search API Error:', await searchResponse.text());
        throw new Error(`YouTube search API request failed with status ${searchResponse.status}`);
    }
    const searchData = await searchResponse.json();
    const videos = await processVideoItems(searchData.items);
    
    const result = { videos, nextPageToken: searchData.nextPageToken };
    videoSearchCache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error(`Error fetching YouTube videos for query "${query}":`, error);
    return { videos: [] };
  }
};

export const getRelatedVideos = async (video: VideoContent): Promise<VideoContent[]> => {
    const cacheKey = `yt-related:${video.id}`;
    const cachedResult = relatedVideosCache.get(cacheKey);
    if (cachedResult) return cachedResult;

    try {
        const searchParams = new URLSearchParams({
            part: 'snippet',
            relatedToVideoId: video.id,
            type: 'video',
            videoEmbeddable: 'true', // Also ensure related videos are embeddable
            maxResults: '10',
            key: YOUTUBE_API_KEY,
        });

        const searchResponse = await fetch(`${API_BASE_URL}/search?${searchParams.toString()}`);
        if (!searchResponse.ok) {
            console.error('YouTube Related Videos API Error:', await searchResponse.text());
            throw new Error(`YouTube related videos API request failed with status ${searchResponse.status}`);
        }
        const searchData = await searchResponse.json();
        const videos = await processVideoItems(searchData.items);
        
        relatedVideosCache.set(cacheKey, videos);
        return videos;
    } catch (error) {
        console.error(`Error fetching related videos for "${video.title}":`, error);
        return [];
    }
};

// This function remains using Gemini as the YouTube API doesn't have a direct equivalent for this kind of suggestion generation.
export const getVideoSearchSuggestions = async (query: string): Promise<string[]> => {
    if (query.trim().length < 3) return [];
    
    const cacheKey = `gemini-suggestions:${query.toLowerCase()}`;
    const cachedResult = suggestionsCache.get(cacheKey);
    if (cachedResult) return cachedResult;

    try {
        const prompt = `Based on the search query "${query}", generate a list of 5 relevant and concise search suggestions for finding educational videos.`;
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        suggestions: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        }
                    },
                    required: ["suggestions"]
                },
                thinkingConfig: { thinkingBudget: 0 }
            }
        });
        const parsedResponse = JSON.parse(response.text);
        const suggestions = parsedResponse.suggestions || [];
        suggestionsCache.set(cacheKey, suggestions);
        return suggestions;
    } catch (error) {
        console.error("Error fetching search suggestions:", error);
        return [];
    }
};