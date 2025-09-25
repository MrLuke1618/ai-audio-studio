import React, { useMemo } from 'react';

const quotes = [
    "The ear is the only true writer and the only true reader. - Robert Frost",
    "Sound is the vocabulary of nature. - Pierre Schaeffer",
    "The music is not in the notes, but in the silence between. - Wolfgang Amadeus Mozart",
    "Great sound can make a good movie great. - Walter Murch",
    "Audio is a landscape that you can create and people can walk through. - Asbjoern Andersen",
    "Without music, life would be a mistake. - Friedrich Nietzsche",
    "The power of sound has always been greater than the power of sense. - Joseph Conrad",
    "Sound is 50 percent of the movie-going experience. - George Lucas",
    "Editing is where movies are made or broken. Many a film has been saved and many a film has been ruined in the editing room. - Joe Dante",
    "The job of the editor is to make the director look good. - Thelma Schoonmaker",
    "Every film is a puzzle. The editor is the one who solves it. - Dede Allen",
    "Sound is a visceral experience. It enters the body through the ears but it's felt everywhere. - Glenn Kuras",
    "Good audio doesn't make a video great, but bad audio will always ruin it. - Unknown",
    "Clarity of sound is clarity of thought. - Unknown",
    "The most important tool you have in your audio arsenal is your ears. - Mike Senior",
    "Dubbing is not just about replacing voices, it's about preserving emotions. - Unknown",
    "A podcast is a conversation that the world gets to listen in on. - Unknown",
    "The best subtitles are the ones you don't notice. - Unknown",
    "Technology is just a tool. In terms of getting the work done, it's all about the artists. - Tim Cook",
    "Creativity is intelligence having fun. - Albert Einstein",
    "The object of art is not to reproduce reality, but to create a reality of the same intensity. - Alberto Giacometti",
    "Art is the lie that enables us to realize the truth. - Pablo Picasso",
];

const Footer: React.FC = () => {
    const randomQuote = useMemo(() => quotes[Math.floor(Math.random() * quotes.length)], []);

    return (
        <footer className="p-4 border-t bg-slate-100 dark:bg-gray-950 border-slate-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 text-sm">
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
                <div className="quote-container text-center md:text-right max-w-sm">
                    <p className="italic">"{randomQuote}"</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;