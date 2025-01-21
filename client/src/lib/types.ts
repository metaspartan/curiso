import { Edge } from "reactflow";
import { Node as ReactFlowNode } from 'reactflow';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  image_url?: string;
  metrics?: {
    tokensPerSecond?: number;
    timeToFirstToken?: number;
    totalTokens?: number;
    totalTime?: number;
  };
}

export interface HotkeySettings {
  newNode: string;
  newBoard: string;
  dNode: string;
  deleteBoard: string;
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
  modelProgress?: number;
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
  hotkeys: HotkeySettings;
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
  streaming: boolean;
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
  selectedDocuments?: string[]; // Array of document IDs selected for this node
  selectedWebsites?: string[]; // Array of website IDs selected for this node
}