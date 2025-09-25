import React, { useState, useRef, useContext } from 'react';
import { generateDubbingScript } from '../services/geminiService';
import { LoaderIcon } from './icons/LoaderIcon';
import { HelpIcon } from './icons/HelpIcon';
import { HelpModal } from './HelpModal';
import { ImportIcon } from './icons/ImportIcon';
import { LanguageContext } from '../contexts/LanguageContext';
import { translations } from '../translations';


const LANGUAGES = [
  'Auto-detect', 'Spanish', 'French', 'German', 'Japanese', 'Mandarin', 'Russian', 'Vietnamese', 'Korean', 'Arabic'
];
const TONES = ['Default', 'Professional', 'Casual', 'Excited', 'Documentary', 'Cinematic', 'Mysterious', 'Humorous', 'Authoritative', 'Inspirational', 'Friendly'];
const BATCH_SEPARATOR = '\n\n---\n\n';
const CLONED_VOICES = ['Sample Voice A', 'Sample Voice B', 'Narrator Luke'];


interface DubbingResult {
    source: string;
    dubbedScript: string | null;
    error: string | null;
}

const DubbingStudio: React.FC = () => {
  const { language: currentLanguage } = useContext(LanguageContext);
  const t = translations.dubbingStudio;
  const t_export = translations.exportButtons;

  const [script, setScript] = useState<string>('');
  const [language, setLanguage] = useState<string>('Spanish');
  const [tone, setTone] = useState<string>('Default');
  const [results, setResults] = useState<DubbingResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isBatchMode, setIsBatchMode] = useState<boolean>(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [voiceSampleName, setVoiceSampleName] = useState('');
  const [selectedClonedVoice, setSelectedClonedVoice] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const voiceFileInputRef = useRef<HTMLInputElement>(null);
  const [activeAccordion, setActiveAccordion] = useState<number | null>(0);

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setScript(e.target?.result as string);
      };
      reader.readAsText(file);
    }
  };
  
  const handleVoiceSampleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
          setVoiceSampleName(file.name);
      }
  };

  const handleSubmit = async () => {
    if (!script.trim()) {
      setError(t.errorScriptRequired[currentLanguage]);
      return;
    }
    setIsLoading(true);
    setError(null);
    setResults([]);
    setProgress(0);
    setProgressText('');

    try {
        const scripts = isBatchMode ? script.split(BATCH_SEPARATOR).filter(s => s.trim() !== '') : [script];
        const newResults: DubbingResult[] = [];
        let successfulJobs = 0;

        for(let i = 0; i < scripts.length; i++) {
            const currentScript = scripts[i];
            setProgressText(`${t.progressText[currentLanguage]} ${i + 1} / ${scripts.length}...`);
            try {
                const result = await generateDubbingScript(currentScript, language, tone, voiceSampleName);
                newResults.push({ source: currentScript, dubbedScript: result, error: null });
                successfulJobs++;
            } catch (err: any) {
                newResults.push({ source: currentScript, dubbedScript: null, error: err.message });
            }
            setProgress(((i + 1) / scripts.length) * 100);
        }

        if (successfulJobs > 0) {
            const currentCount = parseInt(localStorage.getItem('dubbingJobsRun') || '0', 10);
            localStorage.setItem('dubbingJobsRun', (currentCount + successfulJobs).toString());
        }

        setResults(newResults);
        setActiveAccordion(0);

    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
      setProgress(0);
      setProgressText('');
    }
  };

  const formatResultsForTxt = (): string => {
    return results.map((res, i) => {
        const header = `--- ${t.resultForScript[currentLanguage].toUpperCase()} ${i + 1} ---`;
        if (res.error) {
            return `${header}\nError: ${res.error}`;
        }
        return `${header}\n${res.dubbedScript}`;
    }).join(BATCH_SEPARATOR);
  }

  const handleExport = () => {
    if (results.length === 0) return;
    const textContent = formatResultsForTxt();
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = isBatchMode ? 'batch_dubbing_scripts.txt' : `${language}_dubbing_script.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    if (results.length === 0) return;
    const jsonString = JSON.stringify(results, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dubbing_scripts.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    if (results.length === 0) return;

    const escapeCSV = (str: string | null) => {
        if (str === null) return '""';
        const s = String(str);
        return `"${s.replace(/"/g, '""')}"`;
    };

    const header = ['"Script Number"', '"Source Script"', '"Dubbed Script"', '"Error"'].join(',');
    const rows = results.map((res, i) => 
        [
            i + 1,
            escapeCSV(res.source),
            escapeCSV(res.dubbedScript),
            escapeCSV(res.error),
        ].join(',')
    );

    const csvContent = [header, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dubbing_scripts.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="animate-fade-in">
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} title={t.helpTitle[currentLanguage]}>
          <p className="text-sm text-gray-400 mb-4">{t.help1[currentLanguage]}</p>
          <ol className="list-decimal list-inside space-y-3 text-sm text-gray-300">
              <li><strong>{t.help2[currentLanguage]}</strong> {t.help3[currentLanguage]}</li>
              <li><strong>{t.help4[currentLanguage]}</strong> {t.help5[currentLanguage]}</li>
              <li><strong>{t.help6[currentLanguage]}</strong> {t.help7[currentLanguage]}</li>
              <li><strong>{t.help8[currentLanguage]}</strong> {t.help9[currentLanguage]}</li>
              <li><strong>{t.help10[currentLanguage]}</strong> {t.help11[currentLanguage]}</li>
              <li><strong>{t.help12[currentLanguage]}</strong> {t.help13[currentLanguage]}</li>
              <li><strong>{t.help14[currentLanguage]}</strong> {t.help15[currentLanguage]}</li>
          </ol>
      </HelpModal>

      <div className="flex justify-between items-start mb-2">
        <div>
          <h2 className="text-4xl font-extrabold text-white">{t.title[currentLanguage]}</h2>
          <p className="text-gray-400 mt-2 mb-8">{t.description[currentLanguage]}</p>
        </div>
        <div className="flex items-center space-x-2">
            <button onClick={() => setIsHelpOpen(true)} className="p-2 text-gray-400 hover:text-white transition-colors" aria-label="Help">
                <HelpIcon className="w-6 h-6" />
            </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="flex flex-col space-y-6">
          <div className="flex justify-between items-center">
            <label htmlFor="script" className="block text-sm font-medium text-gray-300">{t.originalScriptLabel[currentLanguage]}</label>
            <div className="flex items-center space-x-4">
               <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-400 hover:text-white transition-colors" aria-label="Import script">
                    <ImportIcon className="w-5 h-5" />
               </button>
               <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".txt" />
               <label className="flex items-center cursor-pointer">
                  <span className="mr-2 text-sm text-gray-400">{t.batchModeLabel[currentLanguage]}</span>
                  <div className="relative">
                    <input type="checkbox" checked={isBatchMode} onChange={() => setIsBatchMode(!isBatchMode)} className="sr-only" />
                    <div className="block bg-gray-700 w-10 h-6 rounded-full"></div>
                    <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isBatchMode ? 'translate-x-4 bg-purple-400' : ''}`}></div>
                  </div>
               </label>
            </div>
          </div>
          <textarea
            id="script"
            value={script}
            onChange={(e) => setScript(e.target.value)}
            placeholder={isBatchMode ? t.placeholderBatch[currentLanguage] : t.placeholderSingle[currentLanguage]}
            className="w-full h-48 p-4 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-gray-200"
            aria-label="Original Script Input"
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="language" className="block text-sm font-medium text-gray-300 mb-2">{t.targetLanguageLabel[currentLanguage]}</label>
              <select
                id="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-gray-200"
                aria-label="Target Language Selector"
              >
                {LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="tone" className="block text-sm font-medium text-gray-300 mb-2">{t.adaptToneLabel[currentLanguage]}</label>
              <select
                id="tone"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-gray-200"
                aria-label="Tone Selector"
              >
                {TONES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-4 space-y-4">
            <p className="text-sm font-medium text-gray-300">{t.voiceCloningLabel[currentLanguage]}</p>
            <div className="flex items-center space-x-2 p-3 bg-gray-800 border border-gray-700 rounded-lg">
                <button onClick={() => voiceFileInputRef.current?.click()} className="px-3 py-1.5 bg-gray-700 text-xs text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors">{t.uploadSampleButton[currentLanguage]}</button>
                <input type="file" ref={voiceFileInputRef} onChange={handleVoiceSampleImport} className="hidden" accept="audio/*" />
                <span className="text-xs text-gray-400 truncate flex-1">{voiceSampleName || t.noVoiceSample[currentLanguage]}</span>
            </div>
             <select
                value={selectedClonedVoice}
                onChange={(e) => setSelectedClonedVoice(e.target.value)}
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-gray-200"
                aria-label="Cloned Voice Selector"
                disabled={!voiceSampleName}
              >
                <option value="">{voiceSampleName ? t.selectClonedVoice[currentLanguage] : t.uploadFirst[currentLanguage]}</option>
                {CLONED_VOICES.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
          </div>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full flex justify-center items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-500 text-white font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {isLoading ? <LoaderIcon className="animate-spin w-5 h-5 mr-2" /> : t.generateButton[currentLanguage]}
          </button>
           {isLoading && (
              <div className="w-full bg-gray-700 rounded-full h-2.5">
                  <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                  <p className="text-center text-xs text-gray-400 mt-1">{progressText}</p>
              </div>
            )}
        </div>
        
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-white">{t.resultsTitle[currentLanguage]}</h3>
            <div className="flex items-center space-x-2">
                <button onClick={handleExport} disabled={results.length === 0 || isLoading} className="px-3 py-1.5 bg-gray-700 text-xs text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    {t_export.exportTXT[currentLanguage]}
                </button>
                 <button onClick={handleExportCSV} disabled={results.length === 0 || isLoading} className="px-3 py-1.5 bg-gray-700 text-xs text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    {t_export.exportCSV[currentLanguage]}
                </button>
                 <button onClick={handleExportJSON} disabled={results.length === 0 || isLoading} className="px-3 py-1.5 bg-gray-700 text-xs text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    {t_export.exportJSON[currentLanguage]}
                </button>
            </div>
          </div>
          {isLoading && !results.length && (
            <div className="flex-grow flex items-center justify-center">
              <div className="text-center">
                <LoaderIcon className="animate-spin w-12 h-12 text-purple-500 mx-auto" />
                <p className="mt-4 text-gray-400">{progressText || t.loadingMagic[currentLanguage]}</p>
              </div>
            </div>
          )}
          {error && <div className="text-red-400 p-4 bg-red-900/50 rounded-lg">{error}</div>}
          
          {results.length > 0 && (
             <div className="space-y-2 overflow-auto">
                {results.map((result, index) => (
                    <div key={index} className="border border-gray-700 rounded-lg">
                        <button onClick={() => setActiveAccordion(activeAccordion === index ? null : index)} className="w-full flex justify-between items-center p-4 text-left">
                            <span className={`font-medium ${result.error ? 'text-red-400' : 'text-white'}`}>
                                {isBatchMode ? `${t.resultForScript[currentLanguage]} ${index + 1}`: t.result[currentLanguage]}
                            </span>
                            <svg className={`w-5 h-5 transition-transform text-gray-400 ${activeAccordion === index ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </button>
                        {activeAccordion === index && (
                            <div className="p-4 bg-gray-900/50">
                                {result.error && <p className="text-red-400">{result.error}</p>}
                                {result.dubbedScript && (
                                  <pre className="whitespace-pre-wrap text-gray-300 font-sans text-sm">{result.dubbedScript}</pre>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
          )}

          {!isLoading && results.length === 0 && !error && (
             <div className="flex-grow flex items-center justify-center text-center text-gray-500">
                <p>{t.resultsPlaceholder[currentLanguage]}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DubbingStudio;