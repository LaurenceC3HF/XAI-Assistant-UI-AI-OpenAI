import React, { useState } from 'react';
import { ChatMessage, XAIExplanation } from '../types';
import { Send, MessageSquare, AlertCircle, User, Bot, Clock, Info } from 'lucide-react';

// Tab indicator mapping (colors match previous chip scheme)
const TAB_DOT = {
  insight: { color: "bg-blue-500", label: "Insight" },
  reasoning: { color: "bg-yellow-400", label: "Reasoning" },
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
    <div className="w-1/3 flex flex-col border-l border-slate-700/50 bg-slate-900/80 backdrop-blur-sm font-mono">
      {/* Header */}
      <header className="p-4 border-b border-slate-700/50 flex-shrink-0">
        <div className="flex items-center justify-center space-x-3">
          <MessageSquare className="w-6 h-6 text-blue-400" />
          <h1 className="text-xl font-bold text-white">XAI Assistant</h1>
        </div>
        {error && (
          <div className="mt-3 p-3 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center">
            <AlertCircle className="w-4 h-4 text-red-400 mr-2 flex-shrink-0" />
            <span className="text-red-300 text-sm">{error}</span>
            <button 
              onClick={onClearError}
              className="ml-auto text-red-400 hover:text-red-300"
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
                  p-4
                  ${isUser
                    ? 'bg-gray-700 text-white ml-4'
                    : 'bg-[#1e1e1e] text-gray-100 mr-4'
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
                        <Bot className="w-4 h-4 text-blue-400" />
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
                <Bot className="w-4 h-4 text-blue-400" />
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
                <span className="text-sm text-gray-300">AI is analyzing...</span>
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
                  className="px-3 py-1 bg-slate-700/50 hover:bg-slate-600/50 text-xs text-gray-300 hover:text-white rounded-full transition-all duration-200 border border-slate-600/50 hover:border-slate-500/50"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Input */}
        <div className="flex items-end space-x-2">
          <div className="flex-1 bg-[#1e1e1e] border border-slate-700 focus-within:border-blue-500 transition-colors">
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
            className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white p-3 rounded-lg transition-all duration-200 hover:scale-105 disabled:hover:scale-100"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </footer>
    </div>
  );
};
