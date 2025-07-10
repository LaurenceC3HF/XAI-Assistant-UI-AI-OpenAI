import { useState, useCallback, useRef, useEffect } from 'react';
import { UserInteraction, InteractionType, InteractionData, InteractionContext, TabType, UserSession } from '../types';

export const useInteractionLogger = (currentTab: TabType, chatHistoryLength: number, currentExplanation?: string) => {
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [interactions, setInteractions] = useState<UserInteraction[]>([]);
  const sessionStartTime = useRef(Date.now());
  const lastScrollPosition = useRef(0);
  const hoverTimers = useRef<Map<string, number>>(new Map());

  // Generate interaction context
  const getContext = useCallback((): InteractionContext => ({
    currentTab,
    chatHistoryLength,
    sessionDuration: Date.now() - sessionStartTime.current,
    currentExplanation,
    userAgent: navigator.userAgent,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    timestamp: new Date().toISOString()
  }), [currentTab, chatHistoryLength, currentExplanation]);

  // Log interaction
  const logInteraction = useCallback((type: InteractionType, data: InteractionData = {}) => {
    const interaction: UserInteraction = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sessionId,
      timestamp: new Date().toISOString(),
      type,
      data,
      context: getContext()
    };

    setInteractions(prev => [...prev, interaction]);
    
    // Store in localStorage for persistence
    const storedInteractions = JSON.parse(localStorage.getItem('xai_interactions') || '[]');
    storedInteractions.push(interaction);
    localStorage.setItem('xai_interactions', JSON.stringify(storedInteractions));
    
    // Console log for development (remove in production)
    console.log('User Interaction:', interaction);
  }, [sessionId, getContext]);

  // Specific logging methods
  const logTabSwitch = useCallback((fromTab: TabType, toTab: TabType) => {
    logInteraction('tab_switch', { fromTab, toTab });
  }, [logInteraction]);

  const logChatMessage = useCallback((message: string, responseTime?: number) => {
    logInteraction('chat_message', { 
      message, 
      messageLength: message.length,
      responseTime 
    });
  }, [logInteraction]);

  const logSuggestedPromptClick = useCallback((prompt: string) => {
    logInteraction('suggested_prompt_click', { suggestedPrompt: prompt });
  }, [logInteraction]);

  const logHistoryClick = useCallback((messageType: string) => {
    logInteraction('history_click', { value: messageType });
  }, [logInteraction]);

  const logVisualizationHover = useCallback((elementId: string, visualizationType: string) => {
    const startTime = Date.now();
    hoverTimers.current.set(elementId, startTime);
    
    return () => {
      const endTime = Date.now();
      const duration = endTime - startTime;
      hoverTimers.current.delete(elementId);
      
      logInteraction('visualization_hover', {
        elementId,
        visualizationType,
        hoverDuration: duration
      });
    };
  }, [logInteraction]);

  const logVisualizationClick = useCallback((elementId: string, visualizationType: string) => {
    logInteraction('visualization_click', { elementId, visualizationType });
  }, [logInteraction]);

  const logCOAInteraction = useCallback((coaId: string, coaName: string, interactionType: 'hover' | 'click') => {
    logInteraction(interactionType === 'hover' ? 'coa_card_hover' : 'coa_card_click', {
      coaId,
      coaName
    });
  }, [logInteraction]);

  const logError = useCallback((errorMessage: string, errorType: string = 'general') => {
    logInteraction('error_occurrence', { errorMessage, errorType });
  }, [logInteraction]);

  const logScrollEvent = useCallback((scrollPosition: number) => {
    const direction = scrollPosition > lastScrollPosition.current ? 'down' : 'up';
    lastScrollPosition.current = scrollPosition;
    
    logInteraction('scroll_event', { 
      scrollPosition, 
      scrollDirection: direction 
    });
  }, [logInteraction]);

  // Export interactions
  const exportInteractions = useCallback(() => {
    const session: UserSession = {
      sessionId,
      startTime: new Date(sessionStartTime.current).toISOString(),
      endTime: new Date().toISOString(),
      duration: Date.now() - sessionStartTime.current,
      interactions,
      userAgent: navigator.userAgent,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      totalTabSwitches: interactions.filter(i => i.type === 'tab_switch').length,
      totalChatMessages: interactions.filter(i => i.type === 'chat_message').length,
      totalSuggestedPromptClicks: interactions.filter(i => i.type === 'suggested_prompt_click').length,
      mostUsedTab: getMostUsedTab(),
      averageResponseTime: getAverageResponseTime()
    };

    const dataStr = JSON.stringify(session, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `xai_session_${sessionId}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [sessionId, interactions]);

  // Analytics helpers
  const getMostUsedTab = useCallback((): TabType => {
    const tabCounts = interactions
      .filter(i => i.type === 'tab_switch')
      .reduce((acc, i) => {
        const tab = i.data.toTab as TabType;
        acc[tab] = (acc[tab] || 0) + 1;
        return acc;
      }, {} as Record<TabType, number>);
    
    return Object.entries(tabCounts).reduce((a, b) => 
      tabCounts[a[0] as TabType] > tabCounts[b[0] as TabType] ? a : b
    )[0] as TabType || 'insight';
  }, [interactions]);

  const getAverageResponseTime = useCallback((): number => {
    const responseTimes = interactions
      .filter(i => i.type === 'chat_message' && i.data.responseTime)
      .map(i => i.data.responseTime!);
    
    return responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 0;
  }, [interactions]);

  // Initialize session
  useEffect(() => {
    logInteraction('session_start');
    
    // Page focus/blur tracking
    const handleFocus = () => logInteraction('page_focus');
    const handleBlur = () => logInteraction('page_blur');
    
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    
    // Cleanup on unmount
    return () => {
      logInteraction('session_end');
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [logInteraction]);

  return {
    sessionId,
    interactions,
    logTabSwitch,
    logChatMessage,
    logSuggestedPromptClick,
    logHistoryClick,
    logVisualizationHover,
    logVisualizationClick,
    logCOAInteraction,
    logError,
    logScrollEvent,
    exportInteractions,
    getMostUsedTab,
    getAverageResponseTime
  };
};
