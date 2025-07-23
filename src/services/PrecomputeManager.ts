import { PrecomputeService, PrecomputeConfig, PrecomputedResponse } from './PrecomputeService';
import { OmniXAIService, ExplanationRequest } from './OmniXAIService';
import { XAIExplanation } from '../types';

export interface PrecomputeJob {
  id: string;
  queries: string[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  startTime: string;
  endTime?: string;
  results: PrecomputedResponse[];
  errors: string[];
}

export interface BatchPrecomputeOptions {
  batchSize: number;
  delayBetweenBatches: number; // milliseconds
  enableXAI: boolean;
  retryFailedQueries: boolean;
  maxRetries: number;
}

export class PrecomputeManager {
  private precomputeService: PrecomputeService;
  private omniXAIService: OmniXAIService;
  private jobs: Map<string, PrecomputeJob> = new Map();
  private isProcessing: boolean = false;

  constructor(config: PrecomputeConfig) {
    this.precomputeService = new PrecomputeService(config);
    this.omniXAIService = new OmniXAIService();
  }

  /**
   * Create a new precompute job
   */
  public createJob(queries: string[]): PrecomputeJob {
    const job: PrecomputeJob = {
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      queries: [...queries], // Create copy
      status: 'pending',
      progress: 0,
      startTime: new Date().toISOString(),
      results: [],
      errors: []
    };

    this.jobs.set(job.id, job);
    return job;
  }

  /**
   * Execute a precompute job
   */
  public async executeJob(
    jobId: string, 
    options: BatchPrecomputeOptions = {
      batchSize: 5,
      delayBetweenBatches: 2000,
      enableXAI: true,
      retryFailedQueries: true,
      maxRetries: 3
    }
  ): Promise<PrecomputeJob> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    if (this.isProcessing) {
      throw new Error('Another job is currently processing');
    }

    this.isProcessing = true;
    job.status = 'running';
    job.startTime = new Date().toISOString();

    try {
      const batches = this.createBatches(job.queries, options.batchSize);
      let processedCount = 0;

      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        
        // Process batch in parallel
        const batchPromises = batch.map(async (query, queryIndex) => {
          const globalIndex = batchIndex * options.batchSize + queryIndex;
          return this.processQuery(query, globalIndex, job, options);
        });

        const batchResults = await Promise.allSettled(batchPromises);
        
        // Update progress
        processedCount += batch.length;
        job.progress = (processedCount / job.queries.length) * 100;
        
        // Update job with results
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value) {
            job.results.push(result.value);
          } else if (result.status === 'rejected') {
            const query = batch[index];
            job.errors.push(`Query "${query}": ${result.reason}`);
          }
        });

        // Delay between batches (except for the last batch)
        if (batchIndex < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, options.delayBetweenBatches));
        }
      }

      // Handle retries for failed queries
      if (options.retryFailedQueries && job.errors.length > 0) {
        await this.retryFailedQueries(job, options);
      }

      job.status = 'completed';
      job.endTime = new Date().toISOString();
      
    } catch (error) {
      job.status = 'failed';
      job.endTime = new Date().toISOString();
      job.errors.push(`Job execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      this.isProcessing = false;
    }

    return job;
  }

  /**
   * Process a single query with enhanced XAI
   */
  private async processQuery(
    query: string, 
    index: number, 
    job: PrecomputeJob, 
    options: BatchPrecomputeOptions
  ): Promise<PrecomputedResponse | null> {
    try {
      // Get basic precomputed response
      const response = await this.precomputeService.precomputeResponse(query);
      
      if (options.enableXAI) {
        // Enhance with OmniXAI explanations
        const enhancedExplanation = await this.enhanceWithOmniXAI(query, response);
        response.xaiExplanation = enhancedExplanation;
      }

      return response;
    } catch (error) {
      console.error(`Failed to process query ${index}: ${query}`, error);
      throw error;
    }
  }

  /**
   * Enhance response with OmniXAI explanations
   */
  private async enhanceWithOmniXAI(query: string, response: PrecomputedResponse): Promise<XAIExplanation> {
    try {
      // Prepare input data for XAI analysis
      const inputData = this.prepareXAIInputData(query, response);
      
      // Create explanation request
      const explanationRequest: ExplanationRequest = {
        modelId: 'threat_assessment_v1',
        inputData,
        explanationType: 'local',
        methods: ['lime', 'shap', 'integrated_gradients']
      };

      // Get OmniXAI explanation
      const explanationResult = await this.omniXAIService.explainPrediction(explanationRequest);
      
      // Convert to XAI explanation format
      const xaiExplanation = this.omniXAIService.convertToXAIExplanation(
        explanationResult,
        query,
        response.openaiResponse
      );

      return xaiExplanation;
    } catch (error) {
      console.warn('Failed to enhance with OmniXAI, using basic explanation:', error);
      return response.xaiExplanation; // Fallback to basic explanation
    }
  }

  /**
   * Prepare input data for XAI analysis
   */
  private prepareXAIInputData(query: string, response: PrecomputedResponse): Record<string, any> {
    const lowerQuery = query.toLowerCase();
    const lowerResponse = response.openaiResponse.toLowerCase();
    
    return {
      flight_deviation: this.extractNumericFeature(lowerQuery + lowerResponse, ['deviation', 'course', 'path']),
      speed_change: this.extractNumericFeature(lowerQuery + lowerResponse, ['speed', 'velocity', 'acceleration']),
      communication_status: lowerQuery.includes('communication') || lowerResponse.includes('communication') ? 0 : 1,
      geographic_vector: this.extractNumericFeature(lowerQuery + lowerResponse, ['location', 'position', 'geographic']),
      time_of_day: this.extractTimeFeature(lowerQuery + lowerResponse),
      weather_conditions: this.extractNumericFeature(lowerQuery + lowerResponse, ['weather', 'conditions']),
      aircraft_type: lowerQuery.includes('military') || lowerResponse.includes('military') ? 'military' : 'civilian',
      flight_plan_status: lowerQuery.includes('plan') || lowerResponse.includes('plan') ? 'filed' : 'unknown'
    };
  }

  /**
   * Extract numeric feature from text
   */
  private extractNumericFeature(text: string, keywords: string[]): number {
    let score = 0;
    keywords.forEach(keyword => {
      if (text.includes(keyword)) score += 0.3;
    });
    
    // Add some randomness for realistic simulation
    return Math.min(1, score + (Math.random() * 0.2));
  }

  /**
   * Extract time feature from text
   */
  private extractTimeFeature(text: string): number {
    // Look for time indicators, default to current hour
    const timeMatches = text.match(/(\d{1,2}):(\d{2})/);
    if (timeMatches) {
      return parseInt(timeMatches[1]);
    }
    return new Date().getHours();
  }

  /**
   * Create batches from queries array
   */
  private createBatches<T>(array: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Retry failed queries
   */
  private async retryFailedQueries(job: PrecomputeJob, options: BatchPrecomputeOptions): Promise<void> {
    const failedQueries = job.errors
      .map(error => error.split('"')[1]) // Extract query from error message
      .filter(query => query);

    if (failedQueries.length === 0) return;

    console.log(`Retrying ${failedQueries.length} failed queries...`);
    
    for (let attempt = 1; attempt <= options.maxRetries; attempt++) {
      const remainingFailures: string[] = [];
      
      for (const query of failedQueries) {
        try {
          const response = await this.precomputeService.precomputeResponse(query);
          if (options.enableXAI) {
            response.xaiExplanation = await this.enhanceWithOmniXAI(query, response);
          }
          job.results.push(response);
          
          // Remove from errors
          job.errors = job.errors.filter(error => !error.includes(query));
        } catch (error) {
          remainingFailures.push(query);
        }
        
        // Small delay between retries
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      if (remainingFailures.length === 0) break;
      
      // Exponential backoff for next attempt
      if (attempt < options.maxRetries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  /**
   * Get job status
   */
  public getJob(jobId: string): PrecomputeJob | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Get all jobs
   */
  public getAllJobs(): PrecomputeJob[] {
    return Array.from(this.jobs.values());
  }

  /**
   * Cancel a running job
   */
  public cancelJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (job && job.status === 'running') {
      job.status = 'failed';
      job.endTime = new Date().toISOString();
      job.errors.push('Job cancelled by user');
      this.isProcessing = false;
      return true;
    }
    return false;
  }

  /**
   * Delete a job
   */
  public deleteJob(jobId: string): boolean {
    return this.jobs.delete(jobId);
  }

  /**
   * Get precompute statistics
   */
  public getStatistics(): {
    totalJobs: number;
    completedJobs: number;
    failedJobs: number;
    totalQueries: number;
    successfulQueries: number;
    averageProcessingTime: number;
    cacheStats: any;
  } {
    const jobs = Array.from(this.jobs.values());
    const completedJobs = jobs.filter(j => j.status === 'completed');
    const failedJobs = jobs.filter(j => j.status === 'failed');
    
    const totalQueries = jobs.reduce((sum, job) => sum + job.queries.length, 0);
    const successfulQueries = jobs.reduce((sum, job) => sum + job.results.length, 0);
    
    const processingTimes = jobs
      .filter(j => j.endTime)
      .map(j => new Date(j.endTime!).getTime() - new Date(j.startTime).getTime());
    
    const averageProcessingTime = processingTimes.length > 0
      ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length
      : 0;

    return {
      totalJobs: jobs.length,
      completedJobs: completedJobs.length,
      failedJobs: failedJobs.length,
      totalQueries,
      successfulQueries,
      averageProcessingTime,
      cacheStats: this.precomputeService.getCacheStats()
    };
  }

  /**
   * Export job results
   */
  public exportJobResults(jobId: string): void {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    const exportData = {
      job: {
        id: job.id,
        status: job.status,
        progress: job.progress,
        startTime: job.startTime,
        endTime: job.endTime,
        totalQueries: job.queries.length,
        successfulResults: job.results.length,
        errors: job.errors.length
      },
      results: job.results,
      errors: job.errors,
      exportTimestamp: new Date().toISOString()
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `precompute_job_${jobId}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Clear all completed jobs
   */
  public clearCompletedJobs(): number {
    const completedJobs = Array.from(this.jobs.entries())
      .filter(([, job]) => job.status === 'completed');
    
    completedJobs.forEach(([jobId]) => this.jobs.delete(jobId));
    
    return completedJobs.length;
  }
}