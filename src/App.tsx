import React, { useState, useMemo, useContext } from 'react';
import { Tool } from './types';
import DubbingStudio from './components/DubbingStudio';
import AudioEnhancer from './components/AudioEnhancer';
import PodcastEditor from './components/PodcastEditor';
import SubtitleGenerator from './components/SubtitleGenerator';
import Dashboard from './components/Dashboard';
import AIMusicComposer from './components/AIMusicComposer';
import ScriptDoctor from './components/ScriptDoctor';
import TextToSpeech from './components/TextToSpeech';
import StemSplitter from './components/StemSplitter';
import SFXGenerator from './components/SFXGenerator';
import Footer from './components/Footer';
import { FilmIcon } from './components/icons/FilmIcon';
import { SparklesIcon } from './components/icons/SparklesIcon';
import { MicIcon } from './components/icons/MicIcon';
import { ClosedCaptionsIcon } from './components/icons/ClosedCaptionsIcon';
import { DashboardIcon } from './components/icons/DashboardIcon';
import { MusicIcon } from './components/icons/MusicIcon';
import { BookOpenIcon } from './components/icons/BookOpenIcon';
import { VolumeUpIcon } from './components/icons/VolumeUpIcon';
import { LayersIcon } from './components/icons/LayersIcon';
import { SoundWaveIcon } from './components/icons/SoundWaveIcon';
import { LanguageContext, Language } from './contexts/LanguageContext';
import { translations } from './translations';

const App: React.FC = () => {
  const [activeTool, setActiveTool] = useState<Tool>(Tool.DASHBOARD);
  const { language, setLanguage } = useContext(LanguageContext);
  const t = translations.nav;

  const navigationItems = useMemo(() => [
    { id: Tool.DASHBOARD, label: t.dashboard[language], icon: <DashboardIcon className="w-5 h-5 mr-3" /> },
    { id: Tool.SCRIPT_DOCTOR, label: t.scriptDoctor[language], icon: <BookOpenIcon className="w-5 h-5 mr-3" /> },
    { id: Tool.AI_MUSIC_COMPOSER, label: t.aiMusicComposer[language], icon: <MusicIcon className="w-5 h-5 mr-3" /> },
    { id: Tool.SFX_GENERATOR, label: t.sfxGenerator[language], icon: <SoundWaveIcon className="w-5 h-5 mr-3" /> },
    { id: Tool.TEXT_TO_SPEECH, label: t.textToSpeech[language], icon: <VolumeUpIcon className="w-5 h-5 mr-3" /> },
    { id: Tool.PODCAST_EDITOR, label: t.podcastEditor[language], icon: <MicIcon className="w-5 h-5 mr-3" /> },
    { id: Tool.AUDIO_ENHANCER, label: t.audioEnhancer[language], icon: <SparklesIcon className="w-5 h-5 mr-3" /> },
    { id: Tool.STEM_SPLITTER, label: t.stemSplitter[language], icon: <LayersIcon className="w-5 h-5 mr-3" /> },
    { id: Tool.DUBBING_STUDIO, label: t.dubbingStudio[language], icon: <FilmIcon className="w-5 h-5 mr-3" /> },
    { id: Tool.SUBTITLE_GENERATOR, label: t.subtitleGenerator[language], icon: <ClosedCaptionsIcon className="w-5 h-5 mr-3" /> },
  ], [language, t]);

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
  };

  const renderActiveTool = () => {
    switch (activeTool) {
      case Tool.DASHBOARD:
        return <Dashboard setActiveTool={setActiveTool} />;
      case Tool.DUBBING_STUDIO:
        return <DubbingStudio />;
      case Tool.AUDIO_ENHANCER:
        return <AudioEnhancer />;
      case Tool.PODCAST_EDITOR:
        return <PodcastEditor />;
      case Tool.SUBTITLE_GENERATOR:
        return <SubtitleGenerator />;
      case Tool.AI_MUSIC_COMPOSER:
        return <AIMusicComposer />;
      case Tool.SCRIPT_DOCTOR:
        return <ScriptDoctor />;
      case Tool.TEXT_TO_SPEECH:
        return <TextToSpeech />;
      case Tool.STEM_SPLITTER:
        return <StemSplitter />;
      case Tool.SFX_GENERATOR:
        return <SFXGenerator />;
      default:
        return <Dashboard setActiveTool={setActiveTool} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans flex">
      <aside className="w-72 bg-gray-950 border-r border-gray-800 p-6 flex flex-col fixed h-full">
        <div className="flex items-center mb-10">
           <div className="w-10 h-10 bg-gradient-to-tr from-purple-600 to-blue-500 rounded-lg mr-3 flex items-center justify-center">
             <MicIcon className="w-6 h-6 text-white"/>
           </div>
          <h1 className="text-2xl font-bold text-white tracking-wider">Audio AI</h1>
        </div>
        <nav className="flex flex-col space-y-2">
          {navigationItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTool(item.id)}
              className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                activeTool === item.id 
                ? 'bg-purple-600 text-white shadow-lg' 
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              {item.icon}
              <span className="whitespace-nowrap">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="mt-auto">
            <p className="text-xs text-gray-500 mb-2 text-center font-medium uppercase tracking-wider">{t.language[language]}</p>
            <div className="flex items-center space-x-1 bg-gray-800 p-1 rounded-full">
                <button 
                    onClick={() => handleLanguageChange('en')}
                    className={`w-full px-3 py-1 text-sm font-bold rounded-full transition-colors ${language === 'en' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
                >
                    EN
                </button>
                <button 
                     onClick={() => handleLanguageChange('vi')}
                    className={`w-full px-3 py-1 text-sm font-bold rounded-full transition-colors ${language === 'vi' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
                >
                    VI
                </button>
            </div>
        </div>
      </aside>

      <main className="flex-1 ml-72 flex flex-col">
        <div className="flex-grow p-8 lg:p-12 overflow-auto">
            {renderActiveTool()}
        </div>
        <Footer />
      </main>
    </div>
  );
};

export default App;