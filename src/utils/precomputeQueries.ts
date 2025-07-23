/**
 * Predefined query sets for different domains and use cases
 */

export const MILITARY_QUERIES = [
  // Threat Assessment
  "Why is the aircraft deviating from its flight path?",
  "What factors make this flight pattern suspicious?",
  "How reliable is the current threat assessment?",
  "What is the confidence level of the threat analysis?",
  "Explain the significance of the speed increase",
  "Why is the communication silence concerning?",
  "What does the geographic approach vector indicate?",
  "How does the timing affect threat probability?",

  // Response Options
  "What are the available intercept options?",
  "What are the risks of immediate intercept?",
  "What happens if we delay the response?",
  "Compare the effectiveness of different response strategies",
  "What resources are required for each response option?",
  "How long do we have to make a decision?",
  "What are the consequences of no action?",
  "Which response option has the highest success rate?",

  // Operational Context
  "How does weather affect the current situation?",
  "What is the timeline for critical decision points?",
  "What are the alternative response scenarios?",
  "How do current conditions impact intercept success?",
  "What backup options are available if primary response fails?",
  "How does this situation compare to historical incidents?",
  "What intelligence supports the current assessment?",
  "What are the political implications of different responses?",

  // Technical Analysis
  "Explain the radar signature analysis",
  "What does the flight data recorder show?",
  "How accurate are the tracking systems?",
  "What communication protocols were attempted?",
  "Analyze the aircraft's performance characteristics",
  "What sensor data supports the threat assessment?",
  "How reliable are the identification systems?",
  "What electronic warfare considerations apply?"
];

export const GENERAL_ANALYSIS_QUERIES = [
  // Decision Making
  "What are the key factors in this decision?",
  "How confident should we be in this analysis?",
  "What information is missing from the assessment?",
  "What are the potential unintended consequences?",
  "How do we validate this recommendation?",
  "What assumptions underlie this analysis?",
  "What would change if conditions were different?",
  "How sensitive is the conclusion to input variations?",

  // Risk Assessment
  "What are the primary risks involved?",
  "How do we mitigate the identified risks?",
  "What is the probability of success?",
  "What contingency plans should be prepared?",
  "How do risks change over time?",
  "What early warning indicators should we monitor?",
  "What are the cascading effects of failure?",
  "How do we balance risk and opportunity?",

  // Strategic Planning
  "What are the long-term implications?",
  "How does this fit into the broader strategy?",
  "What resources will be required?",
  "What is the optimal timing for action?",
  "How do we measure success?",
  "What are the exit strategies?",
  "How do we adapt if conditions change?",
  "What stakeholder considerations apply?"
];

export const XAI_EXPLANATION_QUERIES = [
  // Model Understanding
  "Why did the model make this prediction?",
  "What features were most important in the decision?",
  "How reliable is this explanation?",
  "What would change the model's output?",
  "Which inputs have the strongest influence?",
  "How does the model handle uncertainty?",
  "What are the model's limitations?",
  "How was this model trained and validated?",

  // Feature Analysis
  "Explain the importance of each input variable",
  "Which features contribute positively vs negatively?",
  "How do feature interactions affect the outcome?",
  "What happens if we remove certain features?",
  "How sensitive is the model to feature changes?",
  "Which features are most predictive?",
  "How do missing values impact the prediction?",
  "What feature engineering was applied?",

  // Counterfactual Analysis
  "What would need to change for a different outcome?",
  "Show me alternative scenarios with different results",
  "What is the minimum change needed to flip the prediction?",
  "How robust is this prediction to input noise?",
  "What are the decision boundaries?",
  "How does this compare to similar cases?",
  "What if the most important feature was different?",
  "Generate alternative explanations for this result"
];

export const DOMAIN_SPECIFIC_QUERIES = {
  aviation: [
    "Analyze the flight trajectory anomalies",
    "What do the navigation system logs indicate?",
    "Explain the altitude and speed variations",
    "What weather factors affect flight safety?",
    "How do air traffic control procedures apply?",
    "What are the aircraft's technical specifications?",
    "Analyze the pilot's decision-making process",
    "What emergency procedures are relevant?"
  ],

  cybersecurity: [
    "What indicators suggest a security breach?",
    "Analyze the network traffic patterns",
    "What vulnerabilities were exploited?",
    "How did the attack vector operate?",
    "What data was potentially compromised?",
    "What containment measures are needed?",
    "How can we prevent similar attacks?",
    "What forensic evidence is available?"
  ],

  finance: [
    "What market factors influenced this outcome?",
    "Analyze the risk-return profile",
    "What regulatory considerations apply?",
    "How do economic indicators affect the analysis?",
    "What are the liquidity implications?",
    "Explain the valuation methodology",
    "What stress test scenarios are relevant?",
    "How does this compare to industry benchmarks?"
  ],

  healthcare: [
    "What clinical factors support this diagnosis?",
    "Analyze the patient's risk profile",
    "What treatment options are available?",
    "How do comorbidities affect the prognosis?",
    "What evidence supports this recommendation?",
    "What are the potential side effects?",
    "How should treatment be monitored?",
    "What patient education is needed?"
  ]
};

export const COMPLEXITY_LEVELS = {
  basic: [
    "What is the main conclusion?",
    "Why is this important?",
    "What should we do next?",
    "How confident are you?",
    "What are the key points?",
    "Is this normal or unusual?",
    "What does this mean?",
    "Should we be concerned?"
  ],

  intermediate: [
    "Explain the reasoning behind this analysis",
    "What factors contributed to this outcome?",
    "How do different variables interact?",
    "What are the trade-offs involved?",
    "How does this compare to alternatives?",
    "What assumptions were made?",
    "What additional data would be helpful?",
    "How might this change over time?"
  ],

  advanced: [
    "Provide a comprehensive causal analysis",
    "Explain the statistical significance of findings",
    "What are the methodological limitations?",
    "How do confounding variables affect results?",
    "Perform sensitivity analysis on key parameters",
    "What are the theoretical implications?",
    "How does this advance our understanding?",
    "What research questions emerge from this analysis?"
  ]
};

/**
 * Generate query sets based on domain and complexity
 */
export function generateQuerySet(
  domain: keyof typeof DOMAIN_SPECIFIC_QUERIES | 'military' | 'general' | 'xai',
  complexity: keyof typeof COMPLEXITY_LEVELS = 'intermediate',
  count: number = 10
): string[] {
  let baseQueries: string[] = [];

  switch (domain) {
    case 'military':
      baseQueries = MILITARY_QUERIES;
      break;
    case 'general':
      baseQueries = GENERAL_ANALYSIS_QUERIES;
      break;
    case 'xai':
      baseQueries = XAI_EXPLANATION_QUERIES;
      break;
    default:
      baseQueries = DOMAIN_SPECIFIC_QUERIES[domain] || GENERAL_ANALYSIS_QUERIES;
  }

  // Mix with complexity-appropriate queries
  const complexityQueries = COMPLEXITY_LEVELS[complexity];
  const mixedQueries = [...baseQueries, ...complexityQueries];

  // Shuffle and return requested count
  const shuffled = mixedQueries.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Get recommended queries for initial precompute
 */
export function getRecommendedQueries(): string[] {
  return [
    ...MILITARY_QUERIES.slice(0, 8),
    ...GENERAL_ANALYSIS_QUERIES.slice(0, 6),
    ...XAI_EXPLANATION_QUERIES.slice(0, 6)
  ];
}

/**
 * Get queries by category
 */
export function getQueriesByCategory(category: string): string[] {
  const categories: Record<string, string[]> = {
    'threat-assessment': MILITARY_QUERIES.slice(0, 8),
    'response-options': MILITARY_QUERIES.slice(8, 16),
    'operational-context': MILITARY_QUERIES.slice(16, 24),
    'technical-analysis': MILITARY_QUERIES.slice(24),
    'decision-making': GENERAL_ANALYSIS_QUERIES.slice(0, 8),
    'risk-assessment': GENERAL_ANALYSIS_QUERIES.slice(8, 16),
    'strategic-planning': GENERAL_ANALYSIS_QUERIES.slice(16),
    'model-understanding': XAI_EXPLANATION_QUERIES.slice(0, 8),
    'feature-analysis': XAI_EXPLANATION_QUERIES.slice(8, 16),
    'counterfactual': XAI_EXPLANATION_QUERIES.slice(16)
  };

  return categories[category] || [];
}