import React from 'react';
import { TabType } from '../types';
import { TABS, ANIMATION_DURATION } from '../utils/constants';

interface HeaderProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange }) => {
  return (
    <header className="flex-shrink-0 bg-slate-800/90 backdrop-blur-sm shadow-lg border-b border-slate-700/50">
      <div className="flex justify-center items-center px-6 py-4">
        <nav className="flex space-x-1 p-1" role="tablist">
          {TABS.map(tab => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`${tab.id}-panel`}
              onClick={() => onTabChange(tab.id as TabType)}
              className={`px-4 py-2 text-xs font-mono uppercase border transition-colors duration-${ANIMATION_DURATION} 
                ${activeTab === tab.id
                  ? 'bg-cyan-700 text-white'
                  : 'text-cyan-300 hover:bg-slate-700/50'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
};