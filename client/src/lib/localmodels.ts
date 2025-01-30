import { CustomModel } from './types';
import ollamaLogo from '@/assets/ollama-logo.svg';
import { useStore } from '@/lib/store';

interface BaseModelResponse {
  id: string;
  object: string;
  owned_by: string;
}

interface OllamaModelResponse extends BaseModelResponse {
  created: number;
}

interface ExoModelResponse extends BaseModelResponse {
  ready: boolean;
}

type ModelResponse =
  | {
      object: string;
      data: OllamaModelResponse[];
    }
  | ExoModelResponse[];

export const defaultLocalModels: CustomModel[] = [];

export class ModelService {
  private static instance: ModelService;
  private localModelsCache: Map<string, CustomModel[]> = new Map();

  static getInstance(): ModelService {
    if (!ModelService.instance) {
      ModelService.instance = new ModelService();
    }
    return ModelService.instance;
  }

  async getAvailableModels(endpoint: string): Promise<CustomModel[]> {
    // First check if we have cached models for this endpoint
    const cachedModels = this.localModelsCache.get(endpoint);
    if (cachedModels) {
      return cachedModels;
    }

    try {
      // Add timeout to fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${endpoint}/models`, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Response is not JSON');
      }

      const data: ModelResponse = await response.json();

      // Validate response structure
      // @ts-ignore TODO fix tscheck
      if (!data || ((!'object') in data && !Array.isArray(data))) {
        throw new Error('Invalid response structure');
      }

      const modelIds = this.extractModelIds(data);
      if (!modelIds.length) {
        console.warn('No models found in response');
        return [];
      }

      // Create new local models
      const localModels = modelIds.map(id => ({
        id: `${endpoint}-${id}`, // Add endpoint prefix to avoid conflicts
        name: id,
        provider: 'openai',
        description: `${id} model running locally`,
        endpoint: endpoint,
        requiresAuth: false,
        maxTokens: 8192,
        thumbnailUrl: ollamaLogo,
      }));

      // Cache the local models
      this.localModelsCache.set(endpoint, localModels);

      // Return the local models - let the store handle merging
      return localModels;
    } catch (error) {
      // More specific error logging
      if (error instanceof TypeError && error.message === 'Load failed') {
        console.warn('Connection failed to endpoint:', endpoint);
      } else if (error instanceof SyntaxError) {
        console.warn('Invalid JSON response from endpoint:', endpoint);
      } else {
        console.warn('Failed to fetch local models:', error);
      }
      return [];
    }
  }

  clearCache(endpoint?: string) {
    if (endpoint) {
      this.localModelsCache.delete(endpoint);
    } else {
      this.localModelsCache.clear();
    }
  }

  private extractModelIds(data: ModelResponse): string[] {
    if ('object' in data && data.object === 'list') {
      return data.data.map(model => model.id);
    }

    if (Array.isArray(data)) {
      return data.map(model => model.id);
    }

    return [];
  }
}

export const modelService = ModelService.getInstance();
