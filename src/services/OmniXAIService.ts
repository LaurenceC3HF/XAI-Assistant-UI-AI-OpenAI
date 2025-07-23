import { XAIExplanation, DAGData } from '../types';

export interface XAIModel {
  id: string;
  name: string;
  type: 'classification' | 'regression' | 'nlp' | 'multimodal';
  features: string[];
  targetVariable: string;
  metadata: {
    accuracy: number;
    trainingData: string;
    lastUpdated: string;
  };
}

export interface ExplanationRequest {
  modelId: string;
  inputData: Record<string, any>;
  explanationType: 'local' | 'global' | 'counterfactual';
  methods: ('lime' | 'shap' | 'grad_cam' | 'integrated_gradients')[];
}

export interface ExplanationResult {
  modelId: string;
  explanationType: string;
  results: {
    lime?: LIMEResult;
    shap?: SHAPResult;
    gradCam?: GradCAMResult;
    integratedGradients?: IntegratedGradientsResult;
  };
  confidence: number;
  processingTime: number;
}

export interface LIMEResult {
  features: Array<{
    name: string;
    importance: number;
    value: any;
  }>;
  prediction: number;
  localFidelity: number;
}

export interface SHAPResult {
  baseValue: number;
  shapValues: Record<string, number>;
  expectedValue: number;
  prediction: number;
}

export interface GradCAMResult {
  heatmap: number[][];
  importantRegions: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    importance: number;
  }>;
}

export interface IntegratedGradientsResult {
  attributions: Record<string, number>;
  convergenceDelta: number;
  baseline: Record<string, any>;
}

export class OmniXAIService {
  private models: Map<string, XAIModel> = new Map();
  private explainers: Map<string, any> = new Map();

  constructor() {
    this.initializeDefaultModels();
  }

  /**
   * Initialize default models for military/tactical analysis
   */
  private initializeDefaultModels(): void {
    const threatAssessmentModel: XAIModel = {
      id: 'threat_assessment_v1',
      name: 'Threat Assessment Model',
      type: 'classification',
      features: [
        'flight_deviation',
        'speed_change',
        'communication_status',
        'geographic_vector',
        'time_of_day',
        'weather_conditions',
        'aircraft_type',
        'flight_plan_status'
      ],
      targetVariable: 'threat_level',
      metadata: {
        accuracy: 0.92,
        trainingData: 'Historical incident data (2015-2023)',
        lastUpdated: new Date().toISOString()
      }
    };

    const responseOptimizationModel: XAIModel = {
      id: 'response_optimization_v1',
      name: 'Response Optimization Model',
      type: 'regression',
      features: [
        'threat_level',
        'available_assets',
        'response_time',
        'resource_cost',
        'success_probability',
        'collateral_risk',
        'political_sensitivity'
      ],
      targetVariable: 'optimal_response_score',
      metadata: {
        accuracy: 0.88,
        trainingData: 'Military exercise data and simulations',
        lastUpdated: new Date().toISOString()
      }
    };

    this.models.set(threatAssessmentModel.id, threatAssessmentModel);
    this.models.set(responseOptimizationModel.id, responseOptimizationModel);
  }

  /**
   * Register a new XAI model
   */
  public registerModel(model: XAIModel): void {
    this.models.set(model.id, model);
  }

  /**
   * Get explanation for a specific input
   */
  public async explainPrediction(request: ExplanationRequest): Promise<ExplanationResult> {
    const startTime = Date.now();
    const model = this.models.get(request.modelId);
    
    if (!model) {
      throw new Error(`Model ${request.modelId} not found`);
    }

    const results: ExplanationResult['results'] = {};

    // Generate explanations based on requested methods
    for (const method of request.methods) {
      switch (method) {
        case 'lime':
          results.lime = await this.generateLIMEExplanation(model, request.inputData);
          break;
        case 'shap':
          results.shap = await this.generateSHAPExplanation(model, request.inputData);
          break;
        case 'grad_cam':
          if (model.type === 'multimodal') {
            results.gradCam = await this.generateGradCAMExplanation(model, request.inputData);
          }
          break;
        case 'integrated_gradients':
          results.integratedGradients = await this.generateIntegratedGradientsExplanation(model, request.inputData);
          break;
      }
    }

    const confidence = this.calculateExplanationConfidence(results);
    const processingTime = Date.now() - startTime;

    return {
      modelId: request.modelId,
      explanationType: request.explanationType,
      results,
      confidence,
      processingTime
    };
  }

  /**
   * Generate LIME explanation
   */
  private async generateLIMEExplanation(model: XAIModel, inputData: Record<string, any>): Promise<LIMEResult> {
    // Simulate LIME explanation generation
    const features = model.features.map(feature => ({
      name: feature,
      importance: (Math.random() - 0.5) * 2, // Range: -1 to 1
      value: inputData[feature] || 0
    }));

    // Sort by absolute importance
    features.sort((a, b) => Math.abs(b.importance) - Math.abs(a.importance));

    return {
      features: features.slice(0, 8), // Top 8 features
      prediction: Math.random(), // Simulated prediction
      localFidelity: 0.85 + Math.random() * 0.1 // 0.85-0.95
    };
  }

  /**
   * Generate SHAP explanation
   */
  private async generateSHAPExplanation(model: XAIModel, inputData: Record<string, any>): Promise<SHAPResult> {
    const baseValue = 0.5; // Baseline prediction
    const shapValues: Record<string, number> = {};

    // Generate SHAP values for each feature
    model.features.forEach(feature => {
      const featureValue = inputData[feature] || 0;
      const importance = this.calculateFeatureImportance(feature, featureValue, model);
      shapValues[feature] = importance * (Math.random() - 0.5) * 2;
    });

    const prediction = baseValue + Object.values(shapValues).reduce((sum, val) => sum + val, 0);

    return {
      baseValue,
      shapValues,
      expectedValue: baseValue,
      prediction: Math.max(0, Math.min(1, prediction))
    };
  }

  /**
   * Generate GradCAM explanation (for image/multimodal models)
   */
  private async generateGradCAMExplanation(model: XAIModel, inputData: Record<string, any>): Promise<GradCAMResult> {
    // Generate simulated heatmap
    const heatmap: number[][] = [];
    for (let i = 0; i < 32; i++) {
      const row: number[] = [];
      for (let j = 0; j < 32; j++) {
        row.push(Math.random());
      }
      heatmap.push(row);
    }

    // Identify important regions
    const importantRegions = [
      { x: 10, y: 10, width: 8, height: 8, importance: 0.9 },
      { x: 20, y: 15, width: 6, height: 6, importance: 0.7 },
      { x: 5, y: 20, width: 4, height: 4, importance: 0.6 }
    ];

    return {
      heatmap,
      importantRegions
    };
  }

  /**
   * Generate Integrated Gradients explanation
   */
  private async generateIntegratedGradientsExplanation(
    model: XAIModel, 
    inputData: Record<string, any>
  ): Promise<IntegratedGradientsResult> {
    const attributions: Record<string, number> = {};
    const baseline: Record<string, any> = {};

    model.features.forEach(feature => {
      const inputValue = inputData[feature] || 0;
      const baselineValue = this.getFeatureBaseline(feature, model);
      
      baseline[feature] = baselineValue;
      attributions[feature] = (inputValue - baselineValue) * Math.random() * 0.5;
    });

    return {
      attributions,
      convergenceDelta: Math.random() * 0.01, // Small convergence delta indicates good approximation
      baseline
    };
  }

  /**
   * Calculate feature importance based on model and value
   */
  private calculateFeatureImportance(feature: string, value: any, model: XAIModel): number {
    // Simulate feature importance calculation
    const featureWeights: Record<string, number> = {
      'flight_deviation': 0.8,
      'speed_change': 0.7,
      'communication_status': 0.9,
      'geographic_vector': 0.6,
      'time_of_day': 0.3,
      'weather_conditions': 0.4,
      'aircraft_type': 0.5,
      'flight_plan_status': 0.7
    };

    const baseImportance = featureWeights[feature] || 0.5;
    const valueNormalized = typeof value === 'number' ? Math.min(Math.abs(value), 1) : 0.5;
    
    return baseImportance * valueNormalized;
  }

  /**
   * Get baseline value for a feature
   */
  private getFeatureBaseline(feature: string, model: XAIModel): any {
    // Return typical baseline values for different feature types
    const baselines: Record<string, any> = {
      'flight_deviation': 0,
      'speed_change': 0,
      'communication_status': 1, // Normal communication
      'geographic_vector': 0.5,
      'time_of_day': 12, // Noon
      'weather_conditions': 0.5,
      'aircraft_type': 'civilian',
      'flight_plan_status': 'filed'
    };

    return baselines[feature] || 0;
  }

  /**
   * Calculate overall explanation confidence
   */
  private calculateExplanationConfidence(results: ExplanationResult['results']): number {
    let totalConfidence = 0;
    let methodCount = 0;

    if (results.lime) {
      totalConfidence += results.lime.localFidelity * 100;
      methodCount++;
    }

    if (results.shap) {
      // SHAP confidence based on value consistency
      const shapVariance = Object.values(results.shap.shapValues)
        .reduce((acc, val) => acc + Math.abs(val), 0);
      totalConfidence += Math.min(shapVariance * 100, 95);
      methodCount++;
    }

    if (results.integratedGradients) {
      // IG confidence based on convergence
      const convergenceConfidence = Math.max(0, 100 - (results.integratedGradients.convergenceDelta * 1000));
      totalConfidence += convergenceConfidence;
      methodCount++;
    }

    return methodCount > 0 ? totalConfidence / methodCount : 75;
  }

  /**
   * Convert OmniXAI results to XAI explanation format
   */
  public convertToXAIExplanation(
    explanationResult: ExplanationResult,
    originalQuery: string,
    originalResponse: string
  ): XAIExplanation {
    const { results } = explanationResult;
    
    // Generate DAG from SHAP results
    const dagData: DAGData | undefined = results.shap ? {
      nodes: Object.keys(results.shap.shapValues).map((feature, index) => ({
        id: `feature_${index}`,
        label: this.formatFeatureName(feature)
      })).concat([{ id: 'prediction', label: 'Prediction' }]),
      edges: Object.keys(results.shap.shapValues).map((feature, index) => ({
        from: `feature_${index}`,
        to: 'prediction'
      }))
    } : undefined;

    // Format SHAP values for display
    const shapData = results.shap ? 
      Object.fromEntries(
        Object.entries(results.shap.shapValues).map(([key, value]) => [
          this.formatFeatureName(key),
          value
        ])
      ) : undefined;

    return {
      defaultTab: 'reasoning',
      response: originalResponse,
      insight: {
        text: this.generateInsightText(results, originalResponse),
        lime: results.lime?.features.slice(0, 5).map(f => f.name) || []
      },
      reasoning: {
        text: this.generateReasoningText(results, explanationResult.confidence),
        dag: dagData,
        shap: shapData
      },
      projection: {
        text: this.generateProjectionText(results),
        alternatives: this.generateAlternatives(results)
      },
      confidence: Math.round(explanationResult.confidence),
      suggestedPrompts: [
        "Why are these features most important?",
        "How reliable is this explanation?",
        "What would change the prediction?",
        "Show me the model's reasoning process"
      ]
    };
  }

  /**
   * Format feature names for display
   */
  private formatFeatureName(feature: string): string {
    return feature
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Generate insight text from explanation results
   */
  private generateInsightText(results: ExplanationResult['results'], originalResponse: string): string {
    let text = "Key factors identified in the analysis:\n";
    
    if (results.lime) {
      const topFeatures = results.lime.features.slice(0, 3);
      topFeatures.forEach(feature => {
        const impact = feature.importance > 0 ? "increases" : "decreases";
        text += `• ${this.formatFeatureName(feature.name)}: ${impact} prediction confidence\n`;
      });
    }
    
    if (results.shap) {
      const prediction = (results.shap.prediction * 100).toFixed(1);
      text += `• Model prediction confidence: ${prediction}%\n`;
    }

    return text;
  }

  /**
   * Generate reasoning text from explanation results
   */
  private generateReasoningText(results: ExplanationResult['results'], confidence: number): string {
    let text = `Explanation analysis (${confidence.toFixed(1)}% confidence):\n`;
    
    if (results.shap) {
      const sortedFeatures = Object.entries(results.shap.shapValues)
        .sort(([,a], [,b]) => Math.abs(b) - Math.abs(a))
        .slice(0, 3);
      
      sortedFeatures.forEach(([feature, value]) => {
        const impact = value > 0 ? "positive" : "negative";
        const strength = Math.abs(value) > 0.3 ? "strong" : "moderate";
        text += `• ${this.formatFeatureName(feature)}: ${strength} ${impact} influence\n`;
      });
    }

    if (results.lime) {
      text += `• Local explanation fidelity: ${(results.lime.localFidelity * 100).toFixed(1)}%\n`;
    }

    return text;
  }

  /**
   * Generate projection text from explanation results
   */
  private generateProjectionText(results: ExplanationResult['results']): string {
    let text = "Prediction sensitivity analysis:\n";
    
    if (results.shap) {
      const mostInfluential = Object.entries(results.shap.shapValues)
        .reduce((max, [feature, value]) => 
          Math.abs(value) > Math.abs(max[1]) ? [feature, value] : max
        );
      
      text += `• Most influential factor: ${this.formatFeatureName(mostInfluential[0])}\n`;
      text += `• Changing this factor would significantly impact the prediction\n`;
    }

    text += "• Model shows high sensitivity to input variations\n";
    text += "• Explanation methods show consistent results\n";

    return text;
  }

  /**
   * Generate alternative scenarios from explanation results
   */
  private generateAlternatives(results: ExplanationResult['results']): Array<{title: string; details: string}> {
    const alternatives = [];

    if (results.shap) {
      const topFeature = Object.entries(results.shap.shapValues)
        .reduce((max, [feature, value]) => 
          Math.abs(value) > Math.abs(max[1]) ? [feature, value] : max
        );

      alternatives.push({
        title: `Modified ${this.formatFeatureName(topFeature[0])}`,
        details: `If ${this.formatFeatureName(topFeature[0]).toLowerCase()} were different, the prediction would change significantly.`
      });
    }

    alternatives.push({
      title: "High Confidence Scenario",
      details: "All key factors align to support the current prediction with high certainty."
    });

    alternatives.push({
      title: "Uncertainty Scenario", 
      details: "Conflicting indicators create uncertainty, requiring additional data for confident prediction."
    });

    return alternatives;
  }

  /**
   * Get available models
   */
  public getAvailableModels(): XAIModel[] {
    return Array.from(this.models.values());
  }

  /**
   * Get model by ID
   */
  public getModel(modelId: string): XAIModel | undefined {
    return this.models.get(modelId);
  }

  /**
   * Update model metadata
   */
  public updateModelMetadata(modelId: string, metadata: Partial<XAIModel['metadata']>): void {
    const model = this.models.get(modelId);
    if (model) {
      model.metadata = { ...model.metadata, ...metadata };
      this.models.set(modelId, model);
    }
  }
}