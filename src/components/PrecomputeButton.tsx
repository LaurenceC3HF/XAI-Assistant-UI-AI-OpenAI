import React, { useState } from 'react';
import { PrecomputePanel } from './PrecomputePanel';
import { usePrecompute } from '../hooks/usePrecompute';
import { Database, Zap, CheckCircle, AlertCircle } from 'lucide-react';

export const PrecomputeButton: React.FC = () => {
  const [showPanel, setShowPanel] = useState(false);
  const { 
    isInitialized, 
    statistics, 
    precomputeCommonQueries,
    getCachedResponse 
  } = usePrecompute({
    autoInitialize: true,
    refreshInterval: 5000
  });

  const handleQuickPrecompute = async () => {
    try {
      await precomputeCommonQueries();
    } catch (error) {
      console.error('Failed to precompute common queries:', error);
    }
  };

  const getCacheStatus = () => {
    if (!statistics) return { color: 'text-gray-400', icon: Database, text: 'No data' };
    
    const cacheHitRate = statistics.totalQueries > 0 
      ? (statistics.successfulQueries / statistics.totalQueries) * 100 
      : 0;

    if (cacheHitRate >= 80) {
      return { color: 'text-green-400', icon: CheckCircle, text: `${Math.round(cacheHitRate)}% cached` };
    } else if (cacheHitRate >= 50) {
      return { color: 'text-yellow-400', icon: AlertCircle, text: `${Math.round(cacheHitRate)}% cached` };
    } else {
      return { color: 'text-red-400', icon: AlertCircle, text: `${Math.round(cacheHitRate)}% cached` };
    }
  };

  const status = getCacheStatus();
  const StatusIcon = status.icon;

  return (
    <>
      <div className="fixed top-4 right-4 flex flex-col items-end space-y-2 z-40">
        {/* Main precompute button */}
        <button
          onClick={() => setShowPanel(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-105 group"
          title="Open Precompute System"
        >
          <Database className="w-5 h-5" />
        </button>

        {/* Quick precompute button */}
        {isInitialized && (
          <button
            onClick={handleQuickPrecompute}
            className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg transition-all duration-200 hover:scale-105 group"
            title="Quick Precompute Common Queries"
          >
            <Zap className="w-4 h-4" />
          </button>
        )}

        {/* Status indicator */}
        {statistics && (
          <div className="bg-slate-800/90 backdrop-blur-sm border border-slate-700 rounded-lg px-3 py-2 shadow-lg">
            <div className="flex items-center space-x-2">
              <StatusIcon className={`w-4 h-4 ${status.color}`} />
              <span className="text-xs text-white">{status.text}</span>
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {statistics.totalJobs} jobs • {statistics.totalQueries} queries
            </div>
          </div>
        )}
      </div>

      {/* Precompute panel */}
      <PrecomputePanel 
        isVisible={showPanel} 
        onClose={() => setShowPanel(false)} 
      />
    </>
  );
};