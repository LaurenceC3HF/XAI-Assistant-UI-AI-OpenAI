import React from 'react';
import { ScenarioPhase } from '../types';
import { VisualCard } from './visualizations/VisualCard';
import { Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface ScenarioPhasesProps {
  phases: ScenarioPhase[];
}

export const ScenarioPhases: React.FC<ScenarioPhasesProps> = ({ phases }) => {
  return (
    <VisualCard>
      <div className="flex items-center mb-6">
        <Clock className="w-6 h-6 text-blue-400 mr-3" />
        <h3 className="text-lg font-semibold text-blue-300">
          Mission Timeline & Phases
        </h3>
      </div>

      {/* Horizontal progression bar with labels */}
      <div className="mb-8 flex items-center justify-between">
        {phases.map((phase, index) => (
          <div key={index} className="flex flex-col items-center flex-1">
            <div className="flex items-center w-full">
              {index > 0 && <div className="flex-1 h-1 bg-slate-600" />}
              <div className="w-3 h-3 bg-blue-500" />
              {index < phases.length - 1 && <div className="flex-1 h-1 bg-slate-600" />}
            </div>
            <span className="mt-2 text-xs text-gray-300 whitespace-nowrap">
              {phase.phase}
            </span>
          </div>
        ))}
      </div>

      <div className="space-y-6">
        {phases.map((phase, index) => (
          <div key={index} className="relative">
            <h4 className="text-lg font-semibold text-white mb-2">
              {phase.phase}
            </h4>
            <div className="ml-4 space-y-2">
              {phase.actions.map((action, actionIndex) => {
                const isXAIActivation = action.includes('XAI Panel');
                return (
                  <div
                    key={actionIndex}
                    className={`
                      flex items-start p-3 rounded-lg transition-all duration-200
                      ${isXAIActivation
                        ? 'bg-amber-500/20 border border-amber-500/50 text-amber-200'
                        : 'bg-slate-800/50 hover:bg-slate-800/70 text-gray-300'
                      }
                    `}
                  >
                    <div className="flex-shrink-0 mr-3 mt-0.5">
                      {isXAIActivation ? (
                        <AlertCircle className="w-4 h-4 text-amber-400" />
                      ) : (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      )}
                    </div>
                    <span className={`text-sm leading-relaxed ${isXAIActivation ? 'font-semibold' : ''}`}>
                      {action}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </VisualCard>
  );
};