import React, { useEffect } from 'react';
import { XAIExplanation, TabType, COAScenario } from '../types';
import { InsightTab } from './tabs/InsightTab';
import { ReasoningTab } from './tabs/ReasoningTab';
import { ProjectionTab } from './tabs/ProjectionTab';

interface MainContentProps {
  explanation: XAIExplanation;
  activeTab: TabType;
  scenario: COAScenario;
  onVisualizationHover?: (elementId: string, visualizationType: string) => () => void;
  onVisualizationClick?: (elementId: string, visualizationType: string) => void;
  onCOAInteraction?: (coaId: string, coaName: string, interactionType: 'hover' | 'click') => void;
  onScrollEvent?: (scrollPosition: number) => void;
}

export const MainContent: React.FC<MainContentProps> = ({ 
  explanation, 
  activeTab, 
  scenario,
  onVisualizationHover,
  onVisualizationClick,
  onCOAInteraction,
  onScrollEvent
}) => {
  // Track scroll events
  useEffect(() => {
    if (!onScrollEvent) return;

    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      const scrollPosition = target.scrollTop;
      
      // Debounce scroll events
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        onScrollEvent(scrollPosition);
      }, 100);
    };

    const mainElement = document.querySelector('main');
    if (mainElement) {
      mainElement.addEventListener('scroll', handleScroll);
      return () => {
        mainElement.removeEventListener('scroll', handleScroll);
        clearTimeout(scrollTimeout);
      };
    }
  }, [onScrollEvent]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'insight':
        return (
          <InsightTab 
            explanation={explanation} 
            scenario={scenario}
            onVisualizationHover={onVisualizationHover}
            onVisualizationClick={onVisualizationClick}
            onCOAInteraction={onCOAInteraction}
          />
        );
      case 'reasoning':
        return (
          <ReasoningTab 
            explanation={explanation}
            onVisualizationHover={onVisualizationHover}
            onVisualizationClick={onVisualizationClick}
          />
        );
      case 'projection':
        return (
          <ProjectionTab 
            explanation={explanation}
            onVisualizationHover={onVisualizationHover}
            onVisualizationClick={onVisualizationClick}
          />
        );
      default:
        return null;
    }
  };

  const confidenceBar = React.useMemo(() => {
    if (!explanation.confidence) return null;
    const filled = Math.round(explanation.confidence / 10);
    const empty = 10 - filled;
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    return `${bar} ${explanation.confidence}%`;
  }, [explanation.confidence]);

  return (
    <main className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-intel-black via-intel-gray to-intel-black scrollbar-thin">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2 leading-tight">
            {explanation.response || "Select an analysis from the chat history"}
          </h2>
          {explanation.confidence && (
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-400">Confidence Level:</span>
              <div className="flex items-center bg-intel-gray/50 rounded-full px-3 py-1">
                <div className="w-16 bg-intel-gray rounded-full h-2 mr-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${explanation.confidence}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-white">
                  {explanation.confidence}%
                </span>
              </div>
            </div>
          )}
        </div>

        <div role="tabpanel" id={`${activeTab}-panel`} aria-labelledby={`${activeTab}-tab`}>
          {renderTabContent()}
        </div>
      </div>
    </main>
  );
};
