import React, { useMemo, useContext } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';
import { translations } from '../translations';

const Footer: React.FC = () => {
    const { language } = useContext(LanguageContext);
    const quotes = translations.quotes;

    const randomQuote = useMemo(() => {
        const index = Math.floor(Math.random() * quotes.length);
        return quotes[index][language];
    }, [language, quotes]);

    return (
        <footer className="p-4 border-t bg-gray-950 border-gray-800 text-gray-400 text-sm">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
                <div className="flex items-center space-x-4">
                    <p className="copyright-text">&copy; 2025 MrLuke1618. All rights reserved.</p>
                    <div className="social-icons flex space-x-4">
                        <a href="https://www.youtube.com/@luke1618gamer" target="_blank" aria-label="YouTube" className="hover:text-purple-500 transition-colors">
                            <i className="fab fa-youtube"></i>
                        </a>
                        <a href="https://www.tiktok.com/@hoangcao2704" target="_blank" aria-label="TikTok" className="hover:text-purple-500 transition-colors">
                            <i className="fab fa-tiktok"></i>
                        </a>
                        <a href="https://www.linkedin.com/in/hoangminhcao" target="_blank" aria-label="LinkedIn" className="hover:text-purple-500 transition-colors">
                            <i className="fab fa-linkedin"></i>
                        </a>
                    </div>
                </div>
                <div className="quote-container text-center md:text-right max-w-sm hidden lg:block">
                    <p className="italic">"{randomQuote}"</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;