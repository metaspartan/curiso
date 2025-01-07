import { pipeline, env } from '@huggingface/transformers';
import { useStore } from './store';

class EmbeddingService {
  private static instance: EmbeddingService;
  private model: any;
  private initialized: boolean = false;
  private modelId: string = 'Xenova/bge-base-en-v1.5';
  private isApiModel: boolean = false;
  private device: string = 'auto';
  private dtype: string = 'fp32';

  private constructor() {
    env.useBrowserCache = true;
    
    // // Prefer WebGPU if available
    // if ('gpu' in navigator) {
    // //   env.backends.onnx.preferredBackend = 'webgpu';
    // }
  }

  static getInstance(): EmbeddingService {
    if (!EmbeddingService.instance) {
      EmbeddingService.instance = new EmbeddingService();
    }
    return EmbeddingService.instance;
  }

  async init(onModelStatus: (status: string, progress?: number) => void) {
    if (this.initialized) return;

    if (this.isApiModel) {
        // Check for API key
        const settings = useStore.getState().settings;
        if (!settings.openai.apiKey) {
          throw new Error('OpenAI API key required for this model');
        }
        this.initialized = true;
        return;
    }
  
    const store = useStore.getState();
    try {
      useStore.setState({
        settings: {
          ...store.settings,
          rag: { ...store.settings.rag, modelStatus: 'loading' }
        }
      });
  
      onModelStatus('loading', 0);
  
      this.model = await pipeline(
        'feature-extraction',
        this.modelId,
        {
          device: this.device as any,
          dtype: this.dtype as any,
          progress_callback: (progress: any) => {
            console.log("Loading model:", progress);
            console.log("Loading model progress.progress:", Math.round(progress.progress));
            // if NaN set to 100
            // const progressPercentage = isNaN(progress.progress) ? 100 : Math.round(progress.progress);
            onModelStatus('loading', Math.round(progress.progress));
          }
        }
      );
      
      this.initialized = true;
      useStore.setState({
        settings: {
          ...store.settings,
          rag: { ...store.settings.rag, modelStatus: 'loaded' }
        }
      });
  
      onModelStatus('loaded');
    } catch (error) {
      console.error("Failed to initialize embedding model:", error);
      useStore.setState({
        settings: {
          ...store.settings,
          rag: { 
            ...store.settings.rag, 
            modelStatus: 'error',
            modelError: (error as Error).message 
          }
        }
      });
      onModelStatus('error');
      throw error;
    }
  }

  async setModel(modelId: string) {
    this.modelId = modelId;
    this.isApiModel = modelId.startsWith('text-embedding-3');
    this.initialized = false;
    
    if (!this.isApiModel) {
      this.model = null;
    }
  }

  async unload() {
    if (this.model) {
      // @ts-ignore - transformers.js doesn't expose types for dispose
      console.log('Unloading Embedding Model:', this.modelId);
      if (this.model.dispose) {
        await this.model.dispose();

        // Clear from Cache Storage
        const cacheKeys = await caches.keys();
        for (const key of cacheKeys) {
          if (key.includes('transformers') || key.includes(this.modelId)) {
            await caches.delete(key);
            console.log('Cleared cache:', key);
          }
        }

        if (globalThis.gc) {
          globalThis.gc();
        }
        console.log('Embedding Model unloaded');
      }
      this.model = null;
    }
    this.initialized = false;
  }

  async inspectCache() {
    try {
      const cacheKeys = await caches.keys();
      console.log('Available caches:', cacheKeys);
      
      for (const key of cacheKeys) {
        const cache = await caches.open(key);
        const requests = await cache.keys();
        console.log(`Cache "${key}" contents:`, requests.map(req => req.url));
      }
    } catch (error) {
      console.error('Error inspecting cache:', error);
    }
  }

  async getEmbeddings(text: string): Promise<number[]> {
    if (this.isApiModel) {
      console.log('Using OpenAI API for embeddings');
      return this.getOpenAIEmbeddings(text);
    }
    console.log('Using Local Embedding Model for embeddings');
    return this.getLocalEmbeddings(text);
  }

  private async getOpenAIEmbeddings(text: string): Promise<number[]> {
    const settings = useStore.getState().settings;
    if (!settings.openai.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.openai.apiKey}`
      },
      body: JSON.stringify({
        input: text,
        model: this.modelId
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  }

  private async getLocalEmbeddings(text: string): Promise<number[]> {
    console.log('Generating embeddings for text:', text);
    let onModelStatus = (status: string) => {
      console.log('Model status:', status);
    };
    if (!this.initialized) {
      await this.init(onModelStatus);
    }

    const output = await this.model(text, {
      pooling: 'mean',
      normalize: true
    });

    const embeddings = Array.from(output.data);
    console.log('Generated Embeddings:', embeddings);
    return embeddings as number[];
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}

export const embeddingService = EmbeddingService.getInstance();