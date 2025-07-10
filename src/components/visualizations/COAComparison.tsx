import React from 'react';
import { CourseOfAction } from '../../types';
import { VisualCard } from './VisualCard';
import { Target, AlertTriangle, CheckCircle } from 'lucide-react';

interface COAComparisonProps {
  coas: CourseOfAction[];
  onCOAInteraction?: (coaId: string, coaName: string, interactionType: 'hover' | 'click') => void;
  onVisualizationClick?: (elementId: string, visualizationType: string) => void;
}

export const COAComparison: React.FC<COAComparisonProps> = ({
  coas,
  onCOAInteraction,
  onVisualizationClick
}) => {
  // Remove all hover/animate/transition/scale classes
  const getBorderColor = (id: string, recommendationScore: number) => {
    if (id === 'coa2') return 'border-blue-500';
    if (recommendationScore >= 0.75) return 'border-green-500';
    if (recommendationScore <= 0.3) return 'border-red-500';
    return 'border-slate-500';
  };

  const handleMouseEnterCOA = (coa: CourseOfAction) => {
    onCOAInteraction?.(coa.id, coa.name, 'hover');
  };

  const handleMouseLeaveCOA = (coa: CourseOfAction) => {
    onCOAInteraction?.(coa.id, coa.name, 'hover');
  };

  const handleCOAClick = (coa: CourseOfAction) => {
    onCOAInteraction?.(coa.id, coa.name, 'click');
    onVisualizationClick?.(coa.id, 'coa_card');
  };

  return (
    <VisualCard title="Course of Action Analysis">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {coas.map(coa => (
          <div
            key={coa.id}
            className={`
              relative bg-slate-900/60 border-2 rounded-lg p-4
              cursor-pointer
              ${getBorderColor(coa.id, coa.recommendationScore)}
            `}
            onMouseEnter={() => handleMouseEnterCOA(coa)}
            onMouseLeave={() => handleMouseLeaveCOA(coa)}
            onClick={() => handleCOAClick(coa)}
          >
            {coa.id === 'coa2' && (
              <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full flex items-center">
                <CheckCircle className="w-3 h-3 mr-1" />
                RECOMMENDED
              </div>
            )}
            
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center">
                <Target className="w-5 h-5 text-blue-400 mr-2" />
                <h4 className="font-bold text-white text-sm">{coa.name}</h4>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-bold ${getScoreColor(coa.recommendationScore)}`}>
                {coa.recommendationScore}
              </div>
            </div>
            
            <p className="text-xs text-gray-300 mb-4 leading-relaxed">
              {coa.summary}
            </p>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Risk:</span>
                <span className="text-xs font-semibold text-red-400 flex items-center">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {coa.risk}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Reward:</span>
                <span className="text-xs font-semibold text-green-400 flex items-center">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {coa.reward}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </VisualCard>
  );
};

function getScoreColor(score: number): string {
  if (score >= 0.75) return 'bg-green-800 text-green-400';
  if (score <= 0.3) return 'bg-red-800 text-red-400';
  return 'bg-slate-800 text-slate-200';
}
