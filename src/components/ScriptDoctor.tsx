import React, { useState, useContext } from 'react';
import { analyzeScript, ScriptAnalysisResult } from '../services/geminiService';
import { LoaderIcon } from './icons/LoaderIcon';
import { HelpIcon } from './icons/HelpIcon';
import HelpModal from './HelpModal';
import { LanguageContext } from '../contexts/LanguageContext';
import { translations } from '../translations';

const SCRIPT_TYPES = ['YouTube Video', 'Podcast', 'Short Film Dialogue', 'Advertisement Copy', 'Presentation', 'Documentary Narration', 'Video Game Dialogue', 'E-learning Module', 'Social Media Skit'];
const FOCUS_AREAS = ['Engagement & Hook', 'Pacing & Flow', 'Dialogue Polish', 'Overall Structure', 'Character Development', 'Clarity & Conciseness', 'Target Audience Appeal', 'Emotional Impact'];

const ScoreMeter: React.FC<{ score: number, language: 'en' | 'vi' }> = ({ score, language }) => {
    const t = translations.scriptDoctor;
    const percentage = score * 10;
    const color = percentage > 75 ? 'bg-green-500' : percentage > 40 ? 'bg-yellow-500' : 'bg-red-500';
    return (
        <div>
            <div className="flex justify-between mb-1">
                <span className="text-base font-medium text-white">{t.overallScore[language]}</span>
                <span className="text-sm font-medium text-white">{score}/10</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div className={`${color} h-2.5 rounded-full`} style={{ width: `${percentage}%` }}></div>
            </div>
        </div>
    );
}


const ScriptDoctor: React.FC = () => {
    const { language } = useContext(LanguageContext);
    const t = translations.scriptDoctor;
    const t_export = translations.exportButtons;


    const [script, setScript] = useState<string>('');
    const [scriptType, setScriptType] = useState<string>('YouTube Video');
    const [focus, setFocus] = useState<string>('Engagement & Hook');
    const [result, setResult] = useState<ScriptAnalysisResult | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);

    const handleSubmit = async () => {
        if (!script.trim()) {
            setError(t.errorScriptRequired[language]);
            return;
        }
        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const apiResult = await analyzeScript(script, scriptType, focus);
            setResult(apiResult);
            const currentCount = parseInt(localStorage.getItem('scriptJobsRun') || '0', 10);
            localStorage.setItem('scriptJobsRun', (currentCount + 1).toString());
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    };
    
    const formatReport = (format: 'txt' | 'md'): string => {
        if (!result) return "";

        const h1 = format === 'md' ? '# ' : '';
        const h2 = format === 'md' ? '## ' : '';
        const h3 = format === 'md' ? '### ' : '';
        const li = format === 'md' ? '* ' : '- ';
        const hr = format === 'md' ? '\n---\n' : '\n---------------------------------\n';
        const blockquote = (text: string) => format === 'md' ? `> ${text}` : `"${text}"`;

        return `
${h1}Script Analysis Report
${hr}
**Script Type:** ${scriptType}
**Analysis Focus:** ${focus}

${h2}Overall Score: ${result.overallScore} / 10
${hr}
${h3}Strengths
${result.strengths.map(s => `${li}${s}`).join('\n')}

${h3}Weaknesses
${result.weaknesses.map(w => `${li}${w}`).join('\n')}

${h3}Actionable Suggestions
${result.suggestions.map(s => `${li}**${s.area}:** ${s.suggestion}`).join('\n')}

${h3}Dialogue Polish Examples
${result.dialoguePolish.map(d => `${blockquote(d.original)}\n${li}${d.polished}`).join('\n\n')}
        `.trim();
    };

    const handleExport = (format: 'txt' | 'md' | 'json') => {
        if (!result) return;
        
        let content: string;
        let mimeType: string;
        const filename = `script_analysis_report.${format}`;
        
        if (format === 'json') {
            content = JSON.stringify(result, null, 2);
            mimeType = 'application/json';
        } else {
            content = formatReport(format);
            mimeType = format === 'txt' ? 'text/plain' : 'text/markdown';
        }
        
        const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
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
            
            <div className="space-y-6">
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 space-y-4">
                    <div>
                        <label htmlFor="script" className="block text-sm font-medium text-gray-300 mb-2">{t.scriptLabel[language]}</label>
                        <textarea
                            id="script"
                            value={script}
                            onChange={(e) => setScript(e.target.value)}
                            placeholder={t.scriptPlaceholder[language]}
                            className="w-full h-64 p-4 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="script-type" className="block text-sm font-medium text-gray-300 mb-2">{t.scriptTypeLabel[language]}</label>
                            <select id="script-type" value={scriptType} onChange={(e) => setScriptType(e.target.value)} className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500">
                                {SCRIPT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="focus-area" className="block text-sm font-medium text-gray-300 mb-2">{t.focusLabel[language]}</label>
                            <select id="focus-area" value={focus} onChange={(e) => setFocus(e.target.value)} className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500">
                                {FOCUS_AREAS.map(f => <option key={f} value={f}>{f}</option>)}
                            </select>
                        </div>
                    </div>
                     <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="w-full sm:w-auto flex justify-center items-center px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-500 text-white font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    >
                        {isLoading ? <LoaderIcon className="animate-spin w-5 h-5 mr-2" /> : t.analyzeButton[language]}
                    </button>
                </div>
                
                {(isLoading || error || result) && (
                     <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                        <div className="flex justify-between items-center mb-4">
                           <h3 className="text-xl font-bold text-white">{t.reportTitle[language]}</h3>
                           {result && (
                            <div className="flex items-center space-x-2">
                                <button onClick={() => handleExport('txt')} className="px-3 py-1.5 bg-gray-700 text-xs text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors">
                                    {t_export.exportTXT[language]}
                                </button>
                                <button onClick={() => handleExport('md')} className="px-3 py-1.5 bg-gray-700 text-xs text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors">
                                    {t_export.exportMD[language]}
                                </button>
                                <button onClick={() => handleExport('json')} className="px-3 py-1.5 bg-gray-700 text-xs text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors">
                                    {t_export.exportJSON[language]}
                                </button>
                            </div>
                           )}
                        </div>
                        {isLoading && (
                            <div className="flex flex-col items-center justify-center py-10">
                                <LoaderIcon className="animate-spin w-12 h-12 text-purple-500" />
                                <p className="mt-4 text-gray-400">{t.loadingText[language]}</p>
                            </div>
                        )}
                        {error && <div className="text-red-400 p-4 bg-red-900/50 rounded-lg">{error}</div>}
                        
                        {result && (
                            <div className="space-y-6 animate-fade-in">
                                <ScoreMeter score={result.overallScore} language={language} />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-gray-900/50 p-4 rounded-lg">
                                        <h4 className="font-bold text-green-400 mb-2">{t.strengths[language]}</h4>
                                        <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm">
                                            {result.strengths.map((s, i) => <li key={i}>{s}</li>)}
                                        </ul>
                                    </div>
                                    <div className="bg-gray-900/50 p-4 rounded-lg">
                                        <h4 className="font-bold text-yellow-400 mb-2">{t.weaknesses[language]}</h4>
                                        <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm">
                                            {result.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                                        </ul>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-bold text-sky-400 mb-2">{t.suggestions[language]}</h4>
                                    <div className="space-y-2">
                                        {result.suggestions.map((s, i) => (
                                            <div key={i} className="bg-gray-900/50 p-3 rounded-lg text-sm">
                                                <strong className="text-sky-300">{s.area}:</strong>
                                                <p className="text-gray-300">{s.suggestion}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                 <div>
                                    <h4 className="font-bold text-purple-400 mb-2">{t.dialoguePolish[language]}</h4>
                                    <div className="space-y-4 text-sm">
                                        {result.dialoguePolish.map((d, i) => (
                                            <div key={i} className="border-l-4 border-gray-700 pl-4">
                                                <p className="text-gray-400 italic">{t.original[language]}: "{d.original}"</p>
                                                <p className="text-purple-300">{t.suggestion[language]}: "{d.polished}"</p>
                                            </div>
                                        ))}
                                         {result.dialoguePolish.length === 0 && <p className="text-gray-500 text-sm italic">{t.noDialogueSuggestions[language]}</p>}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ScriptDoctor;