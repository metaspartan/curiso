import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { Input } from "./ui/input";
import { Slider } from "./ui/slider";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "./ui/select";
import { Progress } from "./ui/progress";
import { RAGService } from "@/lib/rag";
import { Trash2, Upload } from "lucide-react";
import { embeddingService } from "@/lib/embeddings";
import { cn } from "@/lib/utils";

interface EmbeddingProgress {
  status: 'idle' | 'loading' | 'chunking' | 'embedding' | 'complete' | 'error';
  currentChunk: number;
  totalChunks: number;
  modelStatus?: string;
}

const EMBEDDING_MODELS = [
  { id: 'Xenova/bge-base-en-v1.5', name: 'BGE Base', size: '110MB' },
  { id: 'Xenova/bge-small-en-v1.5', name: 'BGE Small', size: '50MB' },
  { id: 'Xenova/bge-large-en-v1.5', name: 'BGE Large', size: '330MB' }
];

export function RAGManager() {
  const { settings, setSettings } = useStore();
  const [progress, setProgress] = useState<Record<string, EmbeddingProgress>>({});
  const [isUploading, setIsUploading] = useState(false);
  const ragService = new RAGService();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadingDocs, setUploadingDocs] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
  
    const docId = crypto.randomUUID();
    setIsUploading(true);
    setUploadingDocs(prev => [...prev, docId]);
    setProgress(prev => ({ ...prev, [docId]: { status: 'loading', modelStatus: 'Initializing...', currentChunk: 0, totalChunks: 0 } }));
  
    try {
      await ragService.addDocument(file, {
        id: docId,
        filename: file.name,
        dateAdded: new Date().toISOString(),
        size: file.size,
        mimeType: file.type
      }, {
        onChunk: (current, total) => {
          setProgress(prev => ({
            ...prev,
            [docId]: { 
              status: 'embedding',
              currentChunk: current,
              totalChunks: total,
              modelStatus: `Processing chunk ${current}/${total}`
            }
          }));
        },
        onModelStatus: (status) => {
          setProgress(prev => ({
            ...prev,
            [docId]: { 
              ...prev[docId],
              modelStatus: status,
              status: status.includes('Chunking') ? 'chunking' : prev[docId].status
            }
          }));
        }
      });
  
      setSettings({
        ...settings,
        rag: {
          ...settings.rag,
          documents: [
            ...settings.rag.documents,
            {
              id: docId,
              filename: file.name,
              timestamp: new Date().toISOString(),
              size: file.size,
              chunks: []
            }
          ]
        }
      });
  
      setProgress(prev => ({
        ...prev,
        [docId]: { status: 'complete', modelStatus: 'Processing complete', currentChunk: 0, totalChunks: 0 }
      }));
  
    } catch (error) {
      console.error('Error processing file:', error);
      setProgress(prev => ({
        ...prev,
        [docId]: { status: 'error', modelStatus: 'Error processing document', currentChunk: 0, totalChunks: 0 }
      }));
    } finally {
      setIsUploading(false);
      setUploadingDocs(prev => prev.filter(id => id !== docId));
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  const handleModelChange = async (modelId: string) => {
    try {
      // Update UI immediately
      useStore.setState({
        settings: {
          ...settings,
          rag: {
            ...settings.rag,
            embeddingModel: modelId,
            modelStatus: 'loading'
          }
        }
      });
      
      await embeddingService.setModel(modelId);
      await embeddingService.init(status => {
        useStore.setState({
          settings: {
            ...settings,
            rag: {
              ...settings.rag,
              embeddingModel: modelId,
              modelStatus: status as 'loading' | 'error' | 'unloaded' | 'loaded'
            }
          }
        });
      });
    } catch (error) {
      console.error('Error changing model:', error);
      useStore.setState({
        settings: {
          ...settings,
          rag: {
            ...settings.rag,
            modelStatus: 'error',
            modelError: (error as Error).message
          }
        }
      });
    }
  };

  useEffect(() => {
    if (settings.rag.enabled && !embeddingService.isInitialized()) {
      handleModelChange(settings.rag.embeddingModel || EMBEDDING_MODELS[0].id);
    } else if (!settings.rag.enabled) {
      embeddingService.setModel('');
      setSettings({
        ...settings,
        rag: {
          ...settings.rag,
          modelStatus: 'unloaded'
        }
      });
    }
  }, [settings.rag.enabled]);

  const removeDocument = async (docId: string) => {
    await ragService.removeDocument(docId);
    setSettings({
      ...settings,
      rag: {
        ...settings.rag,
        documents: settings.rag.documents.filter(doc => doc.id !== docId)
      }
    });
  };

  const removeWebsite = async (siteId: string) => {
    await ragService.removeWebsite(siteId);
    setSettings({
      ...settings,
      rag: {
        ...settings.rag,
        websites: (settings.rag.websites || []).filter(site => site.id !== siteId)
      }
    });
  };

  const handleAddWebsite = async () => {
    if (!urlInput) return;
    
    const tempId = crypto.randomUUID();
    setIsUploading(true);
    setUploadingDocs(prev => [...prev, tempId]);
    setProgress(prev => ({ 
      ...prev, 
      [tempId]: { 
        status: 'loading', 
        modelStatus: 'Initializing...', 
        currentChunk: 0, 
        totalChunks: 0 
      } 
    }));
  
    try {
      const { documentId, metadata } = await ragService.addWebsite(urlInput, {
        onChunk: (current, total) => {
          setProgress(prev => ({
            ...prev,
            [tempId]: { ...prev[tempId], currentChunk: current, totalChunks: total }
          }));
        },
        onModelStatus: (status) => {
          setProgress(prev => ({
            ...prev,
            [tempId]: { ...prev[tempId], modelStatus: status }
          }));
        }
      });
  
      setSettings({
        ...settings,
        rag: {
          ...settings.rag,
          websites: [...(settings.rag.websites || []), metadata]
        }
      });
      
      // Update progress with the actual documentId
      setProgress(prev => {
        const { [tempId]: tempProgress, ...rest } = prev;
        return {
          ...rest,
          [documentId]: { 
            status: 'complete',
            modelStatus: 'Complete',
            currentChunk: 0,
            totalChunks: 0
          }
        };
      });
      
      setUrlInput('');
    } catch (error) {
      console.error('Failed to add website:', error);
    } finally {
      setIsUploading(false);
      setUploadingDocs(prev => prev.filter(id => id !== tempId));
    }
  };

  return (
    <div className="space-y-6">
                <p className="text-sm text-muted-foreground">
                  Enable RAG to use documents and websites for context in conversations.
                </p>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">RAG Enabled</h3>
        <Switch 
          checked={settings.rag.enabled}
          onCheckedChange={(checked) => 
            setSettings({
              ...settings,  
              rag: { ...settings.rag, enabled: checked }
            })
          }
        />
      </div>

      <div className="space-y-4">
  <div className="flex items-center justify-between">
    <div className="flex-1">
      <h4 className="text-md font-medium">Embedding Model</h4>
      <p className="text-sm text-muted-foreground">Select the model to use for embeddings</p>
    </div>
    <div className={cn(
      "text-xs px-2 py-1 rounded-full inline-flex items-center gap-1.5",
      settings.rag.modelStatus === 'loaded' ? "bg-green-500/20 text-green-600" :
      settings.rag.modelStatus === 'loading' ? "bg-yellow-500/20 text-yellow-600" :
      settings.rag.modelStatus === 'error' ? "bg-red-500/20 text-red-600" :
      "bg-gray-500/20 text-gray-600"
    )}>
      {settings.rag.modelStatus === 'loaded' ? 'Model Ready' :
      settings.rag.modelStatus === 'loading' ? (
        <>
          Loading Model
          <svg className="animate-spin h-3 w-3 inline ml-0.5" viewBox="0 0 24 24">
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
              fill="none"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </>
      ) :
      settings.rag.modelStatus === 'error' ? 'Error Loading Model' :
      'Not Loaded'}
    </div>
  </div>

  <Select
    value={settings.rag.embeddingModel || EMBEDDING_MODELS[0].id}
    onValueChange={handleModelChange}
  >
    <SelectTrigger>
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      {EMBEDDING_MODELS.map(model => (
        <SelectItem key={model.id} value={model.id}>
          {model.name} ({model.size})
        </SelectItem>
      ))}
    </SelectContent>
  </Select>


      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Similarity Threshold</label>
          <Slider 
            value={[settings.rag.similarityThreshold]}
            min={0}
            max={1}
            step={0.1}
            onValueChange={([value]) => 
              setSettings({
                ...settings,
                rag: { ...settings.rag, similarityThreshold: value }
              })
            }
          />
        </div>

        <div>
          <label className="text-sm font-medium">Documents & Websites</label>
          <div className="mt-2">
          <div className="flex gap-2">
            <Input
              type="url"
              placeholder="Enter website URL"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              disabled={isUploading}
            />
            <Button 
              onClick={handleAddWebsite}
              disabled={isUploading || !urlInput}
            >
              Add Website
            </Button>
          </div>
          
        
          
          <Input
            type="file"
            ref={inputRef}
            onChange={handleFileUpload}
            accept=".pdf"
            disabled={isUploading}
            className="mt-4"
          />
        </div>
          <div className="mt-2 mb-2 h-[150px] overflow-y-auto space-y-2">
             {/* Show uploading documents */}
              {uploadingDocs.map(docId => (
                <div key={docId} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex-1">
                    <p className="text-sm">Uploading...</p>
                    {progress[docId] && (
                      <div className="mt-2">
                        <Progress 
                          value={
                            progress[docId].status === 'embedding'
                              ? (progress[docId].currentChunk / progress[docId].totalChunks) * 100
                              : progress[docId].status === 'loading'
                              ? 20
                              : progress[docId].status === 'chunking'
                              ? 40
                              : 0
                          }
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {progress[docId].status === 'loading' && 'Loading model...'}
                          {progress[docId].status === 'chunking' && 'Chunking document...'}
                          {/* {progress[docId].status === 'embedding' && (
                            `Embedding chunks (${progress[docId].currentChunk}/${progress[docId].totalChunks})`
                          )} */}
                          <span className="block text-primary">{progress[docId].modelStatus}</span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            {settings.rag.documents.map(doc => (
              <div key={doc.id} className="flex items-center justify-between p-2 border rounded">
                <div className="flex-1">
                  <p className="text-sm">{doc.filename}</p>
                  <p className="text-xs text-gray-500">
                    Added {new Date(doc.timestamp).toLocaleDateString()}
                  </p>                  
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => removeDocument(doc.id)}
                  // disabled={progress[doc.id]?.status !== 'complete'}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

          {settings.rag.websites?.map(site => (
            <div key={site.id} className="flex items-center justify-between p-2 border rounded">
              <div className="flex-1">
                <p className="text-sm">{site.title || site.url}</p>
                <p className="text-xs text-gray-500">
                  {site.url} - Added {new Date(site.dateScraped).toLocaleDateString()}
                </p>
              </div>
              <Button
                variant="destructive"
                size="icon"
                onClick={() => removeWebsite(site.id)}
                // disabled={progress[site.id]?.status !== 'complete'}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}