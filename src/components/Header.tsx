import React from 'react';
import { TabType } from '../types';
import { TABS, ANIMATION_DURATION } from '../utils/constants';

interface HeaderProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange }) => {
  return (
    <header className="flex-shrink-0 bg-intel-gray/90 backdrop-blur-sm shadow-lg border-b border-intel-gray">
      <div className="flex justify-center items-center px-6 py-4">
        <nav className="flex space-x-1 bg-intel-black/50 rounded-lg p-1" role="tablist">
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
                focus:outline-none focus:ring-2 focus:ring-intel-cyan/50
                ${activeTab === tab.id
                  ? 'bg-intel-cyan text-intel-black shadow-lg shadow-intel-cyan/25 transform scale-105'
                  : 'text-intel-cyan/60 hover:text-intel-cyan hover:bg-intel-black/50'
                }
              `}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute inset-0 bg-gradient-to-r from-intel-cyan to-intel-cyan/80 rounded-md opacity-80 -z-10" />
              )}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
};