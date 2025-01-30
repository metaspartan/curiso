import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ModelMetrics {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  totalTime: number;
  tokensPerSecond: number;
  provider: string;
}

interface MetricsStore {
  metrics: Record<string, ModelMetrics>;
  updateMetrics: (
    modelId: string,
    newTokens: {
      inputTokens: number;
      outputTokens: number;
      totalTokens: number;
      totalTime: number;
      tokensPerSecond: number;
      provider: string;
    }
  ) => void;
  resetMetrics: () => void;
}

export const useMetricsStore = create<MetricsStore>()(
  persist(
    set => ({
      metrics: {},
      updateMetrics: (modelId, newTokens) =>
        set(state => {
          const currentMetrics = state.metrics[modelId] || {
            inputTokens: 0,
            outputTokens: 0,
            totalTokens: 0,
            totalTime: 0,
            tokensPerSecond: 0,
            provider: newTokens.provider,
          };

          // Ensure we're working with positive numbers
          const inputTokens = Math.abs(newTokens.inputTokens);
          const outputTokens = Math.abs(newTokens.outputTokens);

          const totalInputTokens = currentMetrics.inputTokens + inputTokens;
          const totalOutputTokens = currentMetrics.outputTokens + outputTokens;
          const totalTokens = totalInputTokens + totalOutputTokens;
          const totalTime = currentMetrics.totalTime + Math.abs(newTokens.totalTime);
          const tokensPerSecond = totalOutputTokens / totalTime;

          return {
            metrics: {
              ...state.metrics,
              [modelId]: {
                inputTokens: totalInputTokens,
                outputTokens: totalOutputTokens,
                totalTokens,
                totalTime,
                tokensPerSecond,
                provider: newTokens.provider,
              },
            },
          };
        }),
      resetMetrics: () => set({ metrics: {} }),
    }),
    {
      name: 'curiso-metrics-store',
    }
  )
);
