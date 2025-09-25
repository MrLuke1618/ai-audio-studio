import React, { useState, useRef, useContext } from 'react';
import { splitAudioStems, StemSplitResult } from '../services/geminiService';
import { LoaderIcon } from './icons/LoaderIcon';
import { HelpIcon } from './icons/HelpIcon';
import HelpModal from './HelpModal';
import { DownloadIcon } from './icons/DownloadIcon';
import { LanguageContext } from '../contexts/LanguageContext';
import { translations } from '../translations';


const STEMS = ['Vocals', 'Drums', 'Bass', 'Other'];

const SimulatedAudioPlayer: React.FC<{ name: string; filename: string }> = ({ name, filename }) => {
    const bars = Array.from({ length: 40 }, (_, i) => i);
    return (
        <div className="bg-gray-900/70 p-4 rounded-lg space-y-3">
            <div className="flex items-center justify-center h-12 space-x-0.5 overflow-hidden">
                {bars.map(i => (
                    <div
                        key={i}
                        className="w-1 bg-orange-400 rounded-full"
                        style={{
                            height: `${Math.random() * 60 + 15}%`,
                            animation: `wave ${Math.random() * 0.5 + 0.5}s infinite alternate`,
                        }}
                    />
                ))}
            </div>
            <div className="flex items-center justify-between text-sm">
                <div>
                    <p className="font-bold text-white">{name}</p>
                    <p className="text-gray-400 text-xs">{filename}</p>
                </div>
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

const StemSplitter: React.FC = () => {
    const { language } = useContext(LanguageContext);
    const t = translations.stemSplitter;

    const [filename, setFilename] = useState<string>('');
    const [selectedStems, setSelectedStems] = useState<string[]>(STEMS);
    const [result, setResult] = useState<StemSplitResult | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFilename(e.target.files[0].name);
        }
    };

    const handleStemToggle = (stem: string) => {
        setSelectedStems(prev =>
            prev.includes(stem) ? prev.filter(s => s !== stem) : [...prev, stem]
        );
    };

    const handleSubmit = async () => {
        if (!filename.trim()) {
            setError(t.errorFileRequired[language]);
            return;
        }
        if (selectedStems.length === 0) {
            setError(t.errorStemRequired[language]);
            return;
        }
        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const apiResult = await splitAudioStems(filename, selectedStems);
            setResult(apiResult);
            const currentCount = parseInt(localStorage.getItem('stemSplitterJobsRun') || '0', 10);
            localStorage.setItem('stemSplitterJobsRun', (currentCount + 1).toString());
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
                        <label className="block text-sm font-medium text-gray-300 mb-2">{t.fileLabel[language]}</label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md">
                            <div className="space-y-1 text-center">
                                <svg className="mx-auto h-12 w-12 text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                <div className="flex text-sm text-gray-500">
                                    <label htmlFor="file-upload" className="relative cursor-pointer bg-gray-800 rounded-md font-medium text-purple-400 hover:text-purple-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-900 focus-within:ring-purple-500">
                                        <span>{t.uploadButton[language]}</span>
                                        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="audio/*" ref={fileInputRef} />
                                    </label>
                                </div>
                                <p className="text-xs text-gray-500">{filename || t.fileTypes[language]}</p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">{t.stemsLabel[language]}</label>
                        <div className="grid grid-cols-2 gap-4">
                            {STEMS.map(stem => (
                                <label key={stem} className="flex items-center space-x-3 p-3 bg-gray-800 border border-gray-700 rounded-lg cursor-pointer hover:bg-gray-700/50 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={selectedStems.includes(stem)}
                                        onChange={() => handleStemToggle(stem)}
                                        className="h-5 w-5 rounded border-gray-600 bg-gray-900 text-orange-500 focus:ring-orange-500"
                                    />
                                    <span className="text-gray-200">{stem}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="w-full flex justify-center items-center px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    >
                        {isLoading ? <LoaderIcon className="animate-spin w-5 h-5 mr-2" /> : t.generateButton[language]}
                    </button>
                </div>
                
                 <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 flex flex-col">
                    <h3 className="text-xl font-bold text-white mb-4">{t.resultsTitle[language]}</h3>
                    {isLoading && (
                        <div className="flex-grow flex items-center justify-center">
                            <div className="text-center">
                                <LoaderIcon className="animate-spin w-12 h-12 text-orange-500 mx-auto" />
                                <p className="mt-4 text-gray-400">{t.loadingText[language]}</p>
                            </div>
                        </div>
                    )}
                    {error && <div className="text-red-400 p-4 bg-red-900/50 rounded-lg">{error}</div>}
                    
                    {result && (
                        <div className="space-y-4 animate-fade-in overflow-auto">
                           <div className="text-center text-sm text-green-400 p-2 bg-green-900/50 rounded">
                                {result.confirmation}
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {result.stems.map(stem => (
                                    <SimulatedAudioPlayer key={stem.name} name={stem.name} filename={stem.filename} />
                                ))}
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

export default StemSplitter;