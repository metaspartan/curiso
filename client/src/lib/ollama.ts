import { CustomModel } from './types'
import ollamaLogo from '@/assets/ollama-logo.svg'

export const defaultOllamaModels: CustomModel[] = [
  {
    id: 'llama3.2:1b',
    name: 'llama3.2:1b',
    provider: 'openai',
    description: 'Llama 3.2 1B model running locally via Ollama',
    endpoint: 'http://localhost:11434/v1',
    requiresAuth: false,
    maxTokens: 8192,
    thumbnailUrl: ollamaLogo
  },
  {
    id: 'llama3.2',
    name: 'llama3.2:3b',
    provider: 'openai',
    description: 'Llama 3.2 3B model running locally via Ollama',
    endpoint: 'http://localhost:11434/v1',
    requiresAuth: false,
    maxTokens: 8192,
    thumbnailUrl: ollamaLogo
  },
  {
    id: 'llama3.3',
    name: 'llama3.3',
    provider: 'openai',
    description: 'Llama 3.3 70B model running locally via Ollama',
    endpoint: 'http://localhost:11434/v1',
    requiresAuth: false,
    maxTokens: 8192,
    thumbnailUrl: ollamaLogo
  },
  {
    id: 'llama3.2-vision',
    name: 'llama3.2-vision:11b',
    provider: 'openai',
    description: 'Llama 3.2 Vision 11B model running locally via Ollama',
    endpoint: 'http://localhost:11434/v1',
    requiresAuth: false,
    maxTokens: 8192,
    thumbnailUrl: ollamaLogo
  }
]
