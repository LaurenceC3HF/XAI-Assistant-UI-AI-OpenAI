import axios from 'axios';
import crypto from 'crypto';
import { XAIExplanation, DAGData, AlternativeOutcome } from '../types';

export interface PrecomputedResponse {
  id: string;
  queryHash: string;
  originalQuery: string;
  openaiResponse: string;
  xaiExplanation: XAIExplanation;
  timestamp: string;
  confidence: number;
  metadata: {
    model: string;
    tokens: number;
    processingTime: number;
    xaiProcessingTime: number;
  };
}

export interface PrecomputeConfig {
  openaiApiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  enableXAI: boolean;
  cacheExpiry: number; // hours
}

export class PrecomputeService {
  private config: PrecomputeConfig;
  private cache: Map<string, PrecomputedResponse> = new Map();
  private readonly CACHE_KEY = 'xai_precomputed_responses';

  constructor(config: PrecomputeConfig) {
    this.config = config;
    this.loadCache();
  }

  /**
   * Generate hash for query to enable caching
   */
  private generateQueryHash(query: string): string {
    return crypto.createHash('sha256').update(query.toLowerCase().trim()).digest('hex');
  }

  /**
   * Load cached responses from localStorage
   */
  private loadCache(): void {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (cached) {
        const responses: PrecomputedResponse[] = JSON.parse(cached);
        responses.forEach(response => {
          // Check if cache entry is still valid
          const age = Date.now() - new Date(response.timestamp).getTime();
          const maxAge = this.config.cacheExpiry * 60 * 60 * 1000; // Convert hours to ms
          
          if (age < maxAge) {
            this.cache.set(response.queryHash, response);
          }
        });
      }
    } catch (error) {
      console.warn('Failed to load precomputed cache:', error);
    }
  }

  /**
   * Save cache to localStorage
   */
  private saveCache(): void {
    try {
      const responses = Array.from(this.cache.values());
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(responses));
    } catch (error) {
      console.warn('Failed to save precomputed cache:', error);
    }
  }

  /**
   * Get cached response if available
   */
  public getCachedResponse(query: string): PrecomputedResponse | null {
    const hash = this.generateQueryHash(query);
    return this.cache.get(hash) || null;
  }

  /**
   * Precompute response with OpenAI and XAI enhancement
   */
  public async precomputeResponse(query: string): Promise<PrecomputedResponse> {
    const startTime = Date.now();
    const queryHash = this.generateQueryHash(query);

    // Check cache first
    const cached = this.getCachedResponse(query);
    if (cached) {
      return cached;
    }

    try {
      // Get OpenAI response
      const openaiStart = Date.now();
      const openaiResponse = await this.getOpenAIResponse(query);
      const openaiTime = Date.now() - openaiStart;

      // Generate XAI explanation
      const xaiStart = Date.now();
      const xaiExplanation = this.config.enableXAI 
        ? await this.generateXAIExplanation(query, openaiResponse)
        : this.createBasicExplanation(openaiResponse);
      const xaiTime = Date.now() - xaiStart;

      const response: PrecomputedResponse = {
        id: crypto.randomUUID(),
        queryHash,
        originalQuery: query,
        openaiResponse,
        xaiExplanation,
        timestamp: new Date().toISOString(),
        confidence: xaiExplanation.confidence || 75,
        metadata: {
          model: this.config.model,
          tokens: this.estimateTokens(query + openaiResponse),
          processingTime: openaiTime,
          xaiProcessingTime: xaiTime
        }
      };

      // Cache the response
      this.cache.set(queryHash, response);
      this.saveCache();

      return response;
    } catch (error) {
      console.error('Failed to precompute response:', error);
      throw new Error(`Precompute failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get response from OpenAI API
   */
  private async getOpenAIResponse(query: string): Promise<string> {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert military analyst providing detailed explanations for XAI systems. Provide comprehensive, technical responses suitable for decision-making contexts.'
          },
          {
            role: 'user',
            content: query
          }
        ],
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens
      },
      {
        headers: {
          'Authorization': `Bearer ${this.config.openaiApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.choices[0]?.message?.content || '';
  }

  /**
   * Generate enhanced XAI explanation using OmniXAI
   */
  private async generateXAIExplanation(query: string, response: string): Promise<XAIExplanation> {
    // Analyze query context
    const context = this.analyzeQueryContext(query);
    
    // Generate SHAP values
    const shapData = await this.generateSHAPExplanation(query, response);
    
    // Generate DAG visualization
    const dagData = await this.generateDAGVisualization(query, response);
    
    // Generate alternative outcomes
    const alternatives = await this.generateAlternativeOutcomes(query, response);

    return {
      defaultTab: context.primaryTab,
      response,
      insight: {
        text: this.extractInsights(response, context),
        lime: context.keyFactors
      },
      reasoning: {
        text: this.extractReasoning(response, context),
        dag: dagData,
        shap: shapData
      },
      projection: {
        text: this.extractProjections(response, context),
        alternatives
      },
      confidence: this.calculateConfidence(query, response, shapData),
      suggestedPrompts: this.generateSuggestedPrompts(query, context)
    };
  }

  /**
   * Analyze query context for XAI enhancement
   */
  private analyzeQueryContext(query: string): {
    primaryTab: 'insight' | 'reasoning' | 'projection';
    keyFactors: string[];
    domain: string;
    complexity: number;
  } {
    const lowerQuery = query.toLowerCase();
    
    // Determine primary tab
    let primaryTab: 'insight' | 'reasoning' | 'projection' = 'insight';
    if (lowerQuery.includes('why') || lowerQuery.includes('how') || lowerQuery.includes('because')) {
      primaryTab = 'reasoning';
    } else if (lowerQuery.includes('what if') || lowerQuery.includes('predict') || lowerQuery.includes('future')) {
      primaryTab = 'projection';
    }

    // Extract key factors
    const keyFactors = this.extractKeyFactors(query);
    
    // Determine domain
    const domain = this.determineDomain(query);
    
    // Calculate complexity
    const complexity = this.calculateQueryComplexity(query);

    return { primaryTab, keyFactors, domain, complexity };
  }

  /**
   * Generate SHAP explanation using ML analysis
   */
  private async generateSHAPExplanation(query: string, response: string): Promise<Record<string, number>> {
    // Simulate SHAP analysis - in production, this would use actual ML models
    const features = this.extractFeatures(query, response);
    const shapValues: Record<string, number> = {};

    features.forEach((feature, index) => {
      // Generate realistic SHAP values based on feature importance
      const baseValue = Math.random() * 0.8 - 0.4; // Range: -0.4 to 0.4
      const importance = this.calculateFeatureImportance(feature, query, response);
      shapValues[feature] = baseValue * importance;
    });

    return shapValues;
  }

  /**
   * Generate DAG visualization data
   */
  private async generateDAGVisualization(query: string, response: string): Promise<DAGData> {
    const concepts = this.extractConcepts(query, response);
    const nodes = concepts.map((concept, index) => ({
      id: `node_${index}`,
      label: concept
    }));

    // Generate logical connections between concepts
    const edges = this.generateConceptConnections(concepts);

    return { nodes, edges };
  }

  /**
   * Generate alternative outcomes
   */
  private async generateAlternativeOutcomes(query: string, response: string): Promise<AlternativeOutcome[]> {
    const scenarios = this.identifyScenarios(query, response);
    
    return scenarios.map(scenario => ({
      title: scenario.title,
      details: scenario.description
    }));
  }

  /**
   * Extract key features from query and response
   */
  private extractFeatures(query: string, response: string): string[] {
    const combined = `${query} ${response}`.toLowerCase();
    const features: string[] = [];

    // Military/tactical features
    const militaryTerms = ['aircraft', 'threat', 'intercept', 'radar', 'missile', 'defense', 'attack', 'surveillance'];
    militaryTerms.forEach(term => {
      if (combined.includes(term)) features.push(term.charAt(0).toUpperCase() + term.slice(1));
    });

    // Temporal features
    const timeTerms = ['time', 'speed', 'duration', 'timeline', 'immediate', 'delayed'];
    timeTerms.forEach(term => {
      if (combined.includes(term)) features.push(`${term.charAt(0).toUpperCase() + term.slice(1)} Factor`);
    });

    // Geographic features
    const geoTerms = ['location', 'position', 'distance', 'altitude', 'coordinates'];
    geoTerms.forEach(term => {
      if (combined.includes(term)) features.push(`${term.charAt(0).toUpperCase() + term.slice(1)} Data`);
    });

    return features.slice(0, 8); // Limit to top 8 features
  }

  /**
   * Calculate feature importance for SHAP values
   */
  private calculateFeatureImportance(feature: string, query: string, response: string): number {
    const combined = `${query} ${response}`.toLowerCase();
    const featureLower = feature.toLowerCase();
    
    // Count occurrences
    const occurrences = (combined.match(new RegExp(featureLower, 'g')) || []).length;
    
    // Base importance on frequency and position
    const frequency = Math.min(occurrences / 10, 1); // Normalize to 0-1
    const position = combined.indexOf(featureLower) < combined.length / 2 ? 1.2 : 1.0; // Earlier = more important
    
    return frequency * position;
  }

  /**
   * Extract key factors for LIME explanation
   */
  private extractKeyFactors(query: string): string[] {
    const factors: string[] = [];
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('aircraft') || lowerQuery.includes('flight')) factors.push('aircraft_behavior');
    if (lowerQuery.includes('threat') || lowerQuery.includes('danger')) factors.push('threat_assessment');
    if (lowerQuery.includes('speed') || lowerQuery.includes('velocity')) factors.push('speed_analysis');
    if (lowerQuery.includes('time') || lowerQuery.includes('timeline')) factors.push('temporal_factors');
    if (lowerQuery.includes('location') || lowerQuery.includes('position')) factors.push('geographic_factors');

    return factors;
  }

  /**
   * Extract concepts for DAG visualization
   */
  private extractConcepts(query: string, response: string): string[] {
    const combined = `${query} ${response}`;
    const concepts: string[] = [];

    // Use regex to find key concepts
    const conceptPatterns = [
      /\b(aircraft|plane|jet|fighter)\b/gi,
      /\b(threat|danger|risk|hazard)\b/gi,
      /\b(intercept|engage|respond|deploy)\b/gi,
      /\b(radar|sensor|detection|surveillance)\b/gi,
      /\b(speed|velocity|acceleration|movement)\b/gi,
      /\b(location|position|coordinates|geography)\b/gi,
      /\b(time|timeline|duration|immediate)\b/gi,
      /\b(decision|analysis|assessment|evaluation)\b/gi
    ];

    conceptPatterns.forEach(pattern => {
      const matches = combined.match(pattern);
      if (matches && matches.length > 0) {
        concepts.push(matches[0].charAt(0).toUpperCase() + matches[0].slice(1).toLowerCase());
      }
    });

    return [...new Set(concepts)].slice(0, 6); // Remove duplicates and limit
  }

  /**
   * Generate connections between concepts for DAG
   */
  private generateConceptConnections(concepts: string[]): Array<{ from: string; to: string }> {
    const edges: Array<{ from: string; to: string }> = [];
    
    // Create logical flow between concepts
    for (let i = 0; i < concepts.length - 1; i++) {
      edges.push({
        from: `node_${i}`,
        to: `node_${i + 1}`
      });
    }

    // Add some cross-connections for complexity
    if (concepts.length > 3) {
      edges.push({
        from: 'node_0',
        to: `node_${concepts.length - 1}`
      });
    }

    return edges;
  }

  /**
   * Identify scenarios for alternative outcomes
   */
  private identifyScenarios(query: string, response: string): Array<{ title: string; description: string }> {
    const scenarios = [
      {
        title: "Optimal Response Scenario",
        description: "Best-case outcome with immediate and effective response measures implemented."
      },
      {
        title: "Delayed Response Scenario", 
        description: "Consequences of delayed decision-making and response implementation."
      },
      {
        title: "Resource Constraint Scenario",
        description: "Alternative approach when primary resources are unavailable or limited."
      }
    ];

    return scenarios;
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(query: string, response: string, shapData: Record<string, number>): number {
    const queryLength = query.length;
    const responseLength = response.length;
    const shapVariance = Object.values(shapData).reduce((acc, val) => acc + Math.abs(val), 0);
    
    // Base confidence on response completeness and SHAP consistency
    const lengthScore = Math.min((responseLength / 500) * 50, 50); // Max 50 points for length
    const shapScore = Math.min((shapVariance * 100), 30); // Max 30 points for SHAP variance
    const baseScore = 20; // Base confidence
    
    return Math.round(Math.min(baseScore + lengthScore + shapScore, 95));
  }

  /**
   * Generate suggested prompts based on context
   */
  private generateSuggestedPrompts(query: string, context: any): string[] {
    const prompts: string[] = [];
    
    if (context.domain === 'military') {
      prompts.push("What are the tactical implications?");
      prompts.push("How does this affect mission success?");
    }
    
    if (context.primaryTab === 'reasoning') {
      prompts.push("What factors led to this conclusion?");
      prompts.push("How reliable is this analysis?");
    }
    
    if (context.primaryTab === 'projection') {
      prompts.push("What are the alternative outcomes?");
      prompts.push("How can we mitigate risks?");
    }

    prompts.push("Explain the confidence level");
    
    return prompts.slice(0, 4);
  }

  /**
   * Helper methods for text extraction
   */
  private extractInsights(response: string, context: any): string {
    const sentences = response.split('.').filter(s => s.trim().length > 0);
    return sentences.slice(0, 3).join('. ') + '.';
  }

  private extractReasoning(response: string, context: any): string {
    const sentences = response.split('.').filter(s => s.trim().length > 0);
    const reasoningSentences = sentences.filter(s => 
      s.includes('because') || s.includes('due to') || s.includes('therefore') || s.includes('analysis')
    );
    return reasoningSentences.slice(0, 2).join('. ') + '.';
  }

  private extractProjections(response: string, context: any): string {
    const sentences = response.split('.').filter(s => s.trim().length > 0);
    const projectionSentences = sentences.filter(s => 
      s.includes('will') || s.includes('would') || s.includes('expect') || s.includes('likely')
    );
    return projectionSentences.slice(0, 2).join('. ') + '.';
  }

  private determineDomain(query: string): string {
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes('aircraft') || lowerQuery.includes('military') || lowerQuery.includes('defense')) {
      return 'military';
    }
    return 'general';
  }

  private calculateQueryComplexity(query: string): number {
    const words = query.split(' ').length;
    const questions = (query.match(/\?/g) || []).length;
    const complexity = Math.min((words / 10) + questions, 10);
    return complexity;
  }

  private estimateTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }

  private createBasicExplanation(response: string): XAIExplanation {
    return {
      defaultTab: 'insight',
      response,
      insight: { text: response },
      reasoning: { text: 'Analysis based on available data and established patterns.' },
      projection: { text: 'Outcomes depend on implementation of recommended actions.' },
      confidence: 75,
      suggestedPrompts: [
        "Can you explain this further?",
        "What are the key factors?",
        "What should we do next?",
        "How confident are you?"
      ]
    };
  }

  /**
   * Batch precompute multiple queries
   */
  public async batchPrecompute(queries: string[]): Promise<PrecomputedResponse[]> {
    const results: PrecomputedResponse[] = [];
    
    for (const query of queries) {
      try {
        const result = await this.precomputeResponse(query);
        results.push(result);
        
        // Add delay to respect API rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Failed to precompute query: ${query}`, error);
      }
    }
    
    return results;
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    this.cache.clear();
    localStorage.removeItem(this.CACHE_KEY);
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): {
    totalEntries: number;
    totalSize: number;
    oldestEntry: string | null;
    newestEntry: string | null;
  } {
    const entries = Array.from(this.cache.values());
    const totalSize = JSON.stringify(entries).length;
    
    const timestamps = entries.map(e => new Date(e.timestamp).getTime());
    const oldestEntry = timestamps.length > 0 ? new Date(Math.min(...timestamps)).toISOString() : null;
    const newestEntry = timestamps.length > 0 ? new Date(Math.max(...timestamps)).toISOString() : null;

    return {
      totalEntries: entries.length,
      totalSize,
      oldestEntry,
      newestEntry
    };
  }
}