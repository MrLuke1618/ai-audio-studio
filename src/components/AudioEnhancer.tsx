import React, { useState, useRef, useEffect, useContext } from 'react';
import { analyzeAudioForEnhancement, AudioAnalysisResult } from '../services/geminiService';
import { LoaderIcon } from './icons/LoaderIcon';
import { HelpIcon } from './icons/HelpIcon';
import { HelpModal } from './HelpModal';
import { ImportIcon } from './icons/ImportIcon';
import { LanguageContext } from '../contexts/LanguageContext';
import { translations } from '../translations';


const ClarityScoreRing: React.FC<{ score: number }> = ({ score }) => {
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 10) * circumference;
  
    return (
      <div className="relative w-32 h-32">
        <svg className="w-full h-full" viewBox="0 0 120 120" aria-label={`Clarity score is ${score} out of 10`}>
          <circle
            className="text-gray-700"
            strokeWidth="10"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="60"
            cy="60"
          />
          <circle
            className="text-purple-500 transition-all duration-1000 ease-in-out"
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="60"
            cy="60"
            transform="rotate(-90 60 60)"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-white">{score}</span>
            <span className="text-xs text-gray-400">/ 10</span>
        </div>
      </div>
    );
  };

  const AudioVisualizer: React.FC = () => {
    const bars = Array.from({ length: 20 }, (_, i) => i);
    return (
      <div className="flex items-center justify-center h-16 space-x-1 bg-gray-900/50 rounded-lg">
        {bars.map(i => (
          <div
            key={i}
            className="w-2 bg-purple-500 rounded-full"
            style={{
              height: `${Math.random() * 80 + 10}%`,
              animation: `pulse ${Math.random() * 0.5 + 0.3}s infinite alternate`,
            }}
          />
        ))}
        <style>{`
            @keyframes pulse {
                from { transform: scaleY(0.1); }
                to { transform: scaleY(1); }
            }
        `}</style>
      </div>
    );
  };

interface BatchResult {
    filename: string;
    report: AudioAnalysisResult | null;
    error: string | null;
}

const DEFAULT_PRESETS = ['Podcast', 'Outdoor Interview', 'Meeting Room Recording', 'Vocal Recording'];

const AudioEnhancer: React.FC = () => {
  const { language } = useContext(LanguageContext);
  const t = translations.audioEnhancer;
  const t_export = translations.exportButtons;


  const [preset, setPreset] = useState<string>('Podcast');
  const [fileNames, setFileNames] = useState<string>('');
  const [results, setResults] = useState<BatchResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isBatchMode, setIsBatchMode] = useState<boolean>(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeAccordion, setActiveAccordion] = useState<number | null>(0);
  const [customPresets, setCustomPresets] = useState<string[]>([]);
  const [newPresetName, setNewPresetName] = useState<string>('');
  const [isRealTime, setIsRealTime] = useState(false);
  const [isProcessingRealTime, setIsProcessingRealTime] = useState(false);

  useEffect(() => {
    try {
        const savedPresets = localStorage.getItem('audioEnhancerCustomPresets');
        if (savedPresets) {
            setCustomPresets(JSON.parse(savedPresets));
        }
    } catch (error) {
        console.error('Failed to load custom presets from localStorage', error);
        setError(t.errorLoadPresets[language]);
    }
  }, [language, t.errorLoadPresets]);

  const handleSavePreset = () => {
    const trimmedName = newPresetName.trim();
    if (!trimmedName) {
        setError(t.errorPresetNameEmpty[language]);
        return;
    }
    if ([...DEFAULT_PRESETS, ...customPresets].map(p => p.toLowerCase()).includes(trimmedName.toLowerCase())) {
        setError(`${t.errorPresetExists[language]} "${trimmedName}".`);
        return;
    }

    try {
        const updatedPresets = [...customPresets, trimmedName];
        setCustomPresets(updatedPresets);
        localStorage.setItem('audioEnhancerCustomPresets', JSON.stringify(updatedPresets));
        setNewPresetName('');
        setPreset(trimmedName); // Switch to the newly created preset
        setError(null);
    } catch (err) {
        console.error('Failed to save custom presets to localStorage', err);
        setError(t.errorSavePreset[language]);
    }
  };

  const handleDeletePreset = () => {
    if (!customPresets.includes(preset)) return;
    try {
        const updatedPresets = customPresets.filter(p => p !== preset);
        setCustomPresets(updatedPresets);
        localStorage.setItem('audioEnhancerCustomPresets', JSON.stringify(updatedPresets));
        setPreset('Podcast'); // Reset to a default preset
    } catch (err) {
        console.error('Failed to delete custom preset from localStorage', err);
        setError(t.errorDeletePreset[language]);
    }
  };


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
        if (isBatchMode) {
             setError(t.errorBatchModeImport[language]);
             return;
        }
        if(e.target.files[0]) {
            setFileNames(e.target.files[0].name);
        }
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFileNames(e.target?.result as string);
        if (!isBatchMode && !isRealTime) {
            setFileNames((e.target?.result as string).split('\n')[0]);
        }
      };
      reader.readAsText(file);
    }
  };
  
  const handleRealTimeToggle = () => {
    setIsProcessingRealTime(!isProcessingRealTime);
    if (!isProcessingRealTime) {
        setError(null);
        setResults([]);
    } else {
        handleSubmit();
    }
  }

  const handleSubmit = async () => {
    const filesToProcess = fileNames.split('\n').map(f => f.trim()).filter(f => f);
    if (filesToProcess.length === 0) {
      setError(t.errorNoFiles[language]);
      return;
    }
    if (!isBatchMode && filesToProcess.length > 1 && !isRealTime) {
        setError(t.errorMultipleFiles[language]);
        return;
    }
    setIsLoading(true);
    setError(null);
    setResults([]);
    setProgress(0);
    setProgressText('');
    setActiveAccordion(0);

    try {
        const newResults: BatchResult[] = [];
        let successfulJobs = 0;
        const finalFiles = isRealTime ? [filesToProcess[0]] : filesToProcess;

        for (let i = 0; i < finalFiles.length; i++) {
            const filename = finalFiles[i];
            setProgressText(`${t.progressText[language]} ${i + 1} / ${finalFiles.length}...`);
            try {
                const report = await analyzeAudioForEnhancement(filename, preset);
                newResults.push({ filename, report, error: null });
                successfulJobs++;
            } catch (err: any) {
                newResults.push({ filename, report: null, error: err.message });
            }
            setProgress(((i + 1) / finalFiles.length) * 100);
        }
        if (successfulJobs > 0) {
            const currentCount = parseInt(localStorage.getItem('enhancerJobsRun') || '0', 10);
            localStorage.setItem('enhancerJobsRun', (currentCount + successfulJobs).toString());
        }
        setResults(newResults);

    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
      setProgress(0);
      setProgressText('');
    }
  };
  
    const formatReport = (result: BatchResult, format: 'txt' | 'md'): string => {
        if (result.error) {
            return `Analysis for ${result.filename} failed: ${result.error}`;
        }
        if (!result.report) return `No report generated for ${result.filename}.`;

        const h1 = format === 'md' ? '# ' : '';
        const h2 = format === 'md' ? '## ' : '';
        const h3 = format === 'md' ? '### ' : '';
        const li = format === 'md' ? '* ' : '- ';
        const hr = format === 'md' ? '\n---\n' : '\n---------------------------------\n';

        return `
${h1}AI Audio Analysis Report
${hr}
**File:** ${result.filename}
**Preset:** ${preset}

${h2}Vocal Clarity Score: ${result.report.vocalClarityScore} / 10
${hr}
${h3}Detected Issues:
${result.report.detectedIssues.map(issue => `${li}${issue}`).join('\n')}

${h3}Recommended Actions:
${result.report.recommendedActions.map(action => `${li}${action}`).join('\n')}

${h3}Pro Tips for Clarity Improvement:
${result.report.clarityImprovementTips.map(tip => `${li}${tip}`).join('\n')}
        `.trim();
    }

    const handleExport = (format: 'txt' | 'md') => {
        if (results.length === 0) return;
        const fullReport = results.map(res => formatReport(res, format)).join('\n\n========================\n\n');
        const mimeType = format === 'txt' ? 'text/plain' : 'text/markdown';
        const blob = new Blob([fullReport], { type: `${mimeType};charset=utf-8` });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audio_analysis_report_batch.${format}`;
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
    a.download = 'audio_analysis_batch.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
              <li><strong>{t.help13[language]}</strong> {t.help14[language]}</li>
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

      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-8 space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2 bg-gray-900 p-1 rounded-full">
                    <button onClick={() => { setIsRealTime(false); setIsBatchMode(false); }} className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors ${!isRealTime ? 'bg-purple-600 text-white' : 'text-gray-400'}`}>{t.modeStandard[language]}</button>
                    <button onClick={() => { setIsRealTime(true); setIsBatchMode(false); }} className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors ${isRealTime ? 'bg-purple-600 text-white' : 'text-gray-400'}`}>{t.modeRealTime[language]}</button>
                </div>
                <div className="flex items-center space-x-4">
                    <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-400 hover:text-white transition-colors" aria-label="Import filenames">
                        <ImportIcon className="w-5 h-5" />
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".txt" />
                    {!isRealTime && (
                        <label className="flex items-center cursor-pointer">
                            <span className="mr-2 text-sm text-gray-400">{t.batchModeLabel[language]}</span>
                            <div className="relative">
                            <input type="checkbox" checked={isBatchMode} onChange={() => setIsBatchMode(!isBatchMode)} className="sr-only" />
                            <div className="block bg-gray-700 w-10 h-6 rounded-full"></div>
                            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isBatchMode ? 'translate-x-4 bg-purple-400' : ''}`}></div>
                            </div>
                        </label>
                    )}
                </div>
            </div>
            <label htmlFor="audio-file-input" className="block text-sm font-medium text-gray-300">{t.fileNameLabel[language]}</label>

          {isBatchMode && !isRealTime ? (
             <textarea
              id="audio-file-input"
              value={fileNames}
              onChange={(e) => setFileNames(e.target.value)}
              placeholder={t.placeholderBatch[language]}
              className="w-full h-32 p-4 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-gray-200"
            />
          ) : (
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="flex text-sm text-gray-500">
                    <label htmlFor="file-upload" className="relative cursor-pointer bg-gray-800 rounded-md font-medium text-purple-400 hover:text-purple-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-900 focus-within:ring-purple-500">
                        <span>{t.uploadFile[language]}</span>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="audio/*" />
                    </label>
                    <p className="pl-1">{t.orType[language]}</p>
                    </div>
                    <input type="text" value={fileNames.split('\n')[0]} onChange={(e) => setFileNames(e.target.value)} className="mt-2 p-2 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 w-full text-center text-gray-200" placeholder={t.placeholderSingle[language]} />
                </div>
            </div>
          )}
          
          <div>
            <label htmlFor="preset" className="block text-sm font-medium text-gray-300 mb-2">{t.presetLabel[language]}</label>
            <select
              id="preset"
              value={preset}
              onChange={(e) => setPreset(e.target.value)}
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-gray-200"
            >
              <optgroup label={t.defaultPresets[language]}>
                {DEFAULT_PRESETS.map(p => <option key={p} value={p}>{p}</option>)}
              </optgroup>
              {customPresets.length > 0 && (
                <optgroup label={t.customPresets[language]}>
                    {customPresets.map(p => <option key={p} value={p}>{p}</option>)}
                </optgroup>
              )}
            </select>
          </div>
          
          {isRealTime && isProcessingRealTime && <AudioVisualizer />}

          <div className="border-t border-gray-700 pt-4 space-y-2">
              <label htmlFor="new-preset-name" className="block text-sm font-medium text-gray-300">{t.customPresetManagement[language]}</label>
              <div className="flex flex-col sm:flex-row gap-2">
                  <input
                      id="new-preset-name"
                      type="text"
                      value={newPresetName}
                      onChange={(e) => setNewPresetName(e.target.value)}
                      placeholder={t.newPresetPlaceholder[language]}
                      className="flex-grow p-2 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-200"
                      aria-label="New preset name"
                  />
                  <button
                      onClick={handleSavePreset}
                      disabled={!newPresetName.trim()}
                      className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500 disabled:opacity-50 transition-colors"
                  >
                      {t.savePresetButton[language]}
                  </button>
                  {customPresets.includes(preset) && (
                      <button
                          onClick={handleDeletePreset}
                          className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-500 transition-colors"
                      >
                          {t.deleteSelectedButton[language]}
                      </button>
                  )}
              </div>
          </div>
          
          {!isRealTime && (
            <button
                onClick={handleSubmit}
                disabled={isLoading || !fileNames.trim()}
                className="w-full flex justify-center items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-500 text-white font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
                {isLoading ? <LoaderIcon className="animate-spin w-5 h-5 mr-2" /> : t.analyzeButton[language]}
            </button>
          )}

          {isRealTime && (
            <button onClick={handleRealTimeToggle} disabled={isLoading || !fileNames.trim()}
                className={`w-full flex justify-center items-center px-6 py-3 text-white font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg ${isProcessingRealTime ? 'bg-red-600' : 'bg-gradient-to-r from-green-500 to-teal-400'}`}
            >
                {isProcessingRealTime ? t.stopProcessingButton[language] : t.startProcessingButton[language]}
            </button>
          )}

          {isLoading && (isBatchMode || isRealTime) && (
             <div className="w-full bg-gray-700 rounded-full h-2.5">
                 <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                 <p className="text-center text-xs text-gray-400 mt-1">{progressText}</p>
             </div>
           )}

        </div>

        {(isLoading || error || results.length > 0) && (
          <div className="mt-8 bg-gray-800/50 border border-gray-700 rounded-lg p-6">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">{t.reportTitle[language]}</h3>
                <div className="flex items-center space-x-2">
                    <button onClick={() => handleExport('txt')} disabled={results.length === 0 || isLoading} className="px-3 py-1.5 bg-gray-700 text-xs text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        {t_export.exportTXT[language]}
                    </button>
                    <button onClick={() => handleExport('md')} disabled={results.length === 0 || isLoading} className="px-3 py-1.5 bg-gray-700 text-xs text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        {t_export.exportMD[language]}
                    </button>
                    <button onClick={handleExportJSON} disabled={results.length === 0 || isLoading} className="px-3 py-1.5 bg-gray-700 text-xs text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        {t_export.exportJSON[language]}
                    </button>
                </div>
             </div>
            {isLoading && !results.length && (
              <div className="flex flex-col items-center justify-center py-10">
                <LoaderIcon className="animate-spin w-12 h-12 text-purple-500" />
                <p className="mt-4 text-gray-400">{progressText || t.loadingAnalysis[language]}</p>
              </div>
            )}
            {error && <div className="text-red-400 p-4 bg-red-900/50 rounded-lg mb-4">{error}</div>}
            {results.length > 0 && (
                <div className="space-y-2">
                    {results.map((result, index) => (
                        <div key={index} className="border border-gray-700 rounded-lg">
                            <button onClick={() => setActiveAccordion(activeAccordion === index ? null : index)} className="w-full flex justify-between items-center p-4 text-left">
                                <span className={`font-medium ${result.error ? 'text-red-400' : 'text-white'}`}>{result.filename}</span>
                                <svg className={`w-5 h-5 transition-transform text-gray-400 ${activeAccordion === index ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </button>
                            {activeAccordion === index && (
                                <div className="p-4 bg-gray-900/50">
                                    {result.error && <p className="text-red-400">{result.error}</p>}
                                    {result.report && (
                                      <div className="space-y-6">
                                        <div className="flex flex-col md:flex-row items-center gap-6 bg-gray-900/50 p-4 rounded-lg">
                                            <div className="flex-shrink-0">
                                                <ClarityScoreRing score={result.report.vocalClarityScore} />
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-bold text-purple-400">{t.clarityScore[language]}</h4>
                                                <p className="text-gray-300">{t.clarityScoreDescription[language]}</p>
                                            </div>
                                        </div>
                                        <div>
                                          <h4 className="text-lg font-bold text-purple-400 mb-2">{t.detectedIssues[language]}</h4>
                                          <ul className="list-disc list-inside space-y-1 text-gray-300">
                                            {result.report.detectedIssues.map((issue, i) => <li key={i}>{issue}</li>)}
                                          </ul>
                                        </div>
                                        <div>
                                          <h4 className="text-lg font-bold text-purple-400 mb-2">{t.recommendedActions[language]}</h4>
                                          <ul className="list-disc list-inside space-y-1 text-gray-300">
                                            {result.report.recommendedActions.map((action, i) => <li key={i}>{action}</li>)}
                                          </ul>
                                        </div>
                                        <div>
                                          <h4 className="text-lg font-bold text-purple-400 mb-2">{t.proTips[language]}</h4>
                                          <ul className="list-disc list-inside space-y-1 text-gray-300">
                                            {result.report.clarityImprovementTips.map((tip, i) => <li key={i}>{tip}</li>)}
                                          </ul>
                                        </div>
                                      </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioEnhancer;