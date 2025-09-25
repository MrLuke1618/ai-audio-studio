import React, { useState, useContext } from 'react';
import { generateSoundEffect, SFXGenerationResult } from '../services/geminiService';
import { LoaderIcon } from './icons/LoaderIcon';
import { HelpIcon } from './icons/HelpIcon';
import HelpModal from './HelpModal';
import { DownloadIcon } from './icons/DownloadIcon';
import { LanguageContext } from '../contexts/LanguageContext';
import { translations } from '../translations';


const ENVIRONMENTS = ['None', 'Small Room', 'Large Hall', 'Outdoors', 'Underwater', 'Cave', 'In a Car', 'Forest'];

const GeneratedSFXCard: React.FC<{ title: string; description: string; filename: string }> = ({ title, description, filename }) => {
    const bars = Array.from({ length: 40 }, (_, i) => i);
    return (
        <div className="bg-gray-900/70 p-4 rounded-lg space-y-3 border border-gray-700/50">
             <div className="flex items-center justify-center h-12 space-x-0.5 overflow-hidden">
                {bars.map(i => (
                    <div
                        key={i}
                        className="w-1 bg-lime-400 rounded-full"
                        style={{
                            height: `${Math.random() * 60 + 15}%`,
                            animation: `wave ${Math.random() * 0.5 + 0.5}s infinite alternate`,
                        }}
                    />
                ))}
            </div>
            <div>
                <h4 className="font-bold text-white truncate">{title}</h4>
                <p className="text-xs text-gray-400 mt-1">{description}</p>
            </div>
            <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-700/50">
                <p className="text-gray-500 text-xs font-mono">{filename}</p>
                <button disabled className="flex items-center px-3 py-1.5 bg-gray-700 text-xs text-white font-semibold rounded-lg opacity-50 cursor-not-allowed">
                    <DownloadIcon className="w-4 h-4 mr-2" />
                    Download
                </button>
            </div>
             <style>{`
                @keyframes wave {
                    from { transform: scaleY(0.2); } to { transform: scaleY(1); }
                }
            `}</style>
        </div>
    );
};


const SFXGenerator: React.FC = () => {
    const { language } = useContext(LanguageContext);
    const t = translations.sfxGenerator;

    const [prompt, setPrompt] = useState<string>('');
    const [duration, setDuration] = useState<number>(3);
    const [environment, setEnvironment] = useState<string>(ENVIRONMENTS[0]);
    const [result, setResult] = useState<SFXGenerationResult | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);

    const handleSubmit = async () => {
        if (!prompt.trim()) {
            setError(t.errorPromptRequired[language]);
            return;
        }
        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const apiResult = await generateSoundEffect(prompt, duration, environment);
            setResult(apiResult);
            const currentCount = parseInt(localStorage.getItem('sfxJobsRun') || '0', 10);
            localStorage.setItem('sfxJobsRun', (currentCount + 1).toString());
            window.dispatchEvent(new Event('storage'));
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="animate-fade-in">
            <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} title={t.helpTitle[language]}>
                <p className="text-sm text-gray-400 mb-4">{t.help1[language]} <strong>{t.help2[language]}</strong></p>
                <ol className="list-decimal list-inside space-y-3 text-sm text-gray-300">
                    <li><strong>{t.help3[language]}</strong> {t.help4[language]}</li>
                    <li><strong>{t.help5[language]}</strong> {t.help6[language]}</li>
                    <li><strong>{t.help7[language]}</strong> {t.help8[language]}</li>
                    <li><strong>{t.help9[language]}</strong> {t.help10[language]}</li>
                    <li><strong>{t.help11[language]}</strong> {t.help12[language]}</li>
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
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="flex flex-col space-y-6">
                    <div>
                        <label htmlFor="sfx-prompt" className="block text-sm font-medium text-gray-300 mb-2">{t.promptLabel[language]}</label>
                        <textarea
                            id="sfx-prompt"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder={t.promptPlaceholder[language]}
                            className="w-full h-36 p-4 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                           <label htmlFor="duration" className="block text-sm font-medium text-gray-300 mb-2">{t.durationLabel[language]} ({duration.toFixed(1)}s)</label>
                           <input id="duration" type="range" min="0.5" max="10" step="0.1" value={duration} onChange={(e) => setDuration(parseFloat(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-lime-500" />
                        </div>
                        <div>
                            <label htmlFor="environment" className="block text-sm font-medium text-gray-300 mb-2">{t.environmentLabel[language]}</label>
                            <select id="environment" value={environment} onChange={(e) => setEnvironment(e.target.value)} className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500">
                                {ENVIRONMENTS.map(e => <option key={e} value={e}>{e}</option>)}
                            </select>
                        </div>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="w-full flex justify-center items-center px-6 py-3 bg-gradient-to-r from-lime-500 to-green-500 text-white font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    >
                        {isLoading ? <LoaderIcon className="animate-spin w-5 h-5 mr-2" /> : t.generateButton[language]}
                    </button>
                </div>
                
                 <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 flex flex-col">
                    <h3 className="text-xl font-bold text-white mb-4">{t.resultsTitle[language]}</h3>
                    {isLoading && (
                        <div className="flex-grow flex items-center justify-center">
                            <div className="text-center">
                                <LoaderIcon className="animate-spin w-12 h-12 text-lime-500 mx-auto" />
                                <p className="mt-4 text-gray-400">{t.loadingText[language]}</p>
                            </div>
                        </div>
                    )}
                    {error && <div className="text-red-400 p-4 bg-red-900/50 rounded-lg">{error}</div>}
                    
                    {result && (
                        <div className="space-y-4 animate-fade-in overflow-auto">
                           {result.generatedEffects.map((effect, index) => (
                               <GeneratedSFXCard key={index} {...effect} />
                           ))}
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

export default SFXGenerator;