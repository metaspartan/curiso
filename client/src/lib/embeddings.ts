import { pipeline, env } from '@huggingface/transformers';
import { useStore } from './store';

class EmbeddingService {
  private static instance: EmbeddingService;
  private model: any;
  private initialized: boolean = false;
  private modelId: string = 'Xenova/bge-base-en-v1.5';

  private constructor() {
    env.useBrowserCache = true;
    
    // Prefer WebGPU if available
    if ('gpu' in navigator) {
      env.backends.onnx.preferredBackend = 'webgpu';
    }
  }

  static getInstance(): EmbeddingService {
    if (!EmbeddingService.instance) {
      EmbeddingService.instance = new EmbeddingService();
    }
    return EmbeddingService.instance;
  }

  async init(onModelStatus: (status: string) => void) {
    if (this.initialized) return;
  
    const store = useStore.getState();
    try {
      useStore.setState({
        settings: {
          ...store.settings,
          rag: { ...store.settings.rag, modelStatus: 'loading' }
        }
      });
  
      onModelStatus('loading');
  
      this.model = await pipeline(
        'feature-extraction',
        this.modelId,
        {
          progress_callback: (progress: any) => {
            console.log("Loading model:", progress);
            onModelStatus('loading');
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
    if (this.modelId === modelId) return;
    this.modelId = modelId;
    this.initialized = false;
    this.model = null;
  }

  async getEmbeddings(text: string): Promise<number[]> {
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