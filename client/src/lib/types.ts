import { Edge } from "reactflow";
import { Node as ReactFlowNode } from 'reactflow';
import googleLogo from '@/assets/google-logo.svg'

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  image_url?: string;
  metrics?: {
    tokensPerSecond?: number;
    timeToFirstToken?: number;
    totalTokens?: number;
    totalTime?: number;
  };
}

export interface APIResponseMetrics {
  completion_tokens?: number;
  prompt_tokens?: number;
  total_tokens?: number;
  model?: string;
}

export interface RAGDocument {
  id: string;
  filename: string;
  timestamp: string;
  size: number;
  chunks: {
    id: string;
    content: string;
    embedding: Float32Array;
  }[];
}

export interface RAGWebsite {
  id: string;
  url: string;
  title: string;
  dateScraped: string;
}

export interface RAGSettings {
  enabled: boolean;
  documents: RAGDocument[];
  websites: RAGWebsite[];
  similarityThreshold: number;
  chunkSize: number;
  supportedModels: string[];
  embeddingModel: string;
  modelStatus: 'unloaded' | 'loading' | 'loaded' | 'error';
  modelError?: string;
}

export interface Board {
  id: string;
  name: string;
  nodes: ReactFlowNode[];
  edges: Edge[];
}

export interface AIModel {
  id: string;
  name: string;
  provider: 'openai' | 'xai' | 'groq' | 'openrouter' | 'anthropic' | 'google' | 'ollama' | 'custom';
  description: string;
  maxTokens: number;
  thumbnailUrl: string;
}

export interface ProviderSettings {
  apiKey: string;
  customEndpoint?: string;
}

export interface CustomModel extends AIModel {
  endpoint: string;
  requiresAuth: boolean;
  apiKey?: string;  
}

export interface GlobalSettings {
  version: number;
  rag: RAGSettings;
  primaryColor: string;
  boards: Board[];
  customModels: CustomModel[];
  currentBoardId: string;
  openai: ProviderSettings;
  xai: ProviderSettings;
  groq: ProviderSettings;
  anthropic: ProviderSettings;
  openrouter: ProviderSettings;
  google: ProviderSettings;
  temperature: number;
  top_p: number;
  max_tokens: number;
  frequency_penalty: number;
  presence_penalty: number;
  systemPrompt: string;
  snapToGrid: boolean;
  lastSelectedModel: string;
  doubleClickZoom: boolean;
  panOnDrag: boolean;
  panOnScroll: boolean;
  zoomOnScroll: boolean;
  fitViewOnInit: boolean;
}

export interface NodeData {
  messages: Message[];
  model: string;
  provider: 'openai' | 'xai' | 'groq' | 'openrouter' | 'anthropic' | 'google' | 'ollama' | 'custom';
}

export const availableModels: AIModel[] = [
  {
    id: 'chatgpt-4o-latest',
    name: 'chatgpt-4o-latest',
    provider: 'openai',
    description: 'Latest most capable GPT 4o model for complex tasks',
    maxTokens: 8192,
    thumbnailUrl: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="256" height="260" preserveAspectRatio="xMidYMid" viewBox="0 0 256 260"%3E%3Cpath fill="%2310a37f" d="M239.184 106.203a64.716 64.716 0 0 0-5.576-53.103C219.452 28.459 191 15.784 163.213 21.74A65.586 65.586 0 0 0 52.096 45.22a64.716 64.716 0 0 0-43.23 31.36c-14.31 24.602-11.061 55.634 8.033 76.74a64.665 64.665 0 0 0 5.525 53.102c14.174 24.65 42.644 37.324 70.446 31.36a64.72 64.72 0 0 0 48.754 21.744c28.481.025 53.714-18.361 62.414-45.481a64.767 64.767 0 0 0 43.229-31.36c14.137-24.558 10.875-55.423-8.083-76.483Zm-97.56 136.338a48.397 48.397 0 0 1-31.105-11.255l1.535-.87 51.67-29.825a8.595 8.595 0 0 0 4.247-7.367v-72.85l21.845 12.636c.218.111.37.32.409.563v60.367c-.056 26.818-21.783 48.545-48.601 48.601Zm-104.466-44.61a48.345 48.345 0 0 1-5.781-32.589l1.534.921 51.722 29.826a8.339 8.339 0 0 0 8.441 0l63.181-36.425v25.221a.87.87 0 0 1-.358.665l-52.335 30.184c-23.257 13.398-52.97 5.431-66.404-17.803ZM23.549 85.38a48.499 48.499 0 0 1 25.58-21.333v61.39a8.288 8.288 0 0 0 4.195 7.316l62.874 36.272-21.845 12.636a.819.819 0 0 1-.767 0L41.353 151.53c-23.211-13.454-31.171-43.144-17.804-66.405v.256Zm179.466 41.695-63.08-36.63L161.73 77.86a.819.819 0 0 1 .768 0l52.233 30.184a48.6 48.6 0 0 1-7.316 87.635v-61.391a8.544 8.544 0 0 0-4.4-7.213Zm21.742-32.69-1.535-.922-51.619-30.081a8.39 8.39 0 0 0-8.492 0L99.98 99.808V74.587a.716.716 0 0 1 .307-.665l52.233-30.133a48.652 48.652 0 0 1 72.236 50.391v.205ZM88.061 139.097l-21.845-12.585a.87.87 0 0 1-.41-.614V65.685a48.652 48.652 0 0 1 79.757-37.346l-1.535.87-51.67 29.825a8.595 8.595 0 0 0-4.246 7.367l-.051 72.697Zm11.868-25.58 28.138-16.217 28.188 16.218v32.434l-28.086 16.218-28.188-16.218-.052-32.434Z"/%3E%3C/svg%3E'
  },
  {
    id: 'gpt-4o',
    name: 'gpt-4o',
    provider: 'openai',
    description: 'Most capable GPT 4o model for complex tasks',
    maxTokens: 8192,
    thumbnailUrl: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="256" height="260" preserveAspectRatio="xMidYMid" viewBox="0 0 256 260"%3E%3Cpath fill="%2310a37f" d="M239.184 106.203a64.716 64.716 0 0 0-5.576-53.103C219.452 28.459 191 15.784 163.213 21.74A65.586 65.586 0 0 0 52.096 45.22a64.716 64.716 0 0 0-43.23 31.36c-14.31 24.602-11.061 55.634 8.033 76.74a64.665 64.665 0 0 0 5.525 53.102c14.174 24.65 42.644 37.324 70.446 31.36a64.72 64.72 0 0 0 48.754 21.744c28.481.025 53.714-18.361 62.414-45.481a64.767 64.767 0 0 0 43.229-31.36c14.137-24.558 10.875-55.423-8.083-76.483Zm-97.56 136.338a48.397 48.397 0 0 1-31.105-11.255l1.535-.87 51.67-29.825a8.595 8.595 0 0 0 4.247-7.367v-72.85l21.845 12.636c.218.111.37.32.409.563v60.367c-.056 26.818-21.783 48.545-48.601 48.601Zm-104.466-44.61a48.345 48.345 0 0 1-5.781-32.589l1.534.921 51.722 29.826a8.339 8.339 0 0 0 8.441 0l63.181-36.425v25.221a.87.87 0 0 1-.358.665l-52.335 30.184c-23.257 13.398-52.97 5.431-66.404-17.803ZM23.549 85.38a48.499 48.499 0 0 1 25.58-21.333v61.39a8.288 8.288 0 0 0 4.195 7.316l62.874 36.272-21.845 12.636a.819.819 0 0 1-.767 0L41.353 151.53c-23.211-13.454-31.171-43.144-17.804-66.405v.256Zm179.466 41.695-63.08-36.63L161.73 77.86a.819.819 0 0 1 .768 0l52.233 30.184a48.6 48.6 0 0 1-7.316 87.635v-61.391a8.544 8.544 0 0 0-4.4-7.213Zm21.742-32.69-1.535-.922-51.619-30.081a8.39 8.39 0 0 0-8.492 0L99.98 99.808V74.587a.716.716 0 0 1 .307-.665l52.233-30.133a48.652 48.652 0 0 1 72.236 50.391v.205ZM88.061 139.097l-21.845-12.585a.87.87 0 0 1-.41-.614V65.685a48.652 48.652 0 0 1 79.757-37.346l-1.535.87-51.67 29.825a8.595 8.595 0 0 0-4.246 7.367l-.051 72.697Zm11.868-25.58 28.138-16.217 28.188 16.218v32.434l-28.086 16.218-28.188-16.218-.052-32.434Z"/%3E%3C/svg%3E'
  },
  {
    id: 'gpt-4o-mini',
    name: 'gpt-4o-mini',
    provider: 'openai',
    description: 'Smallest GPT 4o model for complex tasks',
    maxTokens: 8192,
    thumbnailUrl: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="256" height="260" preserveAspectRatio="xMidYMid" viewBox="0 0 256 260"%3E%3Cpath fill="%2310a37f" d="M239.184 106.203a64.716 64.716 0 0 0-5.576-53.103C219.452 28.459 191 15.784 163.213 21.74A65.586 65.586 0 0 0 52.096 45.22a64.716 64.716 0 0 0-43.23 31.36c-14.31 24.602-11.061 55.634 8.033 76.74a64.665 64.665 0 0 0 5.525 53.102c14.174 24.65 42.644 37.324 70.446 31.36a64.72 64.72 0 0 0 48.754 21.744c28.481.025 53.714-18.361 62.414-45.481a64.767 64.767 0 0 0 43.229-31.36c14.137-24.558 10.875-55.423-8.083-76.483Zm-97.56 136.338a48.397 48.397 0 0 1-31.105-11.255l1.535-.87 51.67-29.825a8.595 8.595 0 0 0 4.247-7.367v-72.85l21.845 12.636c.218.111.37.32.409.563v60.367c-.056 26.818-21.783 48.545-48.601 48.601Zm-104.466-44.61a48.345 48.345 0 0 1-5.781-32.589l1.534.921 51.722 29.826a8.339 8.339 0 0 0 8.441 0l63.181-36.425v25.221a.87.87 0 0 1-.358.665l-52.335 30.184c-23.257 13.398-52.97 5.431-66.404-17.803ZM23.549 85.38a48.499 48.499 0 0 1 25.58-21.333v61.39a8.288 8.288 0 0 0 4.195 7.316l62.874 36.272-21.845 12.636a.819.819 0 0 1-.767 0L41.353 151.53c-23.211-13.454-31.171-43.144-17.804-66.405v.256Zm179.466 41.695-63.08-36.63L161.73 77.86a.819.819 0 0 1 .768 0l52.233 30.184a48.6 48.6 0 0 1-7.316 87.635v-61.391a8.544 8.544 0 0 0-4.4-7.213Zm21.742-32.69-1.535-.922-51.619-30.081a8.39 8.39 0 0 0-8.492 0L99.98 99.808V74.587a.716.716 0 0 1 .307-.665l52.233-30.133a48.652 48.652 0 0 1 72.236 50.391v.205ZM88.061 139.097l-21.845-12.585a.87.87 0 0 1-.41-.614V65.685a48.652 48.652 0 0 1 79.757-37.346l-1.535.87-51.67 29.825a8.595 8.595 0 0 0-4.246 7.367l-.051 72.697Zm11.868-25.58 28.138-16.217 28.188 16.218v32.434l-28.086 16.218-28.188-16.218-.052-32.434Z"/%3E%3C/svg%3E'
  },
  {
    id: 'o1-mini',
    name: 'o1-mini',
    provider: 'openai',
    description: 'Smallest O1 model for complex tasks',
    maxTokens: 8192,
    thumbnailUrl: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="256" height="260" preserveAspectRatio="xMidYMid" viewBox="0 0 256 260"%3E%3Cpath fill="%2310a37f" d="M239.184 106.203a64.716 64.716 0 0 0-5.576-53.103C219.452 28.459 191 15.784 163.213 21.74A65.586 65.586 0 0 0 52.096 45.22a64.716 64.716 0 0 0-43.23 31.36c-14.31 24.602-11.061 55.634 8.033 76.74a64.665 64.665 0 0 0 5.525 53.102c14.174 24.65 42.644 37.324 70.446 31.36a64.72 64.72 0 0 0 48.754 21.744c28.481.025 53.714-18.361 62.414-45.481a64.767 64.767 0 0 0 43.229-31.36c14.137-24.558 10.875-55.423-8.083-76.483Zm-97.56 136.338a48.397 48.397 0 0 1-31.105-11.255l1.535-.87 51.67-29.825a8.595 8.595 0 0 0 4.247-7.367v-72.85l21.845 12.636c.218.111.37.32.409.563v60.367c-.056 26.818-21.783 48.545-48.601 48.601Zm-104.466-44.61a48.345 48.345 0 0 1-5.781-32.589l1.534.921 51.722 29.826a8.339 8.339 0 0 0 8.441 0l63.181-36.425v25.221a.87.87 0 0 1-.358.665l-52.335 30.184c-23.257 13.398-52.97 5.431-66.404-17.803ZM23.549 85.38a48.499 48.499 0 0 1 25.58-21.333v61.39a8.288 8.288 0 0 0 4.195 7.316l62.874 36.272-21.845 12.636a.819.819 0 0 1-.767 0L41.353 151.53c-23.211-13.454-31.171-43.144-17.804-66.405v.256Zm179.466 41.695-63.08-36.63L161.73 77.86a.819.819 0 0 1 .768 0l52.233 30.184a48.6 48.6 0 0 1-7.316 87.635v-61.391a8.544 8.544 0 0 0-4.4-7.213Zm21.742-32.69-1.535-.922-51.619-30.081a8.39 8.39 0 0 0-8.492 0L99.98 99.808V74.587a.716.716 0 0 1 .307-.665l52.233-30.133a48.652 48.652 0 0 1 72.236 50.391v.205ZM88.061 139.097l-21.845-12.585a.87.87 0 0 1-.41-.614V65.685a48.652 48.652 0 0 1 79.757-37.346l-1.535.87-51.67 29.825a8.595 8.595 0 0 0-4.246 7.367l-.051 72.697Zm11.868-25.58 28.138-16.217 28.188 16.218v32.434l-28.086 16.218-28.188-16.218-.052-32.434Z"/%3E%3C/svg%3E'
  },
  {
    id: 'claude-3-5-sonnet-latest',
    name: 'claude-3-5-sonnet-latest',
    provider: 'anthropic',
    description: 'Anthropic\'s Claude 3.5 Sonnet Latest - Powerful language model with enhanced reasoning',
    maxTokens: 200000,
    thumbnailUrl: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" shape-rendering="geometricPrecision" text-rendering="geometricPrecision" image-rendering="optimizeQuality" fill-rule="evenodd" clip-rule="evenodd" viewBox="0 0 512 512"%3E%3Crect fill="%23CC9B7A" width="512" height="512" rx="104.187" ry="105.042"/%3E%3Cpath fill="%231F1F1E" fill-rule="nonzero" d="M318.663 149.787h-43.368l78.952 212.423 43.368.004-78.952-212.427zm-125.326 0l-78.952 212.427h44.255l15.932-44.608 82.846-.004 16.107 44.612h44.255l-79.126-212.427h-45.317zm-4.251 128.341l26.91-74.701 27.083 74.701h-53.993z"/%3E%3C/svg%3E'
  },
  {
    id: 'claude-3-opus-latest',
    name: 'claude-3-opus-latest',
    provider: 'anthropic',
    description: 'Anthropic\'s Claude 3 Opus Latest - Powerful language model with enhanced reasoning',
    maxTokens: 200000,
    thumbnailUrl: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" shape-rendering="geometricPrecision" text-rendering="geometricPrecision" image-rendering="optimizeQuality" fill-rule="evenodd" clip-rule="evenodd" viewBox="0 0 512 512"%3E%3Crect fill="%23CC9B7A" width="512" height="512" rx="104.187" ry="105.042"/%3E%3Cpath fill="%231F1F1E" fill-rule="nonzero" d="M318.663 149.787h-43.368l78.952 212.423 43.368.004-78.952-212.427zm-125.326 0l-78.952 212.427h44.255l15.932-44.608 82.846-.004 16.107 44.612h44.255l-79.126-212.427h-45.317zm-4.251 128.341l26.91-74.701 27.083 74.701h-53.993z"/%3E%3C/svg%3E'
  },
  {
    id: 'grok-2-1212',
    name: 'grok-2-1212',
    provider: 'xai',
    description: 'Latest Grok model with enhanced capabilities',
    maxTokens: 131072,
    thumbnailUrl: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 841.89 595.28" fill="%234a9eff"%3E%3Cg%3E%3Cpolygon points="557.09,211.99 565.4,538.36 631.96,538.36 640.28,93.18"/%3E%3Cpolygon points="640.28,56.91 538.72,56.91 379.35,284.53 430.13,357.05"/%3E%3Cpolygon points="201.61,538.36 303.17,538.36 353.96,465.84 303.17,393.31"/%3E%3Cpolygon points="201.61,211.99 430.13,538.36 531.69,538.36 303.17,211.99"/%3E%3C/g%3E%3C/svg%3E'
  },
  {
    id: 'grok-2-vision-1212',
    name: 'grok-2-vision-1212',
    provider: 'xai',
    description: 'Latest Grok 2 Vision model with enhanced capabilities',
    maxTokens: 8192,
    thumbnailUrl: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 841.89 595.28" fill="%234a9eff"%3E%3Cg%3E%3Cpolygon points="557.09,211.99 565.4,538.36 631.96,538.36 640.28,93.18"/%3E%3Cpolygon points="640.28,56.91 538.72,56.91 379.35,284.53 430.13,357.05"/%3E%3Cpolygon points="201.61,538.36 303.17,538.36 353.96,465.84 303.17,393.31"/%3E%3Cpolygon points="201.61,211.99 430.13,538.36 531.69,538.36 303.17,211.99"/%3E%3C/g%3E%3C/svg%3E'
  },
  {
    id: 'gemini-2.0-flash-exp',
    name: 'Gemini 2.0 Flash',
    provider: 'google',
    description: 'Next generation features, speed, and multimodal generation for a diverse variety of tasks',
    maxTokens: 1048576,
    thumbnailUrl: googleLogo
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    provider: 'google',
    description: 'Fast and versatile performance across a diverse variety of tasks',
    maxTokens: 1048576,
    thumbnailUrl: googleLogo
  },
  {
    id: 'gemini-1.5-flash-8b',
    name: 'Gemini 1.5 Flash-8B',
    provider: 'google',
    description: 'High volume and lower intelligence tasks',
    maxTokens: 1048576,
    thumbnailUrl: googleLogo
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'google',
    description: 'Complex reasoning tasks requiring more intelligence',
    maxTokens: 2097152,
    thumbnailUrl: googleLogo
  },
  {
    id: 'llama-3.3-70b-versatile',
    name: 'llama-3.3-70b-versatile',
    provider: 'groq',
    description: 'Latest Meta Llama 3.3 70B model optimized for speed by Groq',
    maxTokens: 128000,
    thumbnailUrl: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 32.25 152 55.5" fill="%23805AD5"%3E%3Cpath d="M84.848,34.137c-9.798,0-17.769,7.971-17.769,17.77s7.971,17.769,17.769,17.769s17.77-7.971,17.77-17.769S94.645,34.137,84.848,34.137z M84.848,63.013c-6.124,0-11.106-4.983-11.106-11.106s4.982-11.106,11.106-11.106c6.124,0,11.106,4.982,11.106,11.106S90.973,63.013,84.848,63.013z"/%3E%3Cpath d="M60.315,34.206c-0.607-0.068-1.217-0.104-1.827-0.108c-0.304,0-0.595,0.009-0.893,0.014s-0.594,0.033-0.891,0.051c-1.197,0.094-2.382,0.299-3.541,0.611c-2.329,0.629-4.574,1.723-6.515,3.277c-1.97,1.57-3.548,3.575-4.611,5.859c-0.53,1.138-0.921,2.336-1.165,3.567c-0.121,0.608-0.21,1.222-0.266,1.84c-0.02,0.307-0.055,0.615-0.059,0.921l-0.011,0.459l-0.005,0.23v0.19l0.015,5.951l0.015,5.951l0.041,5.95h6.664l0.042-5.95l0.015-5.952l0.015-5.951v-0.182l0.005-0.142l0.008-0.285c0-0.191,0.028-0.375,0.039-0.564c0.036-0.37,0.091-0.738,0.165-1.102c0.146-0.716,0.374-1.413,0.678-2.077c0.613-1.332,1.528-2.502,2.673-3.419c1.156-0.932,2.541-1.628,4.038-2.042c0.757-0.207,1.532-0.344,2.314-0.408c0.198-0.011,0.395-0.03,0.594-0.037c0.199-0.007,0.402-0.013,0.595-0.012c0.383,0,0.76,0.025,1.142,0.06c1.518,0.153,2.989,0.619,4.318,1.368l3.326-5.776C65.108,35.263,62.753,34.484,60.315,34.206z"/%3E%3Cpath d="M17.77,34.048C7.971,34.048,0,42.019,0,51.817s7.971,17.77,17.77,17.77h5.844v-6.664H17.77c-6.124,0-11.106-4.982-11.106-11.106s4.982-11.106,11.106-11.106s11.132,4.982,11.132,11.106v16.365c0,6.084-4.954,11.039-11.023,11.103c-2.904-0.024-5.681-1.191-7.729-3.25l-4.712,4.712c3.266,3.283,7.691,5.151,12.321,5.201v0.003c0.04,0,0.08,0,0.119,0h0.125v-0.003c9.659-0.131,17.48-8.005,17.525-17.686l0.006-16.881C35.302,41.785,27.422,34.048,17.77,34.048z"/%3E%3Cpath d="M124.083,34.137c-9.798,0-17.769,7.971-17.769,17.77s7.971,17.769,17.769,17.769h6.08v-6.663h-6.08c-6.124,0-11.106-4.983-11.106-11.106s4.982-11.106,11.106-11.106c5.799,0,10.572,4.468,11.062,10.143h-0.01v34.12h6.664V51.907C141.797,42.108,133.881,34.137,124.083,34.137z"/%3E%3C/svg%3E'
  },
  {
    id: 'llama-3.2-90b-vision-preview',
    name: 'llama-3.2-90b-vision-preview',
    provider: 'groq',
    description: 'Latest Meta Llama 3.2 90B model optimized for vision by Groq',
    maxTokens: 128000,
    thumbnailUrl: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 32.25 152 55.5" fill="%23805AD5"%3E%3Cpath d="M84.848,34.137c-9.798,0-17.769,7.971-17.769,17.77s7.971,17.769,17.769,17.769s17.77-7.971,17.77-17.769S94.645,34.137,84.848,34.137z M84.848,63.013c-6.124,0-11.106-4.983-11.106-11.106s4.982-11.106,11.106-11.106c6.124,0,11.106,4.982,11.106,11.106S90.973,63.013,84.848,63.013z"/%3E%3Cpath d="M60.315,34.206c-0.607-0.068-1.217-0.104-1.827-0.108c-0.304,0-0.595,0.009-0.893,0.014s-0.594,0.033-0.891,0.051c-1.197,0.094-2.382,0.299-3.541,0.611c-2.329,0.629-4.574,1.723-6.515,3.277c-1.97,1.57-3.548,3.575-4.611,5.859c-0.53,1.138-0.921,2.336-1.165,3.567c-0.121,0.608-0.21,1.222-0.266,1.84c-0.02,0.307-0.055,0.615-0.059,0.921l-0.011,0.459l-0.005,0.23v0.19l0.015,5.951l0.015,5.951l0.041,5.95h6.664l0.042-5.95l0.015-5.952l0.015-5.951v-0.182l0.005-0.142l0.008-0.285c0-0.191,0.028-0.375,0.039-0.564c0.036-0.37,0.091-0.738,0.165-1.102c0.146-0.716,0.374-1.413,0.678-2.077c0.613-1.332,1.528-2.502,2.673-3.419c1.156-0.932,2.541-1.628,4.038-2.042c0.757-0.207,1.532-0.344,2.314-0.408c0.198-0.011,0.395-0.03,0.594-0.037c0.199-0.007,0.402-0.013,0.595-0.012c0.383,0,0.76,0.025,1.142,0.06c1.518,0.153,2.989,0.619,4.318,1.368l3.326-5.776C65.108,35.263,62.753,34.484,60.315,34.206z"/%3E%3Cpath d="M17.77,34.048C7.971,34.048,0,42.019,0,51.817s7.971,17.77,17.77,17.77h5.844v-6.664H17.77c-6.124,0-11.106-4.982-11.106-11.106s4.982-11.106,11.106-11.106s11.132,4.982,11.132,11.106v16.365c0,6.084-4.954,11.039-11.023,11.103c-2.904-0.024-5.681-1.191-7.729-3.25l-4.712,4.712c3.266,3.283,7.691,5.151,12.321,5.201v0.003c0.04,0,0.08,0,0.119,0h0.125v-0.003c9.659-0.131,17.48-8.005,17.525-17.686l0.006-16.881C35.302,41.785,27.422,34.048,17.77,34.048z"/%3E%3Cpath d="M124.083,34.137c-9.798,0-17.769,7.971-17.769,17.77s7.971,17.769,17.769,17.769h6.08v-6.663h-6.08c-6.124,0-11.106-4.983-11.106-11.106s4.982-11.106,11.106-11.106c5.799,0,10.572,4.468,11.062,10.143h-0.01v34.12h6.664V51.907C141.797,42.108,133.881,34.137,124.083,34.137z"/%3E%3C/svg%3E'
  },
  {
    id: 'meta-llama/llama-3.1-405b',
    name: 'meta-llama/llama-3.1-405b',
    provider: 'openrouter',
    description: 'Most capable Meta Llama 3.1 405B model via OpenRouter',
    maxTokens: 131072,
    thumbnailUrl: 'data:image/svg+xml,%3Csvg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" fill="%23F6AD55" stroke="%23F6AD55"%3E%3Cg clip-path="url(%23clip0_205_3)"%3E%3Cpath d="M3 248.945C18 248.945 76 236 106 219C136 202 136 202 198 158C276.497 102.293 332 120.945 423 120.945" stroke-width="90"/%3E%3Cpath d="M511 121.5L357.25 210.268L357.25 32.7324L511 121.5Z"/%3E%3Cpath d="M0 249C15 249 73 261.945 103 278.945C133 295.945 133 295.945 195 339.945C273.497 395.652 329 377 420 377" stroke-width="90"/%3E%3Cpath d="M508 376.445L354.25 287.678L354.25 465.213L508 376.445Z"/%3E%3C/g%3E%3C/svg%3E'
  },
  {
    id: 'nousresearch/hermes-3-llama-3.1-405b',
    name: 'nousresearch/hermes-3-llama-3.1-405b',
    provider: 'openrouter',
    description: 'Latest Hermes 3 Llama 3.1 405B model via OpenRouter',
    maxTokens: 131072,
    thumbnailUrl: 'data:image/svg+xml,%3Csvg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" fill="%23F6AD55" stroke="%23F6AD55"%3E%3Cg clip-path="url(%23clip0_205_3)"%3E%3Cpath d="M3 248.945C18 248.945 76 236 106 219C136 202 136 202 198 158C276.497 102.293 332 120.945 423 120.945" stroke-width="90"/%3E%3Cpath d="M511 121.5L357.25 210.268L357.25 32.7324L511 121.5Z"/%3E%3Cpath d="M0 249C15 249 73 261.945 103 278.945C133 295.945 133 295.945 195 339.945C273.497 395.652 329 377 420 377" stroke-width="90"/%3E%3Cpath d="M508 376.445L354.25 287.678L354.25 465.213L508 376.445Z"/%3E%3C/g%3E%3C/svg%3E'
  },
  {
    id: 'deepseek/deepseek-chat',
    name: 'deepseek-chat',
    provider: 'openrouter',
    description: 'Latest DeepSeek V3 Chat model via OpenRouter',
    maxTokens: 64000,
    thumbnailUrl: 'data:image/svg+xml,%3Csvg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" fill="%23F6AD55" stroke="%23F6AD55"%3E%3Cg clip-path="url(%23clip0_205_3)"%3E%3Cpath d="M3 248.945C18 248.945 76 236 106 219C136 202 136 202 198 158C276.497 102.293 332 120.945 423 120.945" stroke-width="90"/%3E%3Cpath d="M511 121.5L357.25 210.268L357.25 32.7324L511 121.5Z"/%3E%3Cpath d="M0 249C15 249 73 261.945 103 278.945C133 295.945 133 295.945 195 339.945C273.497 395.652 329 377 420 377" stroke-width="90"/%3E%3Cpath d="M508 376.445L354.25 287.678L354.25 465.213L508 376.445Z"/%3E%3C/g%3E%3C/svg%3E'
  }
];
