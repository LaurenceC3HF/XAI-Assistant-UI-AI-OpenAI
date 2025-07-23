import { useState, useCallback, useRef, useEffect } from 'react';
import { ChatMessage, XAIExplanation } from '../types';
import { generateScriptedResponse } from '../utils/scriptedResponses';
import { getQueryContext } from '../utils/queryAnalyzer';

export const useChat = (initialScenario: any) => {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const logEvent = useCallback((type: ChatMessage['type'], details: ChatMessage['details']) => {
    const newMessage: ChatMessage = {
      timestamp: new Date().toISOString(),
      type,
      details
    };
    setChatHistory(prev => [...prev, newMessage]);
  }, []);

  const sendMessage = useCallback(async (message: string): Promise<XAIExplanation | null> => {
    if (!message.trim() || isLoading) return null;

    setError(null);
    logEvent('user_query', { query: message });
    setIsLoading(true);

    try {
      // Simulate realistic processing time
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));

      const context = getQueryContext(message);

      if (context === 'general') {
        const resp = await fetch('/api/openai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: message })
        });
        
        const data = await resp.json();
        
        const answer: XAIExplanation = {
          defaultTab: data.defaultTab,
          response: data[data.defaultTab], // get the text from the active explanation type
          insight: data.insight ? { text: data.insight } : { text: '' },
          reasoning: data.reasoning ? { text: data.reasoning } : { text: '' },
          projection: data.projection ? { text: data.projection } : { text: '' },
          confidence: data.confidence || null,
          showShapChart: data.showShapChart || false,
          showDAG: data.showDAG || false,
          highlightedFeatures: data.highlightedFeatures || [],
          graphNodes: data.graphNodes || [],
          suggestedPrompts: data.suggestedPrompts || []
        };
        logEvent('ai_response', { question: message, response: answer });
        return answer;
      }

      if (context === 'weather') {
        const resp = await fetch('/api/weather', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ location: message })
        });
        const data = await resp.json();
        const info = data.result;
        const answer: XAIExplanation = {
          defaultTab: 'insight',
          response: `Current weather in ${info.location}: ${info.temperature}°C, ${info.description}.`,
          insight: { text: `The temperature in ${info.location} is ${info.temperature}°C with ${info.description}.` },
          reasoning: { text: '' },
          projection: { text: '' }
        };
        logEvent('ai_response', { question: message, response: answer });
        return answer;
      }

      const response = generateScriptedResponse(message);
      logEvent('ai_response', { question: message, response });
      return response;
    } catch (err) {
      const errorMessage = 'Unable to process query. Please try again.';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, logEvent]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  return {
    chatHistory,
    isLoading,
    error,
    sendMessage,
    logEvent,
    chatContainerRef,
    clearError: () => setError(null)
  };
};
