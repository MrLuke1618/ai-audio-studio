import React, { useState, useContext } from 'react';
import { generateTextToSpeech, TTSGenerationResult, generateTTScriptSuggestion } from '../services/geminiService';
import { LoaderIcon } from './icons/LoaderIcon';
import { HelpIcon } from './icons/HelpIcon';
import { HelpModal } from './HelpModal';
import { DownloadIcon } from './icons/DownloadIcon';
import { MagicWandIcon } from './icons/MagicWandIcon';
import { LanguageContext } from '../contexts/LanguageContext';
import { translations } from '../translations';

const VOICE_PROFILES = ['Aria (Female, US)', 'Leo (Male, UK)', 'Nova (Female, AU)', 'Atlas (Male, US - Deep)', 'Lily (Child, US)', 'Omar (Male, Arabic)', 'Kenji (Male, Japanese)'];
const EMOTIONAL_STYLES = ['Neutral', 'Cheerful', 'Sad', 'Angry', 'Professional', 'Whispering', 'Excited'];
const VOICE_EFFECTS = ['None', 'Radio', 'Telephone', 'Echo Chamber', 'Stadium Announcer', 'Robot'];


const WaveformVisualizer: React.FC = () => {
    const bars = Array.from({ length: 50 }, (_, i) => i);
    return (
      <div className="flex items-center justify-center h-16 space-x-0.5 bg-gray-900/50 rounded-lg overflow-hidden">
        {bars.map(i => (
          <div
            key={i}
            className="w-1 bg-teal-400 rounded-full"
            style={{
              height: `${Math.random() * 70 + 20}%`,
              animation: `wave ${Math.random() * 0.5 + 0.5}s infinite alternate`,
            }}
          />
        ))}
        <style>{`
            @keyframes wave {
                from { transform: scaleY(0.2); opacity: 0.7; }
                to { transform: scaleY(1); opacity: 1; }
            }
        `}</style>
      </div>
    );
};


const TextToSpeech: React.FC = () => {
    const { language } = useContext(LanguageContext);
    const t = translations.textToSpeech;

    const [text, setText] = useState<string>('');
    const [voice, setVoice] = useState<string>(VOICE_PROFILES[0]);
    const [emotion, setEmotion] = useState<string>(EMOTIONAL_STYLES[0]);
    const [voiceEffect, setVoiceEffect] = useState<string>(VOICE_EFFECTS[0]);
    const [speed, setSpeed] = useState<number>(1);
    const [pitch, setPitch] = useState<number>(0);

    const [result, setResult] = useState<TTSGenerationResult | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isSuggesting, setIsSuggesting] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);

    const handleSuggestScript = async () => {
        setIsSuggesting(true);
        setError(null);
        try {
            const suggestion = await generateTTScriptSuggestion();
            setText(suggestion);
        } catch (e: any) {
            setError(e.message || "Failed to get suggestion.");
        } finally {
            setIsSuggesting(false);
        }
    }

    const handleSubmit = async () => {
        if (!text.trim()) {
            setError(t.errorTextRequired[language]);
            return;
        }
        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const apiResult = await generateTextToSpeech(text, voice, emotion, speed, pitch, voiceEffect);
            setResult(apiResult);
            const currentCount = parseInt(localStorage.getItem('ttsJobsRun') || '0', 10);
            localStorage.setItem('ttsJobsRun', (currentCount + 1).toString());
             // Manually dispatch a storage event to update dashboard stats in real-time
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
                    <li><strong>{t.help11[language]}</strong>
                        <ul className="list-disc list-inside ml-4 mt-1 text-gray-400">
                            <li>{t.help12[language]}</li>
                            <li>{t.help13[language]}</li>
                        </ul>
                    </li>
                    <li><strong>{t.help14[language]}</strong> {t.help15[language]}</li>
                    <li><strong>{t.help16[language]}</strong> {t.help17[language]}</li>
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
                        <div className="flex justify-between items-center mb-2">
                            <label htmlFor="script" className="block text-sm font-medium text-gray-300">{t.textLabel[language]}</label>
                            <button onClick={handleSuggestScript} disabled={isSuggesting || isLoading} className="flex items-center px-3 py-1.5 bg-gray-700 text-xs text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                {isSuggesting ? <LoaderIcon className="animate-spin w-4 h-4 mr-2" /> : <MagicWandIcon className="w-4 h-4 mr-2" />}
                                {t.suggestButton[language]}
                            </button>
                        </div>
                        <textarea
                            id="script"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder={t.textPlaceholder[language]}
                            className="w-full h-48 p-4 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label htmlFor="voice-profile" className="block text-sm font-medium text-gray-300 mb-2">{t.voiceProfileLabel[language]}</label>
                            <select id="voice-profile" value={voice} onChange={(e) => setVoice(e.target.value)} className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500">
                                {VOICE_PROFILES.map(v => <option key={v} value={v}>{v}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="emotion-style" className="block text-sm font-medium text-gray-300 mb-2">{t.emotionLabel[language]}</label>
                            <select id="emotion-style" value={emotion} onChange={(e) => setEmotion(e.target.value)} className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500">
                                {EMOTIONAL_STYLES.map(e => <option key={e} value={e}>{e}</option>)}
                            </select>
                        </div>
                         <div>
                            <label htmlFor="voice-effect" className="block text-sm font-medium text-gray-300 mb-2">{t.voiceEffectLabel[language]}</label>
                            <select id="voice-effect" value={voiceEffect} onChange={(e) => setVoiceEffect(e.target.value)} className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500">
                                {VOICE_EFFECTS.map(e => <option key={e} value={e}>{e}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="speed" className="block text-sm font-medium text-gray-300 mb-2">{t.speedLabel[language]} ({speed.toFixed(2)}x)</label>
                        <input id="speed" type="range" min="0.5" max="2.0" step="0.05" value={speed} onChange={(e) => setSpeed(parseFloat(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-teal-500" />
                    </div>
                     <div>
                        <label htmlFor="pitch" className="block text-sm font-medium text-gray-300 mb-2">{t.pitchLabel[language]} ({pitch > 0 ? '+' : ''}{pitch.toFixed(1)})</label>
                        <input id="pitch" type="range" min="-5" max="5" step="0.1" value={pitch} onChange={(e) => setPitch(parseFloat(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-teal-500" />
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={isLoading || isSuggesting}
                        className="w-full flex justify-center items-center px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    >
                        {isLoading ? <LoaderIcon className="animate-spin w-5 h-5 mr-2" /> : t.generateButton[language]}
                    </button>
                </div>
                
                 <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 flex flex-col">
                    <h3 className="text-xl font-bold text-white mb-4">{t.resultsTitle[language]}</h3>
                    {isLoading && (
                        <div className="flex-grow flex items-center justify-center">
                            <div className="text-center">
                                <LoaderIcon className="animate-spin w-12 h-12 text-teal-500 mx-auto" />
                                <p className="mt-4 text-gray-400">{t.loadingText[language]}</p>
                            </div>
                        </div>
                    )}
                    {error && <div className="text-red-400 p-4 bg-red-900/50 rounded-lg">{error}</div>}
                    
                    {result && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="bg-gray-900 p-4 rounded-lg space-y-4">
                               <p className="text-sm text-gray-300 italic line-clamp-3">"{text}"</p>
                               <WaveformVisualizer />
                               <div className="flex items-center justify-between text-sm">
                                   <div className="text-gray-400">{voice}</div>
                                   <button disabled className="flex items-center px-3 py-1.5 bg-gray-700 text-xs text-white font-semibold rounded-lg opacity-50 cursor-not-allowed">
                                        <DownloadIcon className="w-4 h-4 mr-2" />
                                        Download .MP3
                                    </button>
                               </div>
                            </div>
                             <div className="text-center text-sm text-green-400 p-2 bg-green-900/50 rounded">
                                {result.confirmation}
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

export default TextToSpeech;