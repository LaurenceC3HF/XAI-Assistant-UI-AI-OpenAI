import React from 'react';
import { XAIExplanation } from '../../types';
import { VisualCard } from '../visualizations/VisualCard';
import { DAGVisual } from '../visualizations/DAGVisual';
import { SHAPVisual } from '../visualizations/SHAPVisual';
import { BrainCircuit } from 'lucide-react';

interface ReasoningTabProps {
  explanation: XAIExplanation;
  onVisualizationHover?: (elementId: string, visualizationType: string) => () => void;
  onVisualizationClick?: (elementId: string, visualizationType: string) => void;
}

export const ReasoningTab: React.FC<ReasoningTabProps> = ({ 
  explanation,
  onVisualizationHover,
  onVisualizationClick
}) => {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Put summary and SHAP side-by-side */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <VisualCard>
          <div className="flex items-center mb-4">
            <BrainCircuit className="w-6 h-6 text-yellow-400 mr-3" />
            <h3 className="text-lg font-semibold text-yellow-300">
              Highlights
            </h3>
          </div>
          <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">
            {explanation.reasoning?.text}
          </p>
        </VisualCard>
        <SHAPVisual 
          shapData={explanation.reasoning?.shap}
          onVisualizationHover={onVisualizationHover}
          onVisualizationClick={onVisualizationClick}
        />
      </div>
      {/* Make DAG visual span full width */}
      <div className="w-full">
        <DAGVisual 
          dagData={explanation.reasoning?.dag}
          onVisualizationHover={onVisualizationHover}
          onVisualizationClick={onVisualizationClick}
          className="w-full"
        />
      </div>
    </div>
  );
};
