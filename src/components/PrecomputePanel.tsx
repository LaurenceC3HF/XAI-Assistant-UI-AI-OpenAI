import React, { useState, useEffect } from 'react';
import { PrecomputeManager, PrecomputeJob, BatchPrecomputeOptions } from '../services/PrecomputeManager';
import { PrecomputeConfig } from '../services/PrecomputeService';
import { VisualCard } from './visualizations/VisualCard';
import { 
  Play, 
  Pause, 
  Download, 
  Trash2, 
  Settings, 
  BarChart3, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Plus,
  RefreshCw
} from 'lucide-react';

interface PrecomputePanelProps {
  isVisible: boolean;
  onClose: () => void;
}

export const PrecomputePanel: React.FC<PrecomputePanelProps> = ({ isVisible, onClose }) => {
  const [precomputeManager, setPrecomputeManager] = useState<PrecomputeManager | null>(null);
  const [jobs, setJobs] = useState<PrecomputeJob[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [config, setConfig] = useState<PrecomputeConfig>({
    openaiApiKey: '',
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 1000,
    enableXAI: true,
    cacheExpiry: 24
  });
  const [batchOptions, setBatchOptions] = useState<BatchPrecomputeOptions>({
    batchSize: 5,
    delayBetweenBatches: 2000,
    enableXAI: true,
    retryFailedQueries: true,
    maxRetries: 3
  });
  const [newQueries, setNewQueries] = useState<string>('');
  const [showConfig, setShowConfig] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize precompute manager
  useEffect(() => {
    if (config.openaiApiKey && !isInitialized) {
      const manager = new PrecomputeManager(config);
      setPrecomputeManager(manager);
      setIsInitialized(true);
      refreshData(manager);
    }
  }, [config.openaiApiKey, isInitialized]);

  // Refresh data periodically
  useEffect(() => {
    if (!precomputeManager) return;

    const interval = setInterval(() => {
      refreshData(precomputeManager);
    }, 2000);

    return () => clearInterval(interval);
  }, [precomputeManager]);

  const refreshData = (manager: PrecomputeManager) => {
    setJobs(manager.getAllJobs());
    setStatistics(manager.getStatistics());
  };

  const handleCreateJob = () => {
    if (!precomputeManager || !newQueries.trim()) return;

    const queries = newQueries
      .split('\n')
      .map(q => q.trim())
      .filter(q => q.length > 0);

    if (queries.length === 0) return;

    const job = precomputeManager.createJob(queries);
    setNewQueries('');
    refreshData(precomputeManager);
    
    // Auto-start the job
    handleExecuteJob(job.id);
  };

  const handleExecuteJob = async (jobId: string) => {
    if (!precomputeManager) return;

    try {
      await precomputeManager.executeJob(jobId, batchOptions);
      refreshData(precomputeManager);
    } catch (error) {
      console.error('Failed to execute job:', error);
    }
  };

  const handleCancelJob = (jobId: string) => {
    if (!precomputeManager) return;
    precomputeManager.cancelJob(jobId);
    refreshData(precomputeManager);
  };

  const handleDeleteJob = (jobId: string) => {
    if (!precomputeManager) return;
    precomputeManager.deleteJob(jobId);
    refreshData(precomputeManager);
  };

  const handleExportJob = (jobId: string) => {
    if (!precomputeManager) return;
    precomputeManager.exportJobResults(jobId);
  };

  const handleClearCompleted = () => {
    if (!precomputeManager) return;
    const cleared = precomputeManager.clearCompletedJobs();
    console.log(`Cleared ${cleared} completed jobs`);
    refreshData(precomputeManager);
  };

  const getStatusIcon = (status: PrecomputeJob['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'running':
        return <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime).getTime();
    const end = endTime ? new Date(endTime).getTime() : Date.now();
    const duration = end - start;
    
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    
    return `${minutes}m ${seconds}s`;
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <BarChart3 className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-bold text-white">OpenAI Response Precompute System</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="flex items-center space-x-2 bg-slate-700 hover:bg-slate-600 text-white px-3 py-1 rounded-lg text-sm transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span>Config</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors text-xl"
            >
              ×
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Configuration Panel */}
          {showConfig && (
            <VisualCard>
              <h3 className="text-lg font-semibold text-white mb-4">Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">OpenAI API Key</label>
                  <input
                    type="password"
                    value={config.openaiApiKey}
                    onChange={(e) => setConfig(prev => ({ ...prev, openaiApiKey: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white"
                    placeholder="sk-..."
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Model</label>
                  <select
                    value={config.model}
                    onChange={(e) => setConfig(prev => ({ ...prev, model: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                    <option value="gpt-4">GPT-4</option>
                    <option value="gpt-4-turbo">GPT-4 Turbo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Temperature</label>
                  <input
                    type="number"
                    min="0"
                    max="2"
                    step="0.1"
                    value={config.temperature}
                    onChange={(e) => setConfig(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Max Tokens</label>
                  <input
                    type="number"
                    min="100"
                    max="4000"
                    value={config.maxTokens}
                    onChange={(e) => setConfig(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Batch Size</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={batchOptions.batchSize}
                    onChange={(e) => setBatchOptions(prev => ({ ...prev, batchSize: parseInt(e.target.value) }))}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Delay Between Batches (ms)</label>
                  <input
                    type="number"
                    min="500"
                    max="10000"
                    value={batchOptions.delayBetweenBatches}
                    onChange={(e) => setBatchOptions(prev => ({ ...prev, delayBetweenBatches: parseInt(e.target.value) }))}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={config.enableXAI}
                      onChange={(e) => setConfig(prev => ({ ...prev, enableXAI: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-300">Enable XAI</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={batchOptions.retryFailedQueries}
                      onChange={(e) => setBatchOptions(prev => ({ ...prev, retryFailedQueries: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-300">Retry Failed</span>
                  </label>
                </div>
              </div>
            </VisualCard>
          )}

          {/* Statistics */}
          {statistics && (
            <VisualCard>
              <h3 className="text-lg font-semibold text-white mb-4">Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-800/50 p-3 rounded-lg">
                  <div className="text-sm text-gray-400">Total Jobs</div>
                  <div className="text-white font-bold text-xl">{statistics.totalJobs}</div>
                </div>
                <div className="bg-slate-800/50 p-3 rounded-lg">
                  <div className="text-sm text-gray-400">Completed</div>
                  <div className="text-green-400 font-bold text-xl">{statistics.completedJobs}</div>
                </div>
                <div className="bg-slate-800/50 p-3 rounded-lg">
                  <div className="text-sm text-gray-400">Total Queries</div>
                  <div className="text-white font-bold text-xl">{statistics.totalQueries}</div>
                </div>
                <div className="bg-slate-800/50 p-3 rounded-lg">
                  <div className="text-sm text-gray-400">Success Rate</div>
                  <div className="text-blue-400 font-bold text-xl">
                    {statistics.totalQueries > 0 
                      ? Math.round((statistics.successfulQueries / statistics.totalQueries) * 100)
                      : 0}%
                  </div>
                </div>
              </div>
            </VisualCard>
          )}

          {/* Create New Job */}
          <VisualCard>
            <h3 className="text-lg font-semibold text-white mb-4">Create New Precompute Job</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Queries (one per line)
                </label>
                <textarea
                  value={newQueries}
                  onChange={(e) => setNewQueries(e.target.value)}
                  rows={6}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white resize-none"
                  placeholder="Why is the aircraft deviating from its flight path?&#10;What are the intercept options?&#10;How reliable is the threat assessment?"
                />
              </div>
              <button
                onClick={handleCreateJob}
                disabled={!precomputeManager || !newQueries.trim()}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create & Start Job</span>
              </button>
            </div>
          </VisualCard>

          {/* Jobs List */}
          <VisualCard>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Precompute Jobs</h3>
              <button
                onClick={handleClearCompleted}
                className="flex items-center space-x-2 bg-slate-700 hover:bg-slate-600 text-white px-3 py-1 rounded-lg text-sm transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear Completed</span>
              </button>
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {jobs.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  No precompute jobs yet. Create one above to get started.
                </div>
              ) : (
                jobs.map(job => (
                  <div key={job.id} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(job.status)}
                        <span className="font-medium text-white">Job {job.id.slice(-8)}</span>
                        <span className="text-sm text-gray-400">
                          {job.queries.length} queries
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {job.status === 'running' && (
                          <button
                            onClick={() => handleCancelJob(job.id)}
                            className="text-red-400 hover:text-red-300 p-1"
                            title="Cancel Job"
                          >
                            <Pause className="w-4 h-4" />
                          </button>
                        )}
                        {job.status === 'completed' && (
                          <button
                            onClick={() => handleExportJob(job.id)}
                            className="text-blue-400 hover:text-blue-300 p-1"
                            title="Export Results"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteJob(job.id)}
                          className="text-red-400 hover:text-red-300 p-1"
                          title="Delete Job"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    {job.status === 'running' && (
                      <div className="mb-2">
                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                          <span>Progress</span>
                          <span>{Math.round(job.progress)}%</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${job.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Status:</span>
                        <span className={`ml-1 font-medium ${
                          job.status === 'completed' ? 'text-green-400' :
                          job.status === 'failed' ? 'text-red-400' :
                          job.status === 'running' ? 'text-blue-400' :
                          'text-yellow-400'
                        }`}>
                          {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Results:</span>
                        <span className="ml-1 text-white">{job.results.length}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Errors:</span>
                        <span className="ml-1 text-red-400">{job.errors.length}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Duration:</span>
                        <span className="ml-1 text-white">
                          {formatDuration(job.startTime, job.endTime)}
                        </span>
                      </div>
                    </div>
                    
                    {job.errors.length > 0 && (
                      <div className="mt-2 p-2 bg-red-500/20 border border-red-500/50 rounded text-xs">
                        <div className="text-red-300 font-medium mb-1">Errors:</div>
                        <div className="text-red-200 max-h-20 overflow-y-auto">
                          {job.errors.slice(0, 3).map((error, index) => (
                            <div key={index}>{error}</div>
                          ))}
                          {job.errors.length > 3 && (
                            <div className="text-red-400">... and {job.errors.length - 3} more</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </VisualCard>
        </div>
      </div>
    </div>
  );
};