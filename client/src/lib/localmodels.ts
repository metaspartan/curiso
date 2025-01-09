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
  // {
  //   id: 'llama3.2:1b',
  //   name: 'llama3.2:1b',
  //   provider: 'openai',
  //   description: 'Llama 3.2 1B model running locally via Ollama',
  //   endpoint: 'http://localhost:11434/v1',
  //   requiresAuth: false,
  //   maxTokens: 8192,
  //   thumbnailUrl: ollamaLogo
  // },
  // {
  //   id: 'llama3.2',
  //   name: 'llama3.2:3b',
  //   provider: 'openai',
  //   description: 'Llama 3.2 3B model running locally via Ollama',
  //   endpoint: 'http://localhost:11434/v1',
  //   requiresAuth: false,
  //   maxTokens: 8192,
  //   thumbnailUrl: ollamaLogo
  // },
  // {
  //   id: 'llama3.3',
  //   name: 'llama3.3',
  //   provider: 'openai',
  //   description: 'Llama 3.3 70B model running locally via Ollama',
  //   endpoint: 'http://localhost:11434/v1',
  //   requiresAuth: false,
  //   maxTokens: 8192,
  //   thumbnailUrl: ollamaLogo
  // },
  // {
  //   id: 'llama3.2-vision',
  //   name: 'llama3.2-vision:11b',
  //   provider: 'openai',
  //   description: 'Llama 3.2 Vision 11B model running locally via Ollama',
  //   endpoint: 'http://localhost:11434/v1',
  //   requiresAuth: false,
  //   maxTokens: 8192,
  //   thumbnailUrl: ollamaLogo
  // },
  // {
  //   id: 'qwen2.5:1.5b',
  //   name: 'qwen2.5:1.5b',
  //   provider: 'openai',
  //   description: 'Qwen 2.5 1.5B model running locally via Ollama',
  //   endpoint: 'http://localhost:11434/v1',
  //   requiresAuth: false,
  //   maxTokens: 8192,
  //   thumbnailUrl: ollamaLogo
  // },
  // {
  //   id: 'qwen2.5:3b',
  //   name: 'qwen2.5:3b',
  //   provider: 'openai',
  //   description: 'Qwen 2.5 3B model running locally via Ollama',
  //   endpoint: 'http://localhost:11434/v1',
  //   requiresAuth: false,
  //   maxTokens: 8192,
  //   thumbnailUrl: ollamaLogo
  // },
  // {
  //   id: 'qwen2.5:7b',
  //   name: 'qwen2.5:7b',
  //   provider: 'openai',
  //   description: 'Qwen 2.5 7B model running locally via Ollama',
  //   endpoint: 'http://localhost:11434/v1',
  //   requiresAuth: false,
  //   maxTokens: 8192,
  //   thumbnailUrl: ollamaLogo
  // },
  // {
  //   id: 'phi3.5',
  //   name: 'phi3.5',
  //   provider: 'openai',
  //   description: 'Phi 3.5 3.8B model running locally via Ollama',
  //   endpoint: 'http://localhost:11434/v1',
  //   requiresAuth: false,
  //   maxTokens: 8192,
  //   thumbnailUrl: ollamaLogo
  // },
  // {
  //   id: 'phi4',
  //   name: 'phi4',
  //   provider: 'openai',
  //   description: 'Phi 4 14B model running locally via Ollama',
  //   endpoint: 'http://localhost:11434/v1',
  //   requiresAuth: false,
  //   maxTokens: 8192,
  //   thumbnailUrl: ollamaLogo
  // }
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