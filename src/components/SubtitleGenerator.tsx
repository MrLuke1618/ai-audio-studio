import React, { useState, useRef, useContext } from 'react';
import { generateSubtitles } from '../services/geminiService';
import { LoaderIcon } from './icons/LoaderIcon';
import { HelpIcon } from './icons/HelpIcon';
import HelpModal from './HelpModal';
import { ImportIcon } from './icons/ImportIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { LanguageContext } from '../contexts/LanguageContext';
import { translations } from '../translations';


const LANGUAGES = [
  'Spanish', 'French', 'German', 'Japanese', 'Mandarin', 'Russian', 'Portuguese', 'Italian', 'Korean', 'Arabic', 'Vietnamese'
];

const BATCH_SEPARATOR = '\n\n---\n\n';

interface SubtitleResult {
  [language: string]: string | { error: string };
}

interface BatchResult {
    id: number;
    results: SubtitleResult;
}

const SubtitleGenerator: React.FC = () => {
  const { language: currentLanguage } = useContext(LanguageContext);
  const t = translations.subtitleGenerator;
  const t_export = translations.exportButtons;


  const [transcript, setTranscript] = useState<string>('');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['Spanish']);
  const [batchResults, setBatchResults] = useState<BatchResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isBatchMode, setIsBatchMode] = useState<boolean>(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeAccordion, setActiveAccordion] = useState<number | null>(0);
  const [activeTab, setActiveTab] = useState<string>('Spanish');

  const handleLanguageToggle = (lang: string) => {
    const newLangs = selectedLanguages.includes(lang) ? selectedLanguages.filter(l => l !== lang) : [...selectedLanguages, lang];
    setSelectedLanguages(newLangs);
    if (!activeTab || !newLangs.includes(activeTab)) {
        setActiveTab(newLangs[0] || '');
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setTranscript(e.target?.result as string);
      reader.readAsText(file);
    }
  };

  const handleSubmit = async () => {
    if (!transcript.trim()) {
      setError(t.errorTranscriptRequired[currentLanguage]);
      return;
    }
    if (selectedLanguages.length === 0) {
      setError(t.errorLanguageRequired[currentLanguage]);
      return;
    }

    setIsLoading(true);
    setError(null);
    setBatchResults([]);
    setActiveAccordion(0);
    setActiveTab(selectedLanguages[0]);
    setProgress(0);
    setProgressText('');

    try {
        const transcripts = isBatchMode ? transcript.split(BATCH_SEPARATOR).filter(s => s.trim() !== '') : [transcript];
        const newBatchResults: BatchResult[] = [];
        const totalJobs = transcripts.length * selectedLanguages.length;
        let jobsCompleted = 0;
        let successfulBatches = 0;

        for (let i = 0; i < transcripts.length; i++) {
            const currentTranscript = transcripts[i];
            const transcriptResult: SubtitleResult = {};
            let batchSuccess = false;
            
            for (const lang of selectedLanguages) {
                 setProgressText(`${t.progressText1[currentLanguage]} ${i + 1}/${transcripts.length} | ${t.progressText2[currentLanguage]}: ${lang}`);
                 try {
                    const result = await generateSubtitles(currentTranscript, lang);
                    transcriptResult[lang] = result;
                    batchSuccess = true;
                 } catch (err: any) {
                    transcriptResult[lang] = { error: err.message };
                 }
                 jobsCompleted++;
                 setProgress((jobsCompleted / totalJobs) * 100);
            }
            if (batchSuccess) {
                successfulBatches++;
            }
            newBatchResults.push({ id: i, results: transcriptResult });
        }
        
        if (successfulBatches > 0) {
            const currentCount = parseInt(localStorage.getItem('subtitleJobsRun') || '0', 10);
            localStorage.setItem('subtitleJobsRun', (currentCount + successfulBatches).toString());
        }
        setBatchResults(newBatchResults);
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
      setProgress(0);
      setProgressText('');
    }
  };
  
  const handleExportAll = () => {
    if (batchResults.length === 0) return;

    const fullExportText = batchResults.map((batchItem, index) => {
        const header = `--- TRANSCRIPT ${index + 1} ---\n`;
        const subtitlesForTranscript = selectedLanguages.map(lang => {
            const langHeader = `--- Language: ${lang} ---\n`;
            const result = batchItem.results[lang];
            if (typeof result === 'string') {
                return langHeader + result;
            } else {
                return langHeader + `Error: ${result.error}`;
            }
        }).join('\n\n');
        return header + subtitlesForTranscript;
    }).join('\n\n' + BATCH_SEPARATOR + '\n\n');
    
    const blob = new Blob([fullExportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subtitles_batch_export.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadSubtitle = (transcriptId: number, language: string, format: 'srt' | 'vtt') => {
    const batchItem = batchResults.find(item => item.id === transcriptId);
    if (!batchItem) return;
    const result = batchItem.results[language];
    if (typeof result !== 'string') return;

    let content = result;
    if (format === 'vtt') {
        content = 'WEBVTT\n\n' + result.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript_${transcriptId + 1}_${language}.${format}`;
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
      
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
            <label htmlFor="transcript" className="block text-sm font-medium text-gray-300">{t.transcriptLabel[currentLanguage]}</label>
            <div className="flex items-center space-x-4">
               <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-400 hover:text-white transition-colors" aria-label="Import transcript">
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
            id="transcript"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder={isBatchMode ? t.placeholderBatch[currentLanguage] : t.placeholderSingle[currentLanguage]}
            className="w-full h-48 p-4 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-gray-200"
        />
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">{t.targetLanguagesLabel[currentLanguage]}</label>
          <div className="flex flex-wrap gap-2 p-4 bg-gray-800 border border-gray-700 rounded-lg">
            {LANGUAGES.map(lang => (
              <button
                key={lang}
                onClick={() => handleLanguageToggle(lang)}
                className={`px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ${
                  selectedLanguages.includes(lang) 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row items-center md:space-x-4 space-y-4 md:space-y-0">
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full md:w-auto flex justify-center items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-500 text-white font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {isLoading ? <LoaderIcon className="animate-spin w-5 h-5 mr-2" /> : t.generateButton[currentLanguage]}
            </button>
             {isLoading && (
              <div className="w-full md:flex-1 bg-gray-700 rounded-full h-2.5">
                  <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                  <p className="text-center text-xs text-gray-400 mt-1">{progressText}</p>
              </div>
            )}
        </div>


        {isLoading && !batchResults.length && (
            <div className="flex flex-col items-center justify-center py-10 bg-gray-800/50 border border-gray-700 rounded-lg">
                <LoaderIcon className="animate-spin w-12 h-12 text-purple-500" />
                <p className="mt-4 text-gray-400">{progressText || `${t.loadingText[currentLanguage]} ${selectedLanguages.length} ${t.loadingText2[currentLanguage]}...`}</p>
            </div>
        )}

        {error && <div className="text-red-400 p-4 bg-red-900/50 rounded-lg">{error}</div>}

        {batchResults.length > 0 && !isLoading && (
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 space-y-2">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-white">{t.resultsTitle[currentLanguage]}</h3>
                <button
                    onClick={handleExportAll}
                    disabled={batchResults.length === 0 || isLoading}
                    className="px-4 py-2 bg-purple-600 text-sm text-white font-bold rounded-lg hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {t.exportAllButton[currentLanguage]}
                </button>
            </div>
            {batchResults.map((item, index) => (
                 <div key={item.id} className="border border-gray-700 rounded-lg">
                    <button onClick={() => setActiveAccordion(activeAccordion === index ? null : index)} className="w-full flex justify-between items-center p-4 text-left">
                        <span className="font-medium text-white">{t.resultsForTranscript[currentLanguage]} {index + 1}</span>
                        <svg className={`w-5 h-5 transition-transform text-gray-400 ${activeAccordion === index ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </button>
                    {activeAccordion === index && (
                       <div className="bg-gray-900/50">
                          <div className="border-b border-gray-700">
                            <nav className="-mb-px flex space-x-4 px-4 overflow-x-auto" aria-label="Tabs">
                              {selectedLanguages.map(lang => (
                                <button
                                  key={lang}
                                  onClick={() => setActiveTab(lang)}
                                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                    activeTab === lang
                                      ? 'border-purple-500 text-purple-400'
                                      : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
                                  }`}
                                >
                                  {lang}
                                </button>
                              ))}
                            </nav>
                          </div>
                          <div className="p-4">
                            <div className="flex justify-end items-center mb-2 space-x-2">
                                <button
                                    onClick={() => handleDownloadSubtitle(item.id, activeTab, 'srt')}
                                    disabled={typeof item.results[activeTab] !== 'string'}
                                    className="flex items-center px-3 py-1.5 bg-gray-700 text-xs text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <DownloadIcon className="w-4 h-4 mr-2" />
                                    {t_export.downloadSRT[currentLanguage]}
                                </button>
                                <button
                                    onClick={() => handleDownloadSubtitle(item.id, activeTab, 'vtt')}
                                    disabled={typeof item.results[activeTab] !== 'string'}
                                    className="flex items-center px-3 py-1.5 bg-gray-700 text-xs text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <DownloadIcon className="w-4 h-4 mr-2" />
                                    {t_export.downloadVTT[currentLanguage]}
                                </button>
                            </div>
                             <pre className="whitespace-pre-wrap text-gray-300 bg-gray-800 p-2 rounded-md font-sans text-sm h-64 overflow-auto">
                                {(() => {
                                    const result = item.results[activeTab];
                                    if(typeof result === 'string') return result;
                                    if(result && 'error' in result) return `Error: ${result.error}`;
                                    return t.noResult[currentLanguage];
                                })()}
                             </pre>
                          </div>
                        </div>
                    )}
                 </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SubtitleGenerator;