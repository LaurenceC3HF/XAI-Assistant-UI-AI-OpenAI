import React, { useState } from 'react';
import { ChatMessage, XAIExplanation } from '../types';
import { Send, MessageSquare, AlertCircle, User, Bot, Clock, Info } from 'lucide-react';

// Tab indicator mapping (colors match previous chip scheme)
const TAB_DOT = {
  insight: { color: "bg-intel-cyan", label: "Insight" },
  reasoning: { color: "bg-intel-yellow", label: "Reasoning" },
  projection: { color: "bg-purple-500", label: "Projection" }
};

interface ChatPanelProps {
  chatHistory: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  suggestedPrompts: string[];
  onSendMessage: (message: string) => Promise<XAIExplanation | null>;
  onHistoryClick: (item: ChatMessage) => void;
  onClearError: () => void;
  chatContainerRef: React.RefObject<HTMLDivElement>;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  chatHistory,
  isLoading,
  error,
  suggestedPrompts,
  onSendMessage,
  onHistoryClick,
  onClearError,
  chatContainerRef
}) => {
  const [userInput, setUserInput] = useState('');

  const handleSend = async () => {
    if (!userInput.trim() || isLoading) return;
    
    const response = await onSendMessage(userInput);
    setUserInput('');
    
    if (response && onHistoryClick) {
      // Simulate clicking on the latest AI response
      const latestMessage = {
        timestamp: new Date().toISOString(),
        type: 'ai_response' as const,
        details: { response }
      };
      onHistoryClick(latestMessage);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="w-1/3 flex flex-col border-l border-intel-gray bg-intel-black/80 backdrop-blur-sm">
      {/* Header */}
      <header className="p-4 border-b border-intel-gray flex-shrink-0">
        <div className="flex items-center justify-center space-x-3">
          <MessageSquare className="w-6 h-6 text-intel-cyan" />
          <h1 className="text-xl font-bold text-intel-cyan">XAI Assistant</h1>
        </div>
        {error && (
          <div className="mt-3 p-3 bg-intel-red/20 border border-intel-red/50 rounded-lg flex items-center">
            <AlertCircle className="w-4 h-4 text-intel-red mr-2 flex-shrink-0" />
            <span className="text-intel-red text-sm">{error}</span>
            <button
              onClick={onClearError}
              className="ml-auto text-intel-red hover:text-intel-red/80"
            >
              ×
            </button>
          </div>
        )}
      </header>
      
      {/* Chat History */}
      <main 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent"
      >
        {chatHistory.map((item, index) => {
          const isUser = item.type === 'user_query';
          const content = isUser 
            ? item.details.query 
            : item.details.response?.response;

          // Get defaultTab for AI responses
          let defaultTab, dotInfo;
          if (!isUser && item.details.response) {
            defaultTab = item.details.response.defaultTab || "insight";
            dotInfo = TAB_DOT[defaultTab];
          }
          
          return (
            <div key={index} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div
                onClick={() => !isUser && onHistoryClick(item)}
                className={`
                  max-w-[85%] group transition-all duration-200
                  ${!isUser ? 'cursor-pointer hover:scale-105' : ''}
                  relative
                `}
              >
                <div className={`
                  p-4 rounded-lg shadow-lg
                  ${isUser 
                    ? 'bg-intel-cyan text-intel-black ml-4'
                    : 'bg-slate-700/80 hover:bg-slate-700 text-gray-100 mr-4'
                  }
                `}>
                  <div className={`flex items-center text-xs text-gray-400 ${isUser ? 'justify-end mb-2' : 'mb-2'}`}>
                    <Clock className="w-3 h-3 mr-1" />
                    {formatTime(item.timestamp)}
                  </div>
                  {/* Small tab dot indicator for AI responses */}
                  {!isUser && dotInfo && (
                    <span
                      className={`absolute top-2 right-2 flex items-center group`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${dotInfo.color} border border-white/60 shadow`}
                        title={dotInfo.label}
                      />
                      <span className="absolute top-4 right-0 opacity-0 group-hover:opacity-100 bg-slate-900 text-xs text-white rounded px-2 py-1 pointer-events-none z-10 transition-opacity duration-150 shadow-lg whitespace-nowrap">
                        {dotInfo.label}
                      </span>
                    </span>
                  )}
                  <div className="flex items-start space-x-2">
                    <div className="flex-shrink-0 mt-1">
                      {isUser ? (
                        <User className="w-4 h-4" />
                      ) : (
                        <Bot className="w-4 h-4 text-intel-cyan" />
                      )}
                    </div>
                    <p className="text-sm leading-relaxed flex-1">
                      {content || 'Processing...'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-[#1e1e1e] p-4 mr-4 max-w-[85%]">
              <div className="flex items-center space-x-2">
                <Bot className="w-4 h-4 text-intel-cyan" />
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-intel-cyan rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-intel-cyan rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-intel-cyan rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
                <span className="text-sm text-gray-200">AI is analyzing...</span>
              </div>
            </div>
          </div>
        )}
      </main>
      
      {/* Input Area */}
      <footer className="flex-shrink-0 p-4 border-t border-slate-700/50 space-y-4">
        {/* Suggested Prompts */}
        {suggestedPrompts.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-gray-400 font-medium">Suggested questions:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedPrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => setUserInput(prompt)}
                  disabled={isLoading}
                  className="px-3 py-1 bg-slate-700/50 hover:bg-slate-600/50 text-xs text-gray-200 hover:text-white rounded-full transition-all duration-200 border border-slate-600/50 hover:border-slate-500/50"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Input */}
        <div className="flex items-end space-x-2">
          <div className="flex-1 bg-slate-800/50 border border-slate-600/50 rounded-lg focus-within:border-intel-cyan/50 transition-colors">
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              rows={3}
              className="w-full bg-transparent text-white placeholder-gray-400 p-3 focus:outline-none resize-none scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent font-mono"
              placeholder="Ask about the analysis..."
            />
          </div>
          <button
            onClick={handleSend}
            disabled={isLoading || !userInput.trim()}
            className="flex-shrink-0 bg-intel-cyan hover:bg-intel-cyan/80 disabled:bg-intel-gray disabled:cursor-not-allowed text-intel-black p-3 rounded-lg transition-all duration-200 hover:scale-105 disabled:hover:scale-100"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </footer>
    </div>
  );
};
