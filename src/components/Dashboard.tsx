import React, { useState, useEffect, useContext } from 'react';
import { Tool } from '../types';
import { FilmIcon } from './icons/FilmIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { MicIcon } from './icons/MicIcon';
import { ClosedCaptionsIcon } from './icons/ClosedCaptionsIcon';
import { MusicIcon } from './icons/MusicIcon';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { VolumeUpIcon } from './icons/VolumeUpIcon';
import { LayersIcon } from './icons/LayersIcon';
import { SoundWaveIcon } from './icons/SoundWaveIcon';
import { LanguageContext } from '../contexts/LanguageContext';
import { translations } from '../translations';
import { HintBanner } from './HintBanner';


interface DashboardProps {
    setActiveTool: (tool: Tool) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ setActiveTool }) => {
    const { language } = useContext(LanguageContext);
    const t = translations.dashboard;
    const tCards = translations.toolCards;
    
    const toolCards = [
        {
            tool: Tool.SCRIPT_DOCTOR,
            title: tCards.scriptDoctorTitle[language],
            description: tCards.scriptDoctorDescription[language],
            icon: <BookOpenIcon className="w-8 h-8 text-amber-400" />,
            color: 'from-amber-500 to-yellow-500',
        },
        {
            tool: Tool.AI_MUSIC_COMPOSER,
            title: tCards.aiMusicComposerTitle[language],
            description: tCards.aiMusicComposerDescription[language],
            icon: <MusicIcon className="w-8 h-8 text-fuchsia-400" />,
            color: 'from-fuchsia-500 to-pink-500',
        },
        {
            tool: Tool.SFX_GENERATOR,
            title: tCards.sfxGeneratorTitle[language],
            description: tCards.sfxGeneratorDescription[language],
            icon: <SoundWaveIcon className="w-8 h-8 text-lime-400" />,
            color: 'from-lime-500 to-green-500',
        },
        {
            tool: Tool.TEXT_TO_SPEECH,
            title: tCards.textToSpeechTitle[language],
            description: tCards.textToSpeechDescription[language],
            icon: <VolumeUpIcon className="w-8 h-8 text-teal-400" />,
            color: 'from-teal-500 to-cyan-500',
        },
        {
            tool: Tool.PODCAST_EDITOR,
            title: tCards.podcastEditorTitle[language],
            description: tCards.podcastEditorDescription[language],
            icon: <MicIcon className="w-8 h-8 text-emerald-400" />,
            color: 'from-emerald-500 to-green-500',
        },
        {
            tool: Tool.AUDIO_ENHANCER,
            title: tCards.audioEnhancerTitle[language],
            description: tCards.audioEnhancerDescription[language],
            icon: <SparklesIcon className="w-8 h-8 text-sky-400" />,
            color: 'from-sky-500 to-cyan-500',
        },
        {
            tool: Tool.STEM_SPLITTER,
            title: tCards.stemSplitterTitle[language],
            description: tCards.stemSplitterDescription[language],
            icon: <LayersIcon className="w-8 h-8 text-orange-400" />,
            color: 'from-orange-500 to-amber-500',
        },
        {
            tool: Tool.DUBBING_STUDIO,
            title: tCards.dubbingStudioTitle[language],
            description: tCards.dubbingStudioDescription[language],
            icon: <FilmIcon className="w-8 h-8 text-purple-400" />,
            color: 'from-purple-500 to-indigo-500',
        },
        {
            tool: Tool.SUBTITLE_GENERATOR,
            title: tCards.subtitleGeneratorTitle[language],
            description: tCards.subtitleGeneratorDescription[language],
            icon: <ClosedCaptionsIcon className="w-8 h-8 text-rose-400" />,
            color: 'from-rose-500 to-pink-500',
        },
    ];


    const [stats, setStats] = useState({
        dubbing: 0,
        enhancer: 0,
        podcast: 0,
        subtitle: 0,
        music: 0,
        script: 0,
        tts: 0,
        stemSplitter: 0,
        sfx: 0,
    });

    useEffect(() => {
        const updateStats = () => {
            setStats({
                dubbing: parseInt(localStorage.getItem('dubbingJobsRun') || '0', 10),
                enhancer: parseInt(localStorage.getItem('enhancerJobsRun') || '0', 10),
                podcast: parseInt(localStorage.getItem('podcastJobsRun') || '0', 10),
                subtitle: parseInt(localStorage.getItem('subtitleJobsRun') || '0', 10),
                music: parseInt(localStorage.getItem('musicJobsRun') || '0', 10),
                script: parseInt(localStorage.getItem('scriptJobsRun') || '0', 10),
                tts: parseInt(localStorage.getItem('ttsJobsRun') || '0', 10),
                stemSplitter: parseInt(localStorage.getItem('stemSplitterJobsRun') || '0', 10),
                sfx: parseInt(localStorage.getItem('sfxJobsRun') || '0', 10),
            });
        };
        updateStats();
        window.addEventListener('storage', updateStats);
        window.addEventListener('focus', updateStats);
        return () => {
            window.removeEventListener('storage', updateStats);
            window.removeEventListener('focus', updateStats)
        };
    }, []);

    const statItems = [
        { label: t.statScript[language], value: stats.script, color: 'text-amber-400' },
        { label: t.statMusic[language], value: stats.music, color: 'text-fuchsia-400' },
        { label: t.statSfx[language], value: stats.sfx, color: 'text-lime-400' },
        { label: t.statTts[language], value: stats.tts, color: 'text-teal-400' },
        { label: t.statPodcast[language], value: stats.podcast, color: 'text-emerald-400' },
        { label: t.statEnhancer[language], value: stats.enhancer, color: 'text-sky-400' },
        { label: t.statStem[language], value: stats.stemSplitter, color: 'text-orange-400' },
        { label: t.statDubbing[language], value: stats.dubbing, color: 'text-purple-400' },
        { label: t.statSubtitle[language], value: stats.subtitle, color: 'text-rose-400' },
    ];

    return (
        <div className="animate-fade-in space-y-12">
            <div>
                <h1 className="text-5xl font-extrabold text-white">{t.welcome[language]}</h1>
                <p className="text-gray-400 mt-4 text-lg max-w-3xl">{t.description[language]}</p>
            </div>

            <HintBanner />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                {toolCards.map((card) => (
                    <button
                        key={card.tool}
                        onClick={() => setActiveTool(card.tool)}
                        className="group p-6 bg-gray-800/50 border border-gray-700 rounded-xl text-left hover:bg-gray-800 hover:-translate-y-1 transition-all duration-300 flex flex-col items-start shadow-sm hover:shadow-lg"
                    >
                        <div className={`p-3 rounded-lg bg-gradient-to-br ${card.color} mb-4`}>
                            {card.icon}
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">{card.title}</h3>
                        <p className="text-gray-400 text-sm flex-grow">{card.description}</p>
                         <span className="mt-4 text-sm font-semibold text-purple-400 group-hover:underline">
                            {t.openTool[language]} &rarr;
                        </span>
                    </button>
                ))}
            </div>

            <div>
                <h2 className="text-3xl font-bold text-white mb-4">{t.statsTitle[language]}</h2>
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-6 text-center">
                        {statItems.map((item) => (
                            <div key={item.label}>
                                <p className={`text-4xl font-bold ${item.color}`}>{item.value}</p>
                                <p className="text-sm text-gray-400 mt-1">{item.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;