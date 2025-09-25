import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const generateDubbingScript = async (script: string, targetLanguage: string, tone: string, voiceSampleName?: string): Promise<string> => {
    try {
        const toneInstruction = tone === 'Default' ? '' : `Critically, the script's tone must be adapted to be ${tone}.`;
        const voiceCloneInstruction = voiceSampleName ? `The translated script should be written in a style that is suitable for a voice actor whose voice sounds like the one in the sample file "${voiceSampleName}". This means capturing the cadence, emotion, and general speaking style implied by the sample.` : '';

        let prompt = `You are an expert script adapter for video dubbing. Translate the following script into ${targetLanguage}. Adapt the language to be natural for voice-over and maintain the original tone. ${toneInstruction} ${voiceCloneInstruction} Provide only the translated script. Script:\n\n${script}`;

        if (targetLanguage === 'Auto-detect') {
            prompt = `You are an expert script adapter for video dubbing. First, auto-detect the language of the provided script. Then, translate it into English. Adapt the language to be natural for voice-over and maintain the original tone. ${toneInstruction} ${voiceCloneInstruction} Provide only the translated script. Script:\n\n${script}`;
        }


        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });
        return response.text;
    } catch (error) {
        console.error("Error generating dubbing script:", error);
        throw new Error("Failed to generate dubbing script. Please check your API key and network connection.");
    }
};

export interface AudioAnalysisResult {
    vocalClarityScore: number;
    detectedIssues: string[];
    recommendedActions: string[];
    clarityImprovementTips: string[];
}

export const analyzeAudioForEnhancement = async (filename: string, preset: string): Promise<AudioAnalysisResult> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Act as a professional audio engineer. A user has 'uploaded' an audio file named "${filename}" and selected the "${preset}" preset for enhancement. Based on this preset, provide a hypothetical analysis. Do not state that you cannot process the file; instead, provide a typical analysis for such a scenario. Generate a vocal clarity score from 1-10 and provide specific, actionable tips.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        vocalClarityScore: { type: Type.NUMBER, description: 'A score from 1 to 10 for vocal clarity.' },
                        detectedIssues: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: 'List of detected audio issues (e.g., "Background hiss", "Plosives on P and B sounds").'
                        },
                        recommendedActions: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: 'List of recommended enhancement steps (e.g., "Apply Noise Reduction", "Use a De-Esser").'
                        },
                        clarityImprovementTips: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: 'Specific engineering tips to improve vocal clarity (e.g., "Apply a high-pass filter at 80Hz", "Use gentle compression with a 3:1 ratio").'
                        }
                    },
                    required: ["vocalClarityScore", "detectedIssues", "recommendedActions", "clarityImprovementTips"]
                },
            },
        });
        return JSON.parse(response.text);
    } catch (error) {
        console.error("Error analyzing audio:", error);
        throw new Error("Failed to analyze audio. Please check your API key and network connection.");
    }
};

export interface PodcastNotesResult {
    summary: string;
    keyTopics: { timestamp: string; topic: string }[];
    youtubeChapters: { timestamp: string; title: string }[];
    speakers: string[];
    editingNotes: string[];
    socialMediaSnippets: string[];
    blogPost: string;
}

export const generatePodcastEditingNotes = async (transcript: string, speakerNames?: string): Promise<PodcastNotesResult> => {
    try {
        const speakerInstruction = speakerNames ? `The known speakers are: ${speakerNames}. Use these names to identify who is speaking in the transcript. If you can identify them, list their names.` : 'Attempt to identify the different speakers in the transcript (e.g., "Speaker 1", "Host").';

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `You are an AI podcast production assistant. Analyze the following podcast transcript. ${speakerInstruction} Your main task is to generate a comprehensive set of production notes. This includes:
1. A brief summary.
2. A list of key topics with plausible timestamps.
3. A list of YouTube-friendly chapter titles with timestamps (starting at 00:00:00). These titles should be concise and engaging for a video audience.
4. A list of identified speakers.
5. Actionable editing notes (identifying filler words, long silences).
6. Engaging social media snippets.
7. A short, well-structured blog post based on the transcript.\n\nTranscript:\n${transcript}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        summary: { type: Type.STRING, description: 'A brief summary of the podcast episode.' },
                        keyTopics: {
                            type: Type.ARRAY,
                            description: 'A list of key topics discussed with approximate timestamps.',
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    timestamp: { type: Type.STRING, description: 'e.g., 00:02:15' },
                                    topic: { type: Type.STRING }
                                },
                                required: ["timestamp", "topic"]
                            }
                        },
                        youtubeChapters: {
                            type: Type.ARRAY,
                            description: 'A list of YouTube-friendly chapter titles with timestamps.',
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    timestamp: { type: Type.STRING, description: 'e.g., 00:00:00' },
                                    title: { type: Type.STRING, description: 'A concise and engaging chapter title for YouTube.' }
                                },
                                required: ["timestamp", "title"]
                            }
                        },
                        speakers: {
                            type: Type.ARRAY,
                            description: 'A list of speakers identified in the transcript.',
                            items: { type: Type.STRING }
                        },
                        editingNotes: {
                            type: Type.ARRAY,
                            description: 'Notes on filler words, long silences, or awkward phrasing.',
                            items: { type: Type.STRING }
                        },
                        socialMediaSnippets: {
                            type: Type.ARRAY,
                            description: 'Short, engaging quotes or snippets for social media.',
                            items: { type: Type.STRING }
                        },
                        blogPost: {
                            type: Type.STRING,
                            description: 'A short blog post generated from the podcast content, formatted with a title and paragraphs.'
                        }
                    },
                    required: ["summary", "keyTopics", "youtubeChapters", "speakers", "editingNotes", "socialMediaSnippets", "blogPost"]
                },
            }
        });
        return JSON.parse(response.text);
    } catch (error) {
        console.error("Error generating podcast notes:", error);
        throw new Error("Failed to generate podcast notes. Please check your API key and network connection.");
    }
};


export const generateSubtitles = async (transcript: string, language: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `You are an expert subtitle generator. Translate the following transcript to ${language} and then format the entire output as a standard .SRT subtitle file. Create plausible, sequential timestamps for each subtitle entry based on sentence length and natural speaking rhythm. The first timestamp should start around 00:00:01,000. Ensure the format is strictly adhered to (entry number, timestamp, text). Only output the raw SRT content and nothing else.\n\nTranscript:\n${transcript}`
        });
        return response.text;
    } catch (error) {
        console.error(`Error generating subtitles for ${language}:`, error);
        throw new Error(`Failed to generate subtitles for ${language}. Please check your API key and network connection.`);
    }
};

export interface MusicCompositionResult {
    title: string;
    description: string;
    genre: string;
    mood: string;
    instruments: string[];
    tempoBPM: number;
    structure: string[];
    sunoAIPrompt: string;
}

export const generateMusicDescription = async (prompt: string, genre: string, mood: string, duration: number): Promise<MusicCompositionResult> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Act as an expert music composer and producer. A user needs a description for a piece of royalty-free background music.
            User Prompt: "${prompt}"
            Genre: ${genre}
            Mood: ${mood}
            Duration: Approximately ${duration} seconds.
            
            Based on this, generate a detailed, creative, and practical description for the music track. This description should be useful for someone looking for music or for briefing a real composer.
            Finally, and most importantly, generate a detailed prompt that could be used with a music generation AI (like Suno AI). This prompt should be highly descriptive, comma-separated, and include style tags, instrumentation details, tempo, and mood keywords (e.g., 'epic cinematic score, orchestral, soaring strings, powerful brass section, triumphant, 120 bpm, motivational corporate video').
            `,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING, description: "A creative and fitting title for the track." },
                        description: { type: Type.STRING, description: "A one-paragraph description of the track, its vibe, and its ideal use case (e.g., 'for a corporate presentation', 'for a travel vlog')." },
                        genre: { type: Type.STRING, description: "The primary genre of the track." },
                        mood: { type: Type.STRING, description: "The primary mood or feeling of the track." },
                        instruments: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: "A list of the key instruments that would be featured in this track."
                        },
                        tempoBPM: { type: Type.NUMBER, description: "The estimated tempo in Beats Per Minute (BPM)." },
                        structure: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: "A simple list describing the structure of the song (e.g., 'Intro', 'Verse 1', 'Chorus', 'Bridge', 'Outro')."
                        },
                        sunoAIPrompt: {
                            type: Type.STRING,
                            description: "A detailed, descriptive prompt suitable for a music generation AI like Suno AI, including style tags and detailed instrumentation."
                        }
                    },
                    required: ["title", "description", "genre", "mood", "instruments", "tempoBPM", "structure", "sunoAIPrompt"]
                },
            },
        });
        return JSON.parse(response.text);
    } catch (error) {
        console.error("Error generating music description:", error);
        throw new Error("Failed to generate music description. Please check your API key and network connection.");
    }
};

export interface ScriptAnalysisResult {
    overallScore: number;
    strengths: string[];
    weaknesses: string[];
    suggestions: {
        area: string;
        suggestion: string;
    }[];
    dialoguePolish: {
        original: string;
        polished: string;
    }[];
}

export const analyzeScript = async (script: string, scriptType: string, focus: string): Promise<ScriptAnalysisResult> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Act as a professional script doctor and editor. Analyze the following script provided by a user.
            Script Type: ${scriptType}
            Main focus for analysis: ${focus}
            
            Provide a comprehensive, constructive, and actionable analysis. Your feedback should help the user improve their script significantly.
            
            Script to analyze:
            ---
            ${script}
            ---
            `,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        overallScore: { type: Type.NUMBER, description: "A score from 1-10 representing the overall quality of the script." },
                        strengths: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: "A list of 2-3 key strengths of the script."
                        },
                        weaknesses: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: "A list of 2-3 key weaknesses or areas for improvement."
                        },
                        suggestions: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    area: { type: Type.STRING, description: "The area of the suggestion (e.g., 'Pacing', 'Opening Hook', 'Clarity')." },
                                    suggestion: { type: Type.STRING, description: "A specific, actionable suggestion for improvement." }
                                },
                                required: ["area", "suggestion"]
                            },
                            description: "A list of concrete suggestions for improving the script."
                        },
                        dialoguePolish: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    original: { type: Type.STRING, description: "An example sentence or phrase of dialogue from the script." },
                                    polished: { type: Type.STRING, description: "A revised, improved version of that dialogue." }
                                },
                                required: ["original", "polished"]
                            },
                            description: "Examples of how specific lines of dialogue could be polished for better impact."
                        }
                    },
                    required: ["overallScore", "strengths", "weaknesses", "suggestions", "dialoguePolish"]
                },
            },
        });
        return JSON.parse(response.text);
    } catch (error) {
        console.error("Error analyzing script:", error);
        throw new Error("Failed to analyze script. Please check your API key and network connection.");
    }
};

export interface TTSGenerationResult {
    confirmation: string;
    fileName: string;
}

export const generateTextToSpeech = async (
    text: string,
    voice: string,
    emotion: string,
    speed: number,
    pitch: number,
    voiceEffect: string
): Promise<TTSGenerationResult> => {
    // This is a simulation. In a real scenario, this would call a TTS API.
    // The Gemini API does not currently have a direct text-to-speech model in the SDK,
    // so we will simulate the generation process.
    try {
        // Construct a descriptive prompt as if we were asking a generative model to script this.
        const prompt = `
            Generate an audio file from the following text with these parameters:
            - Text: "${text}"
            - Voice Profile: "${voice}"
            - Emotion/Style: "${emotion}"
            - Speech Speed: ${speed}x
            - Pitch Adjustment: ${pitch > 0 ? '+' : ''}${pitch}
            - Voice Effect: "${voiceEffect}"
            
            The output should be a high-quality audio file. The model should also interpret syntax like [pause:1s] for pauses and *word* for emphasis.
        `;

        // Simulate API call latency
        await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
        
        console.log("Simulating TTS generation with prompt:", prompt);

        // Simulate a successful response
        const sanitizedText = text.substring(0, 20).replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        const sanitizedVoice = voice.split(' ')[0].toLowerCase();
        const fileName = `${sanitizedText}_${sanitizedVoice}.mp3`;
        
        return {
            confirmation: `Successfully generated audio for the provided text with the voice "${voice}".`,
            fileName: fileName,
        };

    } catch (error) {
        console.error("Error simulating TTS generation:", error);
        throw new Error("Failed to generate speech. Please try again.");
    }
};

export const generateTTScriptSuggestion = async (): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: "Generate a single, short, creative sentence (between 10 to 20 words) suitable for a text-to-speech demonstration. It should be interesting to hear. Examples: 'The velvet moon whispered secrets to the sleeping ocean.' or 'A symphony of chirping crickets filled the twilight air.' Do not include quotation marks in your response."
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error generating TT script suggestion:", error);
        throw new Error("Failed to generate script suggestion.");
    }
};

export interface StemSplitResult {
    confirmation: string;
    stems: { name: string; filename: string; }[];
}

export const splitAudioStems = async (
    filename: string,
    stemsToExtract: string[]
): Promise<StemSplitResult> => {
    // This is a simulation. In a real scenario, this would call a stem separation API.
    try {
        const prompt = `
            Simulate splitting the audio file "${filename}" into the following stems: ${stemsToExtract.join(', ')}.
            Generate a successful confirmation message and a list of output filenames.
        `;
        // Simulate API call latency
        await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1500));
        
        console.log("Simulating stem splitting with prompt:", prompt);

        const generatedStems = stemsToExtract.map(stem => {
            const sanitizedFilename = filename.split('.')[0].replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
            return {
                name: stem,
                filename: `${sanitizedFilename}_${stem.toLowerCase()}.wav`
            };
        });
        
        return {
            confirmation: `Successfully split "${filename}" into ${stemsToExtract.length} stems.`,
            stems: generatedStems,
        };

    } catch (error) {
        console.error("Error simulating stem splitting:", error);
        throw new Error("Failed to split audio. Please try again.");
    }
};

export interface SFXGenerationResult {
    generatedEffects: {
        title: string;
        description: string;
        filename: string;
    }[];
}

export const generateSoundEffect = async (
    prompt: string,
    duration: number,
    environment: string
): Promise<SFXGenerationResult> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Act as a professional sound designer. A user needs a sound effect.
            User Prompt: "${prompt}"
            Desired Duration: Approximately ${duration} seconds.
            Acoustic Environment: ${environment}.
            
            Generate three distinct variations of this sound effect. For each variation, provide a creative title and a brief, evocative description of what it sounds like. Also, provide a simple filename.
            `,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        generatedEffects: {
                            type: Type.ARRAY,
                            description: "A list of three sound effect variations.",
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    title: { type: Type.STRING, description: "A creative title for the sound effect (e.g., 'Alien Reactor Hum')." },
                                    description: { type: Type.STRING, description: "A brief, one-sentence description of the sound." },
                                    filename: { type: Type.STRING, description: "A simple filename for the sound effect (e.g., 'alien_reactor_hum_01.wav')." }
                                },
                                required: ["title", "description", "filename"]
                            }
                        }
                    },
                    required: ["generatedEffects"]
                },
            },
        });
        return JSON.parse(response.text);
    } catch (error) {
        console.error("Error generating sound effect:", error);
        throw new Error("Failed to generate sound effect. Please check your API key and network connection.");
    }
};