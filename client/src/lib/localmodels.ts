import { CustomModel } from './types'
import ollamaLogo from '@/assets/ollama-logo.svg'

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

type ModelResponse = {
    object: string;
    data: OllamaModelResponse[];
} | ExoModelResponse[];

export const defaultLocalModels: CustomModel[] = [
]

export class ModelService {
    private static instance: ModelService;
    
    static getInstance(): ModelService {
      if (!ModelService.instance) {
        ModelService.instance = new ModelService();
      }
      return ModelService.instance;
    }
  
    async getAvailableModels(endpoint: string): Promise<CustomModel[]> {
      try {
        const response = await fetch(`${endpoint}/models`);
        if (!response.ok) {
          // throw new Error('Failed to fetch models');
          // console.error('Failed to fetch models');
        }
  
        const data: ModelResponse = await response.json();
        const modelIds = this.extractModelIds(data);
        
        return modelIds.map(id => ({
          id,
          name: id,
          provider: 'openai',
          description: `${id} model running locally`,
          endpoint: endpoint,
          requiresAuth: false,
          maxTokens: 8192,
          thumbnailUrl: ollamaLogo
        }));
      } catch (error) {
        // console.warn('Failed to fetch models:', error);
        return [];
      }
    }
  
    private extractModelIds(data: ModelResponse): string[] {
      // Handle Ollama-style response
      if ('object' in data && data.object === 'list') {
        return data.data.map(model => model.id);
      }
      
      // Handle Exo-style response (until fixed)
      if (Array.isArray(data)) {
        return data.map(model => model.id);
      }
      
      return [];
    }
  }
  
  export const modelService = ModelService.getInstance();