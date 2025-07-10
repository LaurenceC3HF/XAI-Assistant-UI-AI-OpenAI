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
      
      <div className="space-y-6">
        {phases.map((phase, index) => (
          <div key={index} className="relative">
            {/* Phase Header */}
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm mr-4">
                {index + 1}
              </div>
              <h4 className="text-lg font-semibold text-white">
                {phase.phase}
              </h4>
            </div>
            
            {/* Actions List */}
            <div className="ml-12 space-y-2">
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
            
            {/* Connector Line */}
            {index < phases.length - 1 && (
              <div className="absolute left-4 top-12 w-0.5 h-8 bg-slate-600"></div>
            )}
          </div>
        ))}
      </div>
    </VisualCard>
  );
};