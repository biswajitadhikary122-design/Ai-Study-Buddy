import { GoogleGenAI, Type } from "@google/genai";
import type { ChatMessage, VideoContent, Quiz, VideoAnalysis } from '../types';
import { MessageSender } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const getAIResponse = async (
  history: ChatMessage[],
  newUserMessage: string,
  systemInstruction: string
): Promise<{ text: string; videos?: VideoContent[], suggestedQuestions?: string[], quiz?: Quiz }> => {
  try {
    // Map the existing chat history and add the new message for context
    const contents = [
      ...history.map(msg => ({
        role: msg.sender === MessageSender.USER ? 'user' : 'model',
        parts: [{ text: msg.text }]
      })),
      {
        role: 'user',
        parts: [{ text: newUserMessage }]
      }
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                answer: { type: Type.STRING },
                suggestedQuestions: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                },
                quiz: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            questionText: { type: Type.STRING },
                            options: {
                                type: Type.ARRAY,
                                items: { type: Type.STRING }
                            },
                            correctAnswerIndex: { type: Type.INTEGER }
                        },
                        required: ['questionText', 'options', 'correctAnswerIndex']
                    }
                },
                videos: {
                    type: Type.ARRAY,
                    description: "An array of up to 3 relevant educational YouTube videos that allow embedding. Only include if highly relevant.",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            videoId: {
                                type: Type.STRING,
                                description: "The unique ID of the YouTube video.",
                            },
                            title: {
                                type: Type.STRING,
                                description: "The title of the YouTube video. Ensure any special characters like quotes are properly escaped for JSON.",
                            },
                            channelTitle: {
                                type: Type.STRING,
                                description: "The name of the YouTube channel that published the video. Ensure any special characters like quotes are properly escaped for JSON.",
                            },
                            channelThumbnailUrl: {
                                type: Type.STRING,
                                description: "The URL of the channel's avatar image."
                            },
                            duration: {
                                type: Type.STRING,
                                description: "The duration of the video, formatted as HH:MM:SS or MM:SS."
                            },
                            viewCount: {
                                type: Type.STRING,
                                description: "The approximate view count, e.g., '2.1M views'."
                            },
                            publishedAt: {
                                type: Type.STRING,
                                description: "The relative time of publishing, e.g., '3 weeks ago'."
                            }
                        },
                        required: ["videoId", "title", "channelTitle", "channelThumbnailUrl", "duration", "viewCount", "publishedAt"],
                    },
                }
            },
            required: ['answer', 'suggestedQuestions']
        },
        thinkingConfig: { thinkingBudget: 0 },
      },
    });
    
    let parsedResponse;
    try {
        parsedResponse = JSON.parse(response.text);
    } catch (e) {
        console.error("Failed to parse AI JSON response:", response.text, e);
        // Fallback to using the text directly if parsing fails, and no suggestions
        return { text: response.text, suggestedQuestions: [] };
    }

    const textResponse = parsedResponse.answer || "I'm not sure how to respond to that, can you ask another way?";
    const suggestedQuestions = parsedResponse.suggestedQuestions || [];
    const quiz = parsedResponse.quiz && parsedResponse.quiz.length > 0 ? { questions: parsedResponse.quiz } : undefined;

    // Process videos from the same response, removing the extra API call.
    const rawVideos = parsedResponse.videos || [];
    const videos: VideoContent[] = rawVideos.map((video: { videoId: string; title: string; channelTitle: string; channelThumbnailUrl: string; duration: string; viewCount: string; publishedAt: string; }) => ({
      id: video.videoId,
      title: video.title,
      channelTitle: video.channelTitle,
      channelThumbnail: video.channelThumbnailUrl,
      thumbnail: `https://i.ytimg.com/vi/${video.videoId}/sddefault.jpg`,
      source: 'youtube' as 'youtube',
      url: `https://www.youtube.com/watch?v=${video.videoId}`,
      duration: video.duration,
      viewCount: video.viewCount,
      publishedAt: video.publishedAt,
    }));

    return { text: textResponse, videos: videos, suggestedQuestions, quiz };
  } catch (error) {
    console.error("Error getting AI response:", error);
    return { text: "I'm sorry, I encountered an error. Please try again.", suggestedQuestions: [] };
  }
};

export const getGroundedAIResponse = async (
  history: ChatMessage[],
  newUserMessage: string,
  sourcesText: string
): Promise<{ text: string; suggestedQuestions?: string[] }> => {
  try {
    const systemInstruction = `You are a helpful AI assistant that answers questions based ONLY on the provided source documents. Do not use any external knowledge. If the answer is not in the sources, state that clearly.

SOURCES:
---
${sourcesText}
---
`;
    
    const contents = [
      ...history.map(msg => ({
        role: msg.sender === MessageSender.USER ? 'user' : 'model',
        parts: [{ text: msg.text }]
      })),
      {
        role: 'user',
        parts: [{ text: newUserMessage }]
      }
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                answer: { type: Type.STRING, description: "Your answer, based only on the provided sources." },
                suggestedQuestions: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "An array of three relevant follow-up questions a user might ask about the sources."
                },
            },
            required: ['answer', 'suggestedQuestions']
        },
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    let parsedResponse;
    try {
        parsedResponse = JSON.parse(response.text);
    } catch (e) {
        console.error("Failed to parse AI JSON response:", response.text, e);
        return { text: response.text, suggestedQuestions: [] };
    }
    
    const textResponse = parsedResponse.answer || "I could not find an answer in the provided sources.";
    const suggestedQuestions = parsedResponse.suggestedQuestions || [];
    
    return { text: textResponse, suggestedQuestions };

  } catch (error) {
    console.error("Error getting grounded AI response:", error);
    return { text: "I'm sorry, I encountered an error. Please try again.", suggestedQuestions: [] };
  }
};

export const analyzeVideoContent = async (videoTitle: string): Promise<VideoAnalysis | null> => {
    try {
        const prompt = `Analyze the educational content of a YouTube video titled "${videoTitle}". Provide a concise summary, identify key learning segments with timestamps in MM:SS format, list the main concepts discussed, suggest related topics for further learning, and create a short 3-question multiple-choice quiz to test understanding.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        summary: { type: Type.STRING, description: "A concise summary of the video's content." },
                        valuableSegments: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    timestamp: { type: Type.STRING, description: "Timestamp in MM:SS format, e.g., '02:15' or '15:31'." },
                                    description: { type: Type.STRING, description: "Description of what's taught at this timestamp." }
                                },
                                required: ['timestamp', 'description']
                            }
                        },
                        keyConcepts: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: "A list of the main concepts or terms."
                        },
                        relatedTopics: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: "A list of related topics for further study."
                        },
                        quiz: {
                            type: Type.OBJECT,
                            properties: {
                                questions: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            questionText: { type: Type.STRING },
                                            options: {
                                                type: Type.ARRAY,
                                                items: { type: Type.STRING }
                                            },
                                            correctAnswerIndex: { type: Type.INTEGER }
                                        },
                                        required: ['questionText', 'options', 'correctAnswerIndex']
                                    }
                                }
                            },
                            required: ['questions']
                        }
                    },
                    required: ['summary', 'valuableSegments', 'keyConcepts', 'relatedTopics', 'quiz']
                }
            }
        });

        const parsedResponse = JSON.parse(response.text);
        return parsedResponse as VideoAnalysis;

    } catch (error) {
        console.error("Error analyzing video content:", error);
        return null;
    }
};

export const getWebsiteMetadata = async (url: string): Promise<{ imageUrl?: string }> => {
  try {
    const prompt = `You are a web page analyzer. Your task is to extract just the main preview image URL (this is usually found in the 'og:image' meta tag) from the webpage at this URL: ${url}. Respond with ONLY the raw URL string for the image and absolutely nothing else.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    const imageUrl = response.text.trim();
    // Basic validation that it's a URL
    if (imageUrl && imageUrl.startsWith('http')) {
        return { imageUrl };
    }
    return {};
  } catch (error) {
    console.error(`Error fetching metadata for ${url}:`, error);
    return {};
  }
};

export const generateImage = async (prompt: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '1:1',
      },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
      return `data:image/jpeg;base64,${base64ImageBytes}`;
    }
    return null;
  } catch (error) {
    console.error("Error generating image:", error);
    return null;
  }
};

export const generateVideo = async (
  prompt: string,
  onProgress: (status: string, key: string) => void
): Promise<string | null> => {
  try {
    onProgress('Sending request to video model...', 'studioVideoProgress_sending');
    let operation = await ai.models.generateVideos({
      model: 'veo-2.0-generate-001',
      prompt: prompt,
      config: {
        numberOfVideos: 1,
      },
    });

    onProgress('Video generation started. This may take a few minutes...', 'studioVideoProgress_started');
    let pollCount = 0;
    while (!operation.done) {
      const waitTime = 10000; // 10 seconds
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      const progressMessageKeys = [
          'studioVideoProgress_warming',
          'studioVideoProgress_choreographing',
          'studioVideoProgress_rendering',
          'studioVideoProgress_polishing',
          'studioVideoProgress_preparing'
      ];
      onProgress('...', progressMessageKeys[pollCount % progressMessageKeys.length]);
      pollCount++;

      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    if (operation.response?.generatedVideos?.[0]?.video?.uri) {
      onProgress('Video generated! Downloading video data...', 'studioVideoProgress_downloading');
      const downloadLink = operation.response.generatedVideos[0].video.uri;
      const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
      if (!response.ok) {
        throw new Error(`Failed to download video: ${response.statusText}`);
      }
      const videoBlob = await response.blob();
      onProgress('Download complete.', 'studioVideoProgress_done');
      return URL.createObjectURL(videoBlob);
    }
    
    return null;
  } catch (error) {
    console.error("Error generating video:", error);
    return null;
  }
};