import { useState, useEffect } from 'react';
import { XAIExplanation, TabType, COAScenario } from '../types';
import { defaultScenario, xaiExplanation } from '../data/scenarios';

export const useXAI = (scenario: COAScenario = defaultScenario) => {
  const [currentExplanation, setCurrentExplanation] = useState<XAIExplanation>(xaiExplanation);
  const [activeTab, setActiveTab] = useState<TabType>('insight');
  const [confidence, setConfidence] = useState(85);
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([]);

  useEffect(() => {
    // Use the predefined XAI explanation
    setCurrentExplanation(xaiExplanation);
    setConfidence(xaiExplanation.confidence || 85);
    setSuggestedPrompts(xaiExplanation.suggestedPrompts || [
      "Why is the flight deviation significant?",
      "What makes this pattern suspicious?",
      "Explain the 15-minute timeline",
      "What are the intercept options?"
    ]);
  }, [scenario]);

  const updateExplanation = (explanation: XAIExplanation) => {
    setCurrentExplanation(explanation);
    setActiveTab(explanation.defaultTab || 'insight');
    setConfidence(explanation.confidence || 75);
    setSuggestedPrompts(
      explanation.suggestedPrompts && explanation.suggestedPrompts.length > 0
        ? explanation.suggestedPrompts
        : suggestedPrompts
    );
  };

  return {
    currentExplanation,
    activeTab,
    confidence,
    suggestedPrompts,
    setActiveTab,
    updateExplanation
  };
};
