import React, { useState, useRef, useContext } from 'react';
import { generatePodcastEditingNotes, PodcastNotesResult } from '../services/geminiService';
import { LoaderIcon } from './icons/LoaderIcon';
import { HelpIcon } from './icons/HelpIcon';
import HelpModal from './HelpModal';
import { ImportIcon } from './icons/ImportIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { TagIcon } from './icons/TagIcon';
import { ScissorsIcon } from './icons/ScissorsIcon';
import { ShareIcon } from './icons/ShareIcon';
import { PencilIcon } from './icons/PencilIcon';
import { UsersIcon } from './icons/UsersIcon';
import { YouTubeIcon } from './icons/YouTubeIcon';
import { LanguageContext } from '../contexts/LanguageContext';
import { translations } from '../translations';


const BATCH_SEPARATOR = '\n\n---\n\n';

interface BatchResult {
    id: number;
    notes: PodcastNotesResult | null;
    error: string | null;
}

const PodcastEditor: React.FC = () => {
  const { language } = useContext(LanguageContext);
  const t = translations.podcastEditor;
  const t_export = translations.exportButtons;


  const [transcript, setTranscript] = useState<string>('');
  const [speakerNames, setSpeakerNames] = useState<string>('');
  const [results, setResults] = useState<BatchResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isBatchMode, setIsBatchMode] = useState<boolean>(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeAccordion, setActiveAccordion] = useState<number | null>(0);

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setTranscript(e.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = async () => {
    if (!transcript.trim()) {
      setError(t.errorTranscriptRequired[language]);
      return;
    }
    setIsLoading(true);
    setError(null);
    setResults([]);
    setProgress(0);
    setProgressText('');
    setActiveAccordion(0);

    try {
        const transcripts = isBatchMode ? transcript.split(BATCH_SEPARATOR).filter(s => s.trim() !== '') : [transcript];
        const newResults: BatchResult[] = [];
        let successfulJobs = 0;
        
        for (let i = 0; i < transcripts.length; i++) {
            const currentTranscript = transcripts[i];
            setProgressText(`${t.progressText[language]} ${i + 1} / ${transcripts.length}...`);
            try {
                const notes = await generatePodcastEditingNotes(currentTranscript, speakerNames);
                newResults.push({ id: i, notes, error: null });
                successfulJobs++;
            } catch (err: any) {
                newResults.push({ id: i, notes: null, error: err.message });
            }
            setProgress(((i + 1) / transcripts.length) * 100);
        }

        if (successfulJobs > 0) {
            const currentCount = parseInt(localStorage.getItem('podcastJobsRun') || '0', 10);
            localStorage.setItem('podcastJobsRun', (currentCount + successfulJobs).toString());
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

  const formatNotesForExport = (result: BatchResult, index: number, format: 'md' | 'txt'): string => {
    if (result.error) {
        return `Notes for Transcript ${index + 1} failed: ${result.error}`;
    }
    if (!result.notes) return `No notes generated for Transcript ${index + 1}.`;
    
    const h1 = format === 'md' ? '# ' : '';
    const h2 = format === 'md' ? '## ' : '';
    const li = format === 'md' ? '* ' : '- ';
    const bold = (text: string) => format === 'md' ? `**${text}**` : text;
    const blockquote = (text: string) => format === 'md' ? `> ${text}` : `"${text}"`;

    return `
${h1}Podcast Show Notes (Transcript ${index + 1})

${h2}Summary
${result.notes.summary}

${h2}Speakers Identified
${result.notes.speakers.map(s => `${li}${s}`).join('\n')}

${h2}Key Topics
${result.notes.keyTopics.map(t => `${li}${bold(`[${t.timestamp}]`)} ${t.topic}`).join('\n')}

${h2}YouTube Chapters
${result.notes.youtubeChapters.map(c => `${li}${bold(`[${c.timestamp}]`)} ${c.title}`).join('\n')}

${h2}Editing Notes
${result.notes.editingNotes.map(n => `${li}${n}`).join('\n')}

${h2}Social Media Snippets
${result.notes.socialMediaSnippets.map(s => blockquote(s)).join('\n\n')}

${h2}Generated Blog Post
${result.notes.blogPost}
    `.trim();
  }

  const handleExport = (format: 'md' | 'txt') => {
    if (results.length === 0) return;
    const notesText = results.map((res, i) => formatNotesForExport(res, i, format)).join('\n\n========================\n\n');
    const mimeType = format === 'txt' ? 'text/plain' : 'text/markdown';
    const blob = new Blob([notesText], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `podcast_show_notes_batch.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    if (results.length === 0) return;
    const jsonString = JSON.stringify(results.map(r => r.notes), null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'podcast_show_notes.json';
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
      
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
            <label htmlFor="transcript" className="block text-sm font-medium text-gray-300">{t.transcriptLabel[language]}</label>
            <div className="flex items-center space-x-4">
               <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-400 hover:text-white transition-colors" aria-label="Import transcript">
                    <ImportIcon className="w-5 h-5" />
               </button>
               <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".txt,.md" />
               <label className="flex items-center cursor-pointer">
                  <span className="mr-2 text-sm text-gray-400">{t.batchModeLabel[language]}</span>
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
            placeholder={isBatchMode ? t.placeholderBatch[language] : t.placeholderSingle[language]}
            className="w-full h-48 p-4 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-gray-200"
        />
        
         <div>
            <label htmlFor="speakers" className="block text-sm font-medium text-gray-300 mb-2">{t.speakersLabel[language]}</label>
            <input
                id="speakers"
                type="text"
                value={speakerNames}
                onChange={(e) => setSpeakerNames(e.target.value)}
                placeholder={t.speakersPlaceholder[language]}
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-gray-200"
            />
        </div>

        <div className="flex flex-col md:flex-row items-center md:space-x-4 space-y-4 md:space-y-0">
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full md:w-auto flex justify-center items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-500 text-white font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {isLoading ? <LoaderIcon className="animate-spin w-5 h-5 mr-2" /> : t.generateButton[language]}
            </button>

            {isLoading && (
              <div className="w-full md:flex-1 bg-gray-700 rounded-full h-2.5">
                  <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                  <p className="text-center text-xs text-gray-400 mt-1">{progressText}</p>
              </div>
            )}
        </div>


        {isLoading && !results.length && (
            <div className="flex flex-col items-center justify-center py-10 bg-gray-800/50 border border-gray-700 rounded-lg">
                <LoaderIcon className="animate-spin w-12 h-12 text-purple-500" />
                <p className="mt-4 text-gray-400">{progressText || t.loadingNotes[language]}</p>
            </div>
        )}
        
        {error && <div className="text-red-400 p-4 bg-red-900/50 rounded-lg">{error}</div>}

        {results.length > 0 && (
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 space-y-2">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-white">{t.resultsTitle[language]}</h3>
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
             {results.map((result, index) => (
                <div key={index} className="border border-gray-700 rounded-lg">
                    <button onClick={() => setActiveAccordion(activeAccordion === index ? null : index)} className="w-full flex justify-between items-center p-4 text-left">
                        <span className={`font-medium ${result.error ? 'text-red-400' : 'text-white'}`}>{t.showNotesFor[language]} {index + 1}</span>
                        <svg className={`w-5 h-5 transition-transform text-gray-400 ${activeAccordion === index ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </button>
                    {activeAccordion === index && (
                        <div className="p-4 bg-gray-900/50 space-y-6">
                            {result.error && <p className="text-red-400 lg:col-span-2">{result.error}</p>}
                            {result.notes && (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="bg-gray-800/70 p-4 rounded-lg">
                                        <div className="flex items-center mb-2">
                                            <DocumentTextIcon className="w-5 h-5 mr-3 text-purple-400" />
                                            <h4 className="font-bold text-purple-400">{t.summary[language]}</h4>
                                        </div>
                                        <p className="text-gray-300 text-sm">{result.notes.summary}</p>
                                    </div>
                                    <div className="bg-gray-800/70 p-4 rounded-lg">
                                        <div className="flex items-center mb-2">
                                            <UsersIcon className="w-5 h-5 mr-3 text-cyan-400" />
                                            <h4 className="font-bold text-cyan-400">{t.speakers[language]}</h4>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {result.notes.speakers.length > 0 ? (
                                                result.notes.speakers.map((speaker, i) => <span key={i} className="px-2 py-1 bg-gray-900 text-cyan-300 text-xs font-medium rounded-full">{speaker}</span>)
                                            ) : (
                                                <p className="text-gray-400 text-sm italic">{t.noSpeakers[language]}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="bg-gray-800/70 p-4 rounded-lg lg:col-span-2">
                                        <div className="flex items-center mb-2">
                                            <TagIcon className="w-5 h-5 mr-3 text-sky-400" />
                                            <h4 className="font-bold text-sky-400">{t.keyTopics[language]}</h4>
                                        </div>
                                        <ul className="space-y-2 text-gray-300 text-sm">
                                            {result.notes.keyTopics.map((item, i) => <li key={i} className="flex items-start"><span className="font-mono text-sky-300 mr-2 bg-gray-900 px-1 rounded text-xs">[{item.timestamp}]</span> <span>{item.topic}</span></li>)}
                                        </ul>
                                    </div>
                                    <div className="bg-gray-800/70 p-4 rounded-lg lg:col-span-2">
                                        <div className="flex items-center mb-2">
                                            <YouTubeIcon className="w-5 h-5 mr-3 text-red-500" />
                                            <h4 className="font-bold text-red-400">{t.youtubeChapters[language]}</h4>
                                        </div>
                                        <ul className="space-y-2 text-gray-300 text-sm">
                                            {result.notes.youtubeChapters.map((chapter, i) => <li key={i} className="flex items-start"><span className="font-mono text-red-300 mr-2 bg-gray-900 px-1 rounded text-xs">[{chapter.timestamp}]</span> <span>{chapter.title}</span></li>)}
                                        </ul>
                                    </div>
                                    <div className="bg-gray-800/70 p-4 rounded-lg">
                                        <div className="flex items-center mb-2">
                                            <ScissorsIcon className="w-5 h-5 mr-3 text-emerald-400" />
                                            <h4 className="font-bold text-emerald-400">{t.editingNotes[language]}</h4>
                                        </div>
                                        <ul className="list-disc list-inside space-y-2 text-gray-300 text-sm">
                                            {result.notes.editingNotes.map((note, i) => <li key={i}>{note}</li>)}
                                        </ul>
                                    </div>
                                    <div className="bg-gray-800/70 p-4 rounded-lg">
                                        <div className="flex items-center mb-2">
                                            <ShareIcon className="w-5 h-5 mr-3 text-rose-400" />
                                            <h4 className="font-bold text-rose-400">{t.socialMedia[language]}</h4>
                                        </div>
                                        <div className="space-y-4">
                                            {result.notes.socialMediaSnippets.map((snippet, i) => (
                                                <blockquote key={i} className="border-l-4 border-rose-500 pl-4 text-gray-400 italic text-sm">"{snippet}"</blockquote>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="bg-gray-800/70 p-4 rounded-lg lg:col-span-2">
                                        <div className="flex items-center mb-2">
                                            <PencilIcon className="w-5 h-5 mr-3 text-amber-400" />
                                            <h4 className="font-bold text-amber-400">{t.blogPost[language]}</h4>
                                        </div>
                                        <div className="prose prose-sm prose-invert max-w-none text-gray-300 whitespace-pre-wrap">{result.notes.blogPost}</div>
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
    </div>
  );
};

export default PodcastEditor;