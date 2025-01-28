import { AIModel, Message } from "./types";
import googleLogo from '@/assets/google-logo.svg'
import deepseekLogo from '@/assets/deepseek-logo.svg'
import openaiLogo from '@/assets/openai-logo.svg'
import anthropicLogo from '@/assets/anthropic-logo.svg'
import groqLogo from '@/assets/groq-logo.svg'
import openrouterLogo from '@/assets/openrouter-logo.svg'
import xaiLogo from '@/assets/xai-logo.svg'
  
export const availableModels: AIModel[] = [
  {
    id: 'deepseek-reasoner',
    name: 'deepseek-reasoner',
    provider: 'deepseek',
    description: 'DeepSeek Reasoner (Deepseek-R1) is a large language model with advanced reasoning capabilities',
    maxTokens: 8192,
    thumbnailUrl: deepseekLogo,
  },
  {
    id: 'deepseek-chat',
    name: 'deepseek-chat',
    provider: 'deepseek',
    description: 'DeepSeek V3 Chat is a large language model with advanced capabilities',
    maxTokens: 8192,
    thumbnailUrl: deepseekLogo,
  },
  // {
  //   id: 'sonar-pro',
  //   name: 'perplexity-sonar-pro',
  //   provider: 'perplexity',
  //   description: 'Perplexity Sonar Pro - Most advanced model with web search capabilities',
  //   maxTokens: 8192,
  //   thumbnailUrl: TODO
  // },
  // {
  //   id: 'sonar',
  //   name: 'perplexity-sonar',
  //   provider: 'perplexity',
  //   description: 'Perplexity Sonar - Advanced model with web search capabilities',
  //   maxTokens: 8192,
  //   thumbnailUrl: TODO
  // },
  {
      id: 'chatgpt-4o-latest',
      name: 'chatgpt-4o-latest',
      provider: 'openai',
      description: 'Latest most capable GPT 4o model for complex tasks',
      maxTokens: 8192,
      thumbnailUrl: openaiLogo
  },
  {
      id: 'gpt-4o',
      name: 'gpt-4o',
      provider: 'openai',
      description: 'Most capable GPT 4o model for complex tasks',
      maxTokens: 8192,
      thumbnailUrl: openaiLogo
  },
  {
      id: 'gpt-4o-mini',
      name: 'gpt-4o-mini',
      provider: 'openai',
      description: 'Smallest GPT 4o model for complex tasks',
      maxTokens: 8192,
      thumbnailUrl: openaiLogo
  },
  {
      id: 'o1-mini',
      name: 'o1-mini',
      provider: 'openai',
      description: 'Smallest O1 model for complex tasks',
      maxTokens: 8192,
      thumbnailUrl: openaiLogo
  },
  {
      id: 'o1',
      name: 'o1',
      provider: 'openai',
      description: 'OpenAI\'s O1 model for complex tasks',
      maxTokens: 8192,
      thumbnailUrl: openaiLogo
  },
  {
      id: 'claude-3-5-sonnet-latest',
      name: 'claude-3-5-sonnet-latest',
      provider: 'anthropic',
      description: 'Anthropic\'s Claude 3.5 Sonnet Latest - Powerful language model with enhanced reasoning',
      maxTokens: 200000,
      thumbnailUrl: anthropicLogo
  },
  {
      id: 'claude-3-opus-latest',
      name: 'claude-3-opus-latest',
      provider: 'anthropic',
      description: 'Anthropic\'s Claude 3 Opus Latest - Powerful language model with enhanced reasoning',
      maxTokens: 200000,
      thumbnailUrl: anthropicLogo
  },
  {
      id: 'grok-2-1212',
      name: 'grok-2-1212',
      provider: 'xai',
      description: 'Latest Grok model with enhanced capabilities',
      maxTokens: 131072,
      thumbnailUrl: xaiLogo
  },
  {
      id: 'grok-2-vision-1212',
      name: 'grok-2-vision-1212',
      provider: 'xai',
      description: 'Latest Grok 2 Vision model with enhanced capabilities',
      maxTokens: 8192,
      thumbnailUrl: xaiLogo
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
      thumbnailUrl: groqLogo
  },
  {
      id: 'llama-3.2-90b-vision-preview',
      name: 'llama-3.2-90b-vision-preview',
      provider: 'groq',
      description: 'Latest Meta Llama 3.2 90B model optimized for vision by Groq',
      maxTokens: 128000,
      thumbnailUrl: groqLogo
  },
  {
    id: 'deepseek-r1-distill-llama-70b',
    name: 'deepseek-r1-distill-llama-70b',
    provider: 'groq',
    description: 'Latest DeepSeek R1 Distill Llama 70B model',
    maxTokens: 128000,
    thumbnailUrl: groqLogo
  },
  {
      id: 'meta-llama/llama-3.1-405b',
      name: 'meta-llama/llama-3.1-405b',
      provider: 'openrouter',
      description: 'Most capable Meta Llama 3.1 405B model via OpenRouter',
      maxTokens: 131072,
      thumbnailUrl: openrouterLogo
  },
  {
      id: 'nousresearch/hermes-3-llama-3.1-405b',
      name: 'nousresearch/hermes-3-llama-3.1-405b',
      provider: 'openrouter',
      description: 'Latest Hermes 3 Llama 3.1 405B model via OpenRouter',
      maxTokens: 131072,
      thumbnailUrl: openrouterLogo
  },
  {
      id: 'deepseek/deepseek-chat',
      name: 'deepseek-chat',
      provider: 'openrouter',
      description: 'Latest DeepSeek V3 Chat model via OpenRouter',
      maxTokens: 64000,
      thumbnailUrl: openrouterLogo
  },
  {
      id: 'deepseek/deepseek-r1',
      name: 'deepseek-r1',
      provider: 'openrouter',
      description: 'Latest DeepSeek R1 model via OpenRouter',
      maxTokens: 64000,
      thumbnailUrl: openrouterLogo
  }
];