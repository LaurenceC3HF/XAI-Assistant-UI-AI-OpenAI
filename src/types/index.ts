export interface COAScenario {
  name: string;
  situation: string;
  coursesOfAction: CourseOfAction[];
}

export interface CourseOfAction {
  id: string;
  name: string;
  summary: string;
  risk: string;
  reward: string;
  recommendationScore: number;
}

export interface ScenarioPhase {
  phase: string;
  actions: string[];
}

export interface ChatMessage {
  timestamp: string;
  type: 'user_query' | 'ai_response';
  details: {
    query?: string;
    question?: string;
    response?: XAIExplanation;
  };
}

export interface XAIExplanation {
  defaultTab?: 'insight' | 'reasoning' | 'projection';
  response: string;
  insight: {
    text: string;
    lime?: string[];
  };
  reasoning: {
    text: string;
    dag?: DAGData;
    shap?: Record<string, number>;
  };
  projection: {
    text: string;
    alternatives?: AlternativeOutcome[];
  };
  confidence?: number;
  suggestedPrompts?: string[];
}

export interface DAGData {
  nodes: Array<{ id: string; label: string }>;
  edges: Array<{ from: string; to: string }>;
}

export interface AlternativeOutcome {
  title: string;
  details: string;
}

export type TabType = 'insight' | 'reasoning' | 'projection';

// User Interaction Logging Types
export interface UserInteraction {
  id: string;
  sessionId: string;
  timestamp: string;
  type: InteractionType;
  data: InteractionData;
  context: InteractionContext;
}

export type InteractionType = 
  | 'tab_switch'
  | 'chat_message'
  | 'suggested_prompt_click'
  | 'history_click'
  | 'visualization_hover'
  | 'visualization_click'
  | 'coa_card_hover'
  | 'coa_card_click'
  | 'error_occurrence'
  | 'session_start'
  | 'session_end'
  | 'page_focus'
  | 'page_blur'
  | 'scroll_event';

export interface InteractionData {
  // Tab switching
  fromTab?: TabType;
  toTab?: TabType;
  
  // Chat interactions
  message?: string;
  messageLength?: number;
  responseTime?: number;
  suggestedPrompt?: string;
  
  // Visualization interactions
  visualizationType?: string;
  elementId?: string;
  hoverDuration?: number;
  
  // COA interactions
  coaId?: string;
  coaName?: string;
  
  // Error data
  errorMessage?: string;
  errorType?: string;
  
  // Scroll data
  scrollPosition?: number;
  scrollDirection?: 'up' | 'down';
  
  // Generic data
  value?: any;
  metadata?: Record<string, any>;
}

export interface InteractionContext {
  currentTab: TabType;
  chatHistoryLength: number;
  sessionDuration: number;
  currentExplanation?: string;
  userAgent: string;
  screenResolution: string;
  timestamp: string;
}

export interface UserSession {
  sessionId: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  interactions: UserInteraction[];
  userAgent: string;
  screenResolution: string;
  totalTabSwitches: number;
  totalChatMessages: number;
  totalSuggestedPromptClicks: number;
  mostUsedTab: TabType;
  averageResponseTime: number;
}

export interface InteractionAnalytics {
  totalSessions: number;
  totalInteractions: number;
  averageSessionDuration: number;
  mostCommonInteractionType: InteractionType;
  tabUsageDistribution: Record<TabType, number>;
  chatEngagementMetrics: {
    averageMessagesPerSession: number;
    averageMessageLength: number;
    suggestedPromptUsageRate: number;
  };
  visualizationEngagement: {
    mostHoveredElements: Array<{ element: string; count: number }>;
    mostClickedElements: Array<{ element: string; count: number }>;
  };
  errorAnalytics: {
    totalErrors: number;
    errorTypes: Record<string, number>;
  };
}
