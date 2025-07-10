import React from 'react';
import { XAIExplanation } from '../../types';
import { VisualCard } from '../visualizations/VisualCard';
import { AlternativeOutcomes } from '../visualizations/AlternativeOutcomes';
import { Activity } from 'lucide-react';

interface ProjectionTabProps {
  explanation: XAIExplanation;
  onVisualizationHover?: (elementId: string, visualizationType: string) => () => void;
  onVisualizationClick?: (elementId: string, visualizationType: string) => void;
}

export const ProjectionTab: React.FC<ProjectionTabProps> = ({ 
  explanation,
  onVisualizationHover,
  onVisualizationClick
}) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <VisualCard>
        <div className="flex items-center mb-4">
          <Activity className="w-6 h-6 text-purple-400 mr-3" />
          <h3 className="text-lg font-semibold text-purple-300">
            Highlights
          </h3>
        </div>
        <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
          {explanation.projection?.text}
        </p>
      </VisualCard>
      
      <AlternativeOutcomes 
        alternatives={explanation.projection?.alternatives}
        onVisualizationHover={onVisualizationHover}
        onVisualizationClick={onVisualizationClick}
      />
    </div>
  );
};
