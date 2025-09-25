import React, { useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';

const Settings: React.FC = () => {
    const { theme, toggleTheme } = useContext(ThemeContext);

    return (
        <div className="animate-fade-in">
            <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white">Settings</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2 mb-8">Customize your application experience.</p>
            
            <div className="mt-8 max-w-md space-y-6">
                <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Appearance</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Choose how the application looks.</p>
                    
                    <div className="mt-4 flex items-center justify-between">
                        <span className="font-medium text-gray-700 dark:text-gray-300">Theme</span>
                        <div className="flex items-center space-x-2 bg-gray-200 dark:bg-gray-900 p-1 rounded-full">
                            <button 
                                onClick={() => theme !== 'light' && toggleTheme()}
                                className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors ${theme === 'light' ? 'bg-purple-600 text-white' : 'text-gray-500 dark:text-gray-400'}`}
                            >
                                Light
                            </button>
                            <button 
                                onClick={() => theme !== 'dark' && toggleTheme()}
                                className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors ${theme === 'dark' ? 'bg-purple-600 text-white' : 'text-gray-500 dark:text-gray-400'}`}
                            >
                                Dark
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
