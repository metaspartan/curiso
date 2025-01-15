import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ModelMetrics {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    totalTime: number;
    tokensPerSecond: number;
  }
  
  interface MetricsStore {
    metrics: Record<string, ModelMetrics>;
    updateMetrics: (modelId: string, newTokens: {
      inputTokens: number;
      outputTokens: number;
      totalTokens: number;
      totalTime: number;
      tokensPerSecond: number;
    }) => void;
    resetMetrics: () => void;
  }
  
  export const useMetricsStore = create<MetricsStore>()(
    persist(
      (set) => ({
        metrics: {},
        updateMetrics: (modelId, newTokens) => set((state) => {
          const currentMetrics = state.metrics[modelId] || {
            inputTokens: 0,
            outputTokens: 0,
            totalTokens: 0,
            totalTime: 0,
            tokensPerSecond: 0
          };
  
          const totalInputTokens = currentMetrics.inputTokens + newTokens.inputTokens;
          const totalOutputTokens = currentMetrics.outputTokens + newTokens.outputTokens;
          const totalTokens = totalInputTokens + totalOutputTokens;
          const totalTime = currentMetrics.totalTime + newTokens.totalTime;
          const tokensPerSecond = totalOutputTokens / totalTime;
  
          return {
            metrics: {
              ...state.metrics,
              [modelId]: {
                inputTokens: totalInputTokens,
                outputTokens: totalOutputTokens,
                totalTokens,
                totalTime,
                tokensPerSecond
              }
            }
          };
        }),
        resetMetrics: () => set({ metrics: {} })
      }),
      {
        name: 'curiso-metrics-store'
      }
    )
  );