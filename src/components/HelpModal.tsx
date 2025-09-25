import { FC, ReactNode } from 'react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

const HelpModal: FC<HelpModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 animate-fade-in-fast"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-modal-title"
    >
      <div
        className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-lg p-6 relative"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
      >
        <div className="flex justify-between items-center mb-4">
          <h2 id="help-modal-title" className="text-xl font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close help modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div>
          {children}
        </div>
      </div>
    </div>
  );
};

export default HelpModal;