import React from 'react';
import { XAIExplanation, COAScenario } from '../../types';
import { VisualCard } from '../visualizations/VisualCard';
import { COAComparison } from '../visualizations/COAComparison';
import { Eye } from 'lucide-react';

interface InsightTabProps {
  explanation: XAIExplanation;
  scenario: COAScenario;
  onVisualizationHover?: (elementId: string, visualizationType: string) => () => void;
  onVisualizationClick?: (elementId: string, visualizationType: string) => void;
  onCOAInteraction?: (coaId: string, coaName: string, interactionType: 'hover' | 'click') => void;
}

export const InsightTab: React.FC<InsightTabProps> = ({ 
  explanation, 
  scenario,
  onVisualizationHover,
  onVisualizationClick,
  onCOAInteraction
}) => {
  return (
    <div className="space-y-8 animate-fade-in">
      <VisualCard>
        <div className="flex items-center mb-4">
          <Eye className="w-6 h-6 text-blue-400 mr-3" />
          <h3 className="text-lg font-semibold text-blue-300">
            Highlights
          </h3>
        </div>
        <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">
          {explanation.insight?.text}
        </p>
      </VisualCard>
      
      <COAComparison 
        coas={scenario.coursesOfAction}
        onVisualizationHover={onVisualizationHover}
        onVisualizationClick={onVisualizationClick}
        onCOAInteraction={onCOAInteraction}
      />
    </div>
  );
};
