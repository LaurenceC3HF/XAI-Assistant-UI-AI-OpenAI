import { useState, useCallback, useEffect } from 'react';
import { PrecomputeManager, PrecomputeJob } from '../services/PrecomputeManager';
import { PrecomputeConfig, PrecomputedResponse } from '../services/PrecomputeService';
import { XAIExplanation } from '../types';

export interface UsePrecomputeOptions {
  autoInitialize?: boolean;
  defaultConfig?: Partial<PrecomputeConfig>;
  refreshInterval?: number; // milliseconds
}

export const usePrecompute = (options: UsePrecomputeOptions = {}) => {
  const [manager, setManager] = useState<PrecomputeManager | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [jobs, setJobs] = useState<PrecomputeJob[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [config, setConfig] = useState<PrecomputeConfig>({
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 1000,
    enableXAI: true,
    cacheExpiry: 24,
    ...options.defaultConfig
  });

  // Initialize manager
  const initialize = useCallback((newConfig?: Partial<PrecomputeConfig>) => {
    const finalConfig = { ...config, ...newConfig };
    
    if (!finalConfig.openaiApiKey) {
      console.warn('OpenAI API key not provided for precompute service');
      return false;
    }

    const newManager = new PrecomputeManager(finalConfig);
    setManager(newManager);
    setConfig(finalConfig);
    setIsInitialized(true);
    
    return true;
  }, [config]);

  // Auto-initialize if enabled
  useEffect(() => {
    if (options.autoInitialize && !isInitialized && config.openaiApiKey) {
      initialize();
    }
  }, [options.autoInitialize, isInitialized, config.openaiApiKey, initialize]);

  // Refresh data periodically
  useEffect(() => {
    if (!manager || !options.refreshInterval) return;

    const interval = setInterval(() => {
      refreshData();
    }, options.refreshInterval);

    return () => clearInterval(interval);
  }, [manager, options.refreshInterval]);

  // Refresh jobs and statistics
  const refreshData = useCallback(() => {
    if (!manager) return;
    
    setJobs(manager.getAllJobs());
    setStatistics(manager.getStatistics());
  }, [manager]);

  // Get cached response
  const getCachedResponse = useCallback(async (query: string): Promise<PrecomputedResponse | null> => {
    if (!manager) return null;
    return await manager['precomputeService'].getCachedResponse(query);
  }, [manager]);

  // Precompute single response
  const precomputeResponse = useCallback(async (query: string): Promise<PrecomputedResponse | null> => {
    if (!manager) {
      console.warn('Precompute manager not initialized');
      return null;
    }

    try {
      const response = await manager['precomputeService'].precomputeResponse(query);
      refreshData();
      return response;
    } catch (error) {
      console.error('Failed to precompute response:', error);
      return null;
    }
  }, [manager, refreshData]);

  // Create and execute job
  const createAndExecuteJob = useCallback(async (
    queries: string[],
    options?: {
      batchSize?: number;
      delayBetweenBatches?: number;
      enableXAI?: boolean;
      retryFailedQueries?: boolean;
      maxRetries?: number;
    }
  ): Promise<PrecomputeJob | null> => {
    if (!manager) {
      console.warn('Precompute manager not initialized');
      return null;
    }

    try {
      const job = manager.createJob(queries);
      refreshData();
      
      // Execute job with options
      const batchOptions = {
        batchSize: 5,
        delayBetweenBatches: 2000,
        enableXAI: true,
        retryFailedQueries: true,
        maxRetries: 3,
        ...options
      };

      const completedJob = await manager.executeJob(job.id, batchOptions);
      refreshData();
      
      return completedJob;
    } catch (error) {
      console.error('Failed to create and execute job:', error);
      refreshData(); // Refresh to show any partial results
      return null;
    }
  }, [manager, refreshData]);

  // Get job by ID
  const getJob = useCallback((jobId: string): PrecomputeJob | undefined => {
    if (!manager) return undefined;
    return manager.getJob(jobId);
  }, [manager]);

  // Cancel job
  const cancelJob = useCallback((jobId: string): boolean => {
    if (!manager) return false;
    const result = manager.cancelJob(jobId);
    refreshData();
    return result;
  }, [manager, refreshData]);

  // Delete job
  const deleteJob = useCallback((jobId: string): boolean => {
    if (!manager) return false;
    const result = manager.deleteJob(jobId);
    refreshData();
    return result;
  }, [manager, refreshData]);

  // Export job results
  const exportJobResults = useCallback((jobId: string): void => {
    if (!manager) return;
    manager.exportJobResults(jobId);
  }, [manager]);

  // Clear completed jobs
  const clearCompletedJobs = useCallback((): number => {
    if (!manager) return 0;
    const cleared = manager.clearCompletedJobs();
    refreshData();
    return cleared;
  }, [manager, refreshData]);

  // Clear cache
  const clearCache = useCallback((): void => {
    if (!manager) return;
    manager['precomputeService'].clearCache();
    refreshData();
  }, [manager, refreshData]);

  // Get response for chat integration
  const getResponseForChat = useCallback(async (query: string): Promise<XAIExplanation | null> => {
    if (!manager) return null;

    // First check cache
    const cached = await getCachedResponse(query);
    if (cached) {
      return cached.xaiExplanation;
    }

    // If not cached, precompute it
    const response = await precomputeResponse(query);
    return response?.xaiExplanation || null;
  }, [manager, getCachedResponse, precomputeResponse]);

  // Batch precompute common queries
  const precomputeCommonQueries = useCallback(async (): Promise<PrecomputeJob | null> => {
    const commonQueries = [
      "Why is the aircraft deviating from its flight path?",
      "What are the available intercept options?",
      "How reliable is the current threat assessment?",
      "What factors make this flight pattern suspicious?",
      "What happens if we delay the response?",
      "Explain the speed increase significance",
      "What are the risks of immediate intercept?",
      "How does weather affect the situation?",
      "What is the timeline for decision making?",
      "What are the alternative response scenarios?"
    ];

    return createAndExecuteJob(commonQueries, {
      batchSize: 3,
      delayBetweenBatches: 3000,
      enableXAI: true
    });
  }, [createAndExecuteJob]);

  return {
    // State
    manager,
    isInitialized,
    jobs,
    statistics,
    config,

    // Actions
    initialize,
    refreshData,
    getCachedResponse,
    precomputeResponse,
    createAndExecuteJob,
    getJob,
    cancelJob,
    deleteJob,
    exportJobResults,
    clearCompletedJobs,
    clearCache,
    getResponseForChat,
    precomputeCommonQueries,

    // Utilities
    updateConfig: setConfig
  };
};