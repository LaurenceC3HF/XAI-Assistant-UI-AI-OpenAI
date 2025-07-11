import { TabType } from '../types';

interface QueryPattern {
  keywords: string[];
  tab: TabType;
  priority: number;
}

// Define query patterns that map to specific tabs
const queryPatterns: QueryPattern[] = [
  // PROJECTION patterns (what if, future, timeline, outcomes)
  {
    keywords: ['what if', 'what happens if', 'if we', 'outcome', 'result', 'consequence', 'future', 'timeline', 'projection', 'predict', 'forecast', 'scenario'],
    tab: 'projection',
    priority: 3
  },
  
  // REASONING patterns (why, how, because, analysis, logic)
  {
    keywords: ['why', 'how', 'because', 'reason', 'logic', 'analysis', 'explain', 'correlation', 'pattern', 'suspicious', 'decision', 'algorithm', 'model'],
    tab: 'reasoning',
    priority: 2
  },
  
  // INSIGHT patterns (what, facts, data, observations)
  {
    keywords: ['what', 'facts', 'data', 'observation', 'detect', 'notice', 'see', 'identify', 'deviation', 'change', 'status', 'current', 'now'],
    tab: 'insight',
    priority: 1
  }
];

export const analyzeQueryForTab = (query: string): TabType => {
  const lowerQuery = query.toLowerCase();
  let bestMatch: { tab: TabType; score: number } = { tab: 'insight', score: 0 };
  
  for (const pattern of queryPatterns) {
    let score = 0;
    
    // Check for keyword matches
    for (const keyword of pattern.keywords) {
      if (lowerQuery.includes(keyword)) {
        // Give higher score for exact matches and longer keywords
        score += keyword.length * pattern.priority;
        
        // Bonus for keywords at the beginning of the query
        if (lowerQuery.startsWith(keyword)) {
          score += 10;
        }
      }
    }
    
    // Update best match if this pattern scores higher
    if (score > bestMatch.score) {
      bestMatch = { tab: pattern.tab, score };
    }
  }
  
  return bestMatch.tab;
};

// Enhanced query matching for more specific responses
export const getQueryContext = (query: string): string => {
  const lowerQuery = query.toLowerCase();
  
  // Specific context patterns
  const contexts = [
    { pattern: ['deviation', 'flight path', 'course'], context: 'flight_deviation' },
    { pattern: ['speed', 'velocity', 'acceleration'], context: 'speed_analysis' },
    { pattern: ['suspicious', 'threat', 'pattern', 'behavior'], context: 'threat_pattern' },
    { pattern: ['timeline', 'time', 'minutes', 'when'], context: 'timeline' },
    { pattern: ['intercept', 'fighter', 'cf-18', 'aircraft'], context: 'intercept_options' },
    { pattern: ['target', 'infrastructure', 'asset'], context: 'target_analysis' },
    { pattern: ['communication', 'atc', 'radio', 'contact'], context: 'communication' },
    { pattern: ['risk', 'danger', 'threat level'], context: 'risk_assessment' }
    { pattern: ['weather', 'temperature', 'forecast', 'rain', 'sunny', 'wind', 'climate'], context: 'weather' }
  ];
  
  for (const { pattern, context } of contexts) {
    if (pattern.some(keyword => lowerQuery.includes(keyword))) {
      return context;
    }
  }
  
  return 'general';
};
