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
        <nav className="flex space-x-1 bg-slate-900/50 rounded-lg p-1" role="tablist">
          {TABS.map(tab => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`${tab.id}-panel`}
              onClick={() => onTabChange(tab.id as TabType)}
              className={`
                relative px-6 py-3 font-semibold text-sm tracking-wide rounded-md
                transition-all duration-${ANIMATION_DURATION} ease-in-out
                focus:outline-none focus:ring-2 focus:ring-blue-500/50
                ${activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 transform scale-105'
                  : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
                }
              `}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 rounded-md opacity-80 -z-10" />
              )}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
};