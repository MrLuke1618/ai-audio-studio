import React, { useState, useContext } from 'react';
import { generateMusicDescription, MusicCompositionResult } from '../services/geminiService';
import { LoaderIcon } from './icons/LoaderIcon';
import { HelpIcon } from './icons/HelpIcon';
import HelpModal from './HelpModal';
import { CopyIcon } from './icons/CopyIcon';
import { LanguageContext } from '../contexts/LanguageContext';
import { translations } from '../translations';

const GENRES = ['Cinematic', 'Ambient', 'Electronic', 'Jazz', 'Lo-fi', 'Orchestral', 'Rock', 'Pop', 'Corporate', 'Acoustic Folk'];
const MOODS = ['Uplifting', 'Melancholic', 'Tense', 'Relaxing', 'Epic', 'Mysterious', 'Romantic', 'Energetic', 'Hopeful', 'Serious'];

const AIMusicComposer: React.FC = () => {
    const { language } = useContext(LanguageContext);
    const t = translations.aiMusicComposer;
    const t_export = translations.exportButtons;

    const [prompt, setPrompt] = useState<string>('');
    const [genre, setGenre] = useState<string>('Cinematic');
    const [mood, setMood] = useState<string>('Uplifting');
    const [duration, setDuration] = useState<number>(120);
    const [result, setResult] = useState<MusicCompositionResult | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
    const [copyText, setCopyText] = useState(t.copyButton[language]);
    
    React.useEffect(() => {
        setCopyText(t.copyButton[language]);
    }, [language, t.copyButton]);

    const handleSubmit = async () => {
        if (!prompt.trim()) {
            setError(t.errorPromptRequired[language]);
            return;
        }
        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const apiResult = await generateMusicDescription(prompt, genre, mood, duration);
            setResult(apiResult);
            const currentCount = parseInt(localStorage.getItem('musicJobsRun') || '0', 10);
            localStorage.setItem('musicJobsRun', (currentCount + 1).toString());
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    };
    
     const handleCopy = () => {
        if (result?.sunoAIPrompt) {
            navigator.clipboard.writeText(result.sunoAIPrompt);
            setCopyText(t.copiedButton[language]);
            setTimeout(() => setCopyText(t.copyButton[language]), 2000);
        }
    };

    const formatResultForTxt = (): string => {
        if (!result) return "";
        return `
Music Concept: ${result.title}
================================

Description:
${result.description}

Details:
- Genre: ${result.genre}
- Mood: ${result.mood}
- Tempo: ${result.tempoBPM} BPM
- Duration: ~${duration}s

Instruments:
${result.instruments.map(i => `- ${i}`).join('\n')}

Structure:
${result.structure.join(' → ')}

AI Music Generator Prompt (for Suno, etc.):
-------------------------------------------
${result.sunoAIPrompt}
        `.trim();
    };

    const handleExport = (format: 'txt' | 'json') => {
        if (!result) return;
        const filename = result.title.toLowerCase().replace(/[^a-z0-9]/g, '_');
        if (format === 'json') {
            const jsonString = JSON.stringify(result, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${filename}_concept.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } else {
            const textContent = formatResultForTxt();
            const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${filename}_concept.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    };


    return (
        <div className="animate-fade-in">
            <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} title={t.helpTitle[language]}>
                <p className="text-sm text-gray-400 mb-4">{t.help1[language]}</p>
                <ol className="list-decimal list-inside space-y-3 text-sm text-gray-300">
                    <li><strong>{t.help2[language]}</strong> {t.help3[language]}</li>
                    <li><strong>{t.help4[language]}</strong> {t.help5[language]}</li>
                    <li><strong>{t.help6[language]}</strong> {t.help7[language]}</li>
                    <li><strong>{t.help8[language]}</strong> {t.help9[language]}</li>
                    <li><strong>{t.help10[language]}</strong> {t.help11[language]}</li>
                </ol>
            </HelpModal>

            <div className="flex justify-between items-start mb-2">
                <div>
                    <h2 className="text-4xl font-extrabold text-white">{t.title[language]}</h2>
                    <p className="text-gray-400 mt-2 mb-8">{t.description[language]}</p>
                </div>
                <div className="flex items-center space-x-2">
                    <button onClick={() => setIsHelpOpen(true)} className="p-2 text-gray-400 hover:text-white transition-colors" aria-label="Help">
                        <HelpIcon className="w-6 h-6" />
                    </button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col space-y-6">
                    <div>
                        <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-2">{t.promptLabel[language]}</label>
                        <textarea
                            id="prompt"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder={t.promptPlaceholder[language]}
                            className="w-full h-36 p-4 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-gray-200"
                            aria-label="Music description prompt"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="genre" className="block text-sm font-medium text-gray-300 mb-2">{t.genreLabel[language]}</label>
                            <select id="genre" value={genre} onChange={(e) => setGenre(e.target.value)} className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500">
                                {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="mood" className="block text-sm font-medium text-gray-300 mb-2">{t.moodLabel[language]}</label>
                            <select id="mood" value={mood} onChange={(e) => setMood(e.target.value)} className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500">
                                {MOODS.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="duration" className="block text-sm font-medium text-gray-300 mb-2">{t.durationLabel[language]}</label>
                        <input
                            id="duration"
                            type="number"
                            value={duration}
                            onChange={(e) => setDuration(parseInt(e.target.value, 10))}
                            className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500"
                            min="10"
                            step="10"
                        />
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="w-full flex justify-center items-center px-6 py-3 bg-gradient-to-r from-fuchsia-600 to-pink-500 text-white font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    >
                        {isLoading ? <LoaderIcon className="animate-spin w-5 h-5 mr-2" /> : t.generateButton[language]}
                    </button>
                </div>
                
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-white">{t.resultsTitle[language]}</h3>
                        {result && (
                            <div className="flex items-center space-x-2">
                                <button onClick={() => handleExport('txt')} className="px-3 py-1.5 bg-gray-700 text-xs text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors">
                                    {t_export.exportTXT[language]}
                                </button>
                                <button onClick={() => handleExport('json')} className="px-3 py-1.5 bg-gray-700 text-xs text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors">
                                    {t_export.exportJSON[language]}
                                </button>
                            </div>
                        )}
                    </div>

                    {isLoading && (
                        <div className="flex-grow flex items-center justify-center">
                            <div className="text-center">
                                <LoaderIcon className="animate-spin w-12 h-12 text-fuchsia-500 mx-auto" />
                                <p className="mt-4 text-gray-400">{t.loadingText[language]}</p>
                            </div>
                        </div>
                    )}
                    {error && <div className="text-red-400 p-4 bg-red-900/50 rounded-lg">{error}</div>}
                    
                    {result && (
                        <div className="space-y-4 animate-fade-in overflow-auto">
                            <h4 className="text-2xl font-bold text-fuchsia-400">{result.title}</h4>
                            <p className="text-gray-300 text-sm italic">{result.description}</p>
                            <div className="grid grid-cols-2 gap-4 text-sm border-t border-gray-700 pt-4">
                                <div><strong className="text-gray-400 block">{t.genreLabel[language]}:</strong> {result.genre}</div>
                                <div><strong className="text-gray-400 block">{t.moodLabel[language]}:</strong> {result.mood}</div>
                                <div><strong className="text-gray-400 block">{t.tempoLabel[language]}:</strong> {result.tempoBPM} BPM</div>
                                <div><strong className="text-gray-400 block">{t.durationLabelShort[language]}:</strong> ~{duration}s</div>
                            </div>
                            <div>
                                <strong className="text-gray-400 block mb-2">{t.instrumentsLabel[language]}:</strong>
                                <div className="flex flex-wrap gap-2">
                                    {result.instruments.map((inst, i) => <span key={i} className="px-2 py-1 bg-gray-900 text-fuchsia-300 text-xs font-medium rounded-full">{inst}</span>)}
                                </div>
                            </div>
                             <div>
                                <strong className="text-gray-400 block mb-2">{t.structureLabel[language]}:</strong>
                                <p className="text-gray-300 text-sm">{result.structure.join(' → ')}</p>
                            </div>
                            <div className="border-t border-gray-700 pt-4">
                                <div className="flex justify-between items-center mb-2">
                                    <strong className="text-gray-400 block">{t.musicAIPromptLabel[language]}</strong>
                                    <button onClick={handleCopy} className="flex items-center px-3 py-1.5 bg-gray-700 text-xs text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors">
                                        <CopyIcon className="w-4 h-4 mr-2" />
                                        {copyText}
                                    </button>
                                </div>
                                <pre className="whitespace-pre-wrap text-gray-300 bg-gray-900 p-3 rounded-md font-mono text-sm">{result.sunoAIPrompt}</pre>
                            </div>
                        </div>
                    )}

                    {!isLoading && !result && !error && (
                        <div className="flex-grow flex items-center justify-center text-center text-gray-500">
                            <p>{t.resultsPlaceholder[language]}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AIMusicComposer;