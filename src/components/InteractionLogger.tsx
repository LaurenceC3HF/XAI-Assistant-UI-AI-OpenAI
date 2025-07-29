import React, { useState, useEffect } from 'react';
import { UserInteraction, UserSession, InteractionAnalytics } from '../types';
import { VisualCard } from './visualizations/VisualCard';
import { Download, BarChart3, Activity, Eye, MessageSquare, Clock, AlertCircle } from 'lucide-react';

interface InteractionLoggerProps {
  interactions: UserInteraction[];
  sessionId: string;
  onExport: () => void;
}

export const InteractionLogger: React.FC<InteractionLoggerProps> = ({
  interactions,
  sessionId,
  onExport
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [analytics, setAnalytics] = useState<InteractionAnalytics | null>(null);

  // Calculate analytics
  useEffect(() => {
    if (interactions.length === 0) return;

    const tabSwitches = interactions.filter(i => i.type === 'tab_switch');
    const chatMessages = interactions.filter(i => i.type === 'chat_message');
    const errors = interactions.filter(i => i.type === 'error_occurrence');
    const visualizationHovers = interactions.filter(i => i.type === 'visualization_hover');
    const visualizationClicks = interactions.filter(i => i.type === 'visualization_click');

    const tabUsage = tabSwitches.reduce((acc, i) => {
      const tab = i.data.toTab!;
      acc[tab] = (acc[tab] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const errorTypes = errors.reduce((acc, i) => {
      const type = i.data.errorType || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const hoverElements = visualizationHovers.reduce((acc, i) => {
      const element = i.data.elementId || 'unknown';
      acc[element] = (acc[element] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const clickElements = visualizationClicks.reduce((acc, i) => {
      const element = i.data.elementId || 'unknown';
      acc[element] = (acc[element] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const sessionStart = interactions.find(i => i.type === 'session_start');
    const sessionEnd = interactions.find(i => i.type === 'session_end');
    const sessionDuration = sessionEnd && sessionStart 
      ? new Date(sessionEnd.timestamp).getTime() - new Date(sessionStart.timestamp).getTime()
      : Date.now() - new Date(interactions[0]?.timestamp || Date.now()).getTime();

    const responseTimes = chatMessages
      .filter(i => i.data.responseTime)
      .map(i => i.data.responseTime!);

    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;

    const suggestedPromptClicks = interactions.filter(i => i.type === 'suggested_prompt_click').length;
    const suggestedPromptUsageRate = chatMessages.length > 0 
      ? (suggestedPromptClicks / chatMessages.length) * 100 
      : 0;

    setAnalytics({
      totalSessions: 1,
      totalInteractions: interactions.length,
      averageSessionDuration: sessionDuration,
      mostCommonInteractionType: getMostCommonType(),
      tabUsageDistribution: tabUsage as any,
      chatEngagementMetrics: {
        averageMessagesPerSession: chatMessages.length,
        averageMessageLength: chatMessages.reduce((acc, i) => acc + (i.data.messageLength || 0), 0) / Math.max(chatMessages.length, 1),
        suggestedPromptUsageRate
      },
      visualizationEngagement: {
        mostHoveredElements: Object.entries(hoverElements)
          .map(([element, count]) => ({ element, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5),
        mostClickedElements: Object.entries(clickElements)
          .map(([element, count]) => ({ element, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)
      },
      errorAnalytics: {
        totalErrors: errors.length,
        errorTypes
      }
    });
  }, [interactions]);

  const getMostCommonType = () => {
    const typeCounts = interactions.reduce((acc, i) => {
      acc[i.type] = (acc[i.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(typeCounts).reduce((a, b) => 
      typeCounts[a[0]] > typeCounts[b[0]] ? a : b
    )[0] as any;
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  };

  const exportAllData = () => {
    const allInteractions = JSON.parse(localStorage.getItem('xai_interactions') || '[]');
    const dataStr = JSON.stringify({
      exportTimestamp: new Date().toISOString(),
      currentSession: sessionId,
      analytics,
      allInteractions
    }, null, 2);
    
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `xai_complete_log_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const clearAllData = () => {
    if (confirm('Are you sure you want to clear all interaction data? This cannot be undone.')) {
      localStorage.removeItem('xai_interactions');
      window.location.reload();
    }
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed top-4 left-4 bg-intel-cyan hover:bg-intel-cyan/80 text-intel-black p-3 rounded-full shadow-lg transition-all duration-200 z-50"
        title="View Interaction Analytics"
      >
        <BarChart3 className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-intel-black border border-intel-gray rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-intel-gray flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Activity className="w-6 h-6 text-gray-400" />
            <h2 className="text-xl font-bold text-white">User Interaction Analytics</h2>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Session Info */}
          <VisualCard>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Current Session</h3>
              <div className="flex space-x-2">
                <button
                  onClick={onExport}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Session</span>
                </button>
                <button
                  onClick={exportAllData}
                  className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Export All</span>
                </button>
                <button
                  onClick={clearAllData}
                  className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-sm transition-colors"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>Clear Data</span>
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-intel-gray/50 p-3 rounded-lg">
                <div className="text-sm text-gray-400">Session ID</div>
                <div className="text-white font-mono text-xs">{sessionId.slice(-8)}</div>
              </div>
              <div className="bg-intel-gray/50 p-3 rounded-lg">
                <div className="text-sm text-gray-400">Total Interactions</div>
                <div className="text-white font-bold">{interactions.length}</div>
              </div>
              <div className="bg-intel-gray/50 p-3 rounded-lg">
                <div className="text-sm text-gray-400">Duration</div>
                <div className="text-white font-bold">
                  {analytics ? formatDuration(analytics.averageSessionDuration) : '0s'}
                </div>
              </div>
              <div className="bg-intel-gray/50 p-3 rounded-lg">
                <div className="text-sm text-gray-400">Most Common Action</div>
                <div className="text-white font-bold text-xs">
                  {analytics?.mostCommonInteractionType.replace('_', ' ').toUpperCase()}
                </div>
              </div>
            </div>
          </VisualCard>

          {/* Analytics */}
          {analytics && (
            <>
              {/* Tab Usage */}
              <VisualCard>
                <div className="flex items-center mb-4">
                  <Eye className="w-5 h-5 text-gray-400 mr-2" />
                  <h3 className="text-lg font-semibold text-white">Tab Usage Distribution</h3>
                </div>
                <div className="space-y-3">
                  {Object.entries(analytics.tabUsageDistribution).map(([tab, count]) => (
                    <div key={tab} className="flex items-center justify-between">
                      <span className="text-gray-200 capitalize">{tab}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-intel-gray rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                            style={{ 
                              width: `${(count / Math.max(...Object.values(analytics.tabUsageDistribution))) * 100}%` 
                            }}
                          />
                        </div>
                        <span className="text-white font-bold text-sm w-8">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </VisualCard>

              {/* Chat Engagement */}
              <VisualCard>
                <div className="flex items-center mb-4">
                  <MessageSquare className="w-5 h-5 text-gray-400 mr-2" />
                  <h3 className="text-lg font-semibold text-white">Chat Engagement</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-intel-gray/50 p-3 rounded-lg">
                    <div className="text-sm text-gray-400">Messages Sent</div>
                    <div className="text-white font-bold">{analytics.chatEngagementMetrics.averageMessagesPerSession}</div>
                  </div>
                  <div className="bg-intel-gray/50 p-3 rounded-lg">
                    <div className="text-sm text-gray-400">Avg Message Length</div>
                    <div className="text-white font-bold">{Math.round(analytics.chatEngagementMetrics.averageMessageLength)} chars</div>
                  </div>
                  <div className="bg-intel-gray/50 p-3 rounded-lg">
                    <div className="text-sm text-gray-400">Suggested Prompt Usage</div>
                    <div className="text-white font-bold">{Math.round(analytics.chatEngagementMetrics.suggestedPromptUsageRate)}%</div>
                  </div>
                </div>
              </VisualCard>

              {/* Recent Interactions */}
              <VisualCard>
                <div className="flex items-center mb-4">
                  <Clock className="w-5 h-5 text-gray-400 mr-2" />
                  <h3 className="text-lg font-semibold text-white">Recent Interactions</h3>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {interactions.slice(-10).reverse().map((interaction, index) => (
                    <div key={interaction.id} className="bg-intel-gray/50 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-300">
                          {interaction.type.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(interaction.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      {interaction.data.message && (
                        <div className="text-xs text-gray-200 truncate">
                          Message: "{interaction.data.message}"
                        </div>
                      )}
                      {interaction.data.fromTab && interaction.data.toTab && (
                        <div className="text-xs text-gray-200">
                          Tab: {interaction.data.fromTab} → {interaction.data.toTab}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </VisualCard>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
