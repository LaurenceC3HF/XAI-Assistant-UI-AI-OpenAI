import React from 'react';
import { Header } from './components/Header';
import { MainContent } from './components/MainContent';
import { ChatPanel } from './components/ChatPanel';
import { InteractionLogger } from './components/InteractionLogger';
import { useXAI } from './hooks/useXAI';
import { useChat } from './hooks/useChat';
import { useInteractionLogger } from './hooks/useInteractionLogger';
import { defaultScenario } from './data/scenarios';
import { ChatMessage } from './types';

function App() {
  const {
    currentExplanation,
    activeTab,
    confidence,
    suggestedPrompts,
    setActiveTab,
    updateExplanation
  } = useXAI(defaultScenario);

  const {
    chatHistory,
    isLoading,
    error,
    sendMessage,
    logEvent,
    chatContainerRef,
    clearError
  } = useChat(defaultScenario);

  const {
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
    exportInteractions
  } = useInteractionLogger(activeTab, chatHistory.length, currentExplanation.response);

  const handleTabChange = (newTab: typeof activeTab) => {
    logTabSwitch(activeTab, newTab);
    setActiveTab(newTab);
  };

  const handleSendMessage = async (message: string) => {
    const startTime = Date.now();
    logChatMessage(message);
    
    const response = await sendMessage(message);
    const responseTime = Date.now() - startTime;
    
    if (response) {
      logChatMessage(message, responseTime);
    }
    
    return response;
  };

  const handleSuggestedPromptClick = (prompt: string) => {
    logSuggestedPromptClick(prompt);
  };

  const handleHistoryClick = (item: ChatMessage) => {
    logHistoryClick(item.type);
    if (item.type === 'ai_response' && item.details.response) {
      updateExplanation(item.details.response);
    }
  };

  const handleError = (errorMessage: string) => {
    logError(errorMessage);
  };

  // Enhanced chat panel with interaction logging
  const enhancedChatPanel = (
    <ChatPanel
      chatHistory={chatHistory}
      isLoading={isLoading}
      error={error}
      suggestedPrompts={suggestedPrompts}
      onSendMessage={handleSendMessage}
      onHistoryClick={handleHistoryClick}
      onClearError={clearError}
      onSuggestedPromptClick={handleSuggestedPromptClick}
      chatContainerRef={chatContainerRef}
    />
  );

  return (
    <div className="flex h-screen bg-gradient-to-br from-intel-black via-intel-gray to-intel-black text-intel-cyan font-sans overflow-hidden">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header activeTab={activeTab} onTabChange={handleTabChange} />
        <MainContent 
          explanation={currentExplanation}
          activeTab={activeTab}
          scenario={defaultScenario}
          onVisualizationHover={logVisualizationHover}
          onVisualizationClick={logVisualizationClick}
          onCOAInteraction={logCOAInteraction}
          onScrollEvent={logScrollEvent}
        />
      </div>

      {/* Chat Panel */}
      {enhancedChatPanel}

      {/* Interaction Logger */}
      <InteractionLogger
        interactions={interactions}
        sessionId={sessionId}
        onExport={exportInteractions}
      />

      {/* Global Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          * {
            font-family: 'Segoe UI Variable', 'Segoe UI', system-ui, sans-serif;
          }
          
          .scrollbar-thin::-webkit-scrollbar {
            width: 6px;
          }
          
          .scrollbar-thin::-webkit-scrollbar-track {
            background: transparent;
          }
          
          .scrollbar-thin::-webkit-scrollbar-thumb {
            background-color: #475569;
            border-radius: 3px;
          }
          
          .scrollbar-thin::-webkit-scrollbar-thumb:hover {
            background-color: #64748b;
          }
          
          .animate-fade-in {
            animation: fadeIn 0.6s ease-out;
          }
          
          @keyframes fadeIn {
            from { 
              opacity: 0; 
              transform: translateY(10px); 
            }
            to { 
              opacity: 1; 
              transform: translateY(0); 
            }
          }
          
          .font-mono {
            font-family: 'Segoe UI Variable', 'Segoe UI', system-ui, sans-serif;
          }

          /* Ensure proper text rendering */
          body {
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
        `
      }} />
    </div>
  );
}

export default App;
