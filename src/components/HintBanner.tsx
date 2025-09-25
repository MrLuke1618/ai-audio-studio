import React, { useState, useEffect, useContext } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';
import { translations } from '../translations';
import { XIcon } from './icons/XIcon';

export const HintBanner: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);
    const { language } = useContext(LanguageContext);
    const t = translations.hintBanner;

    useEffect(() => {
        const hintDismissed = localStorage.getItem('hintDismissed');
        if (!hintDismissed) {
            setIsVisible(true);
        }
    }, []);

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem('hintDismissed', 'true');
    };

    if (!isVisible) {
        return null;
    }

    return (
        <div className="bg-gray-800/50 border border-purple-500/30 rounded-lg p-4 relative flex items-start space-x-4">
            <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-purple-600/50 rounded-lg flex items-center justify-center">
                    <span className="text-xl">💡</span>
                </div>
            </div>
            <div className="flex-grow">
                <h3 className="text-lg font-bold text-purple-400">{t.title[language]}</h3>
                <p className="text-sm text-gray-300 mt-1">{t.p1[language]} {t.p2[language]}</p>
            </div>
            <button onClick={handleDismiss} className="absolute top-3 right-3 p-1 text-gray-400 hover:text-white transition-colors" aria-label="Dismiss hint">
                <XIcon className="w-5 h-5" />
            </button>
        </div>
    );
};
