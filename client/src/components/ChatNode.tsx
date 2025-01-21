import { useCallback, useState, useEffect, useRef, useId, memo } from "react";
import { Handle, Position, NodeProps, useReactFlow } from "reactflow";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Trash2, Loader2, Maximize2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AIModel, APIResponseMetrics, CustomModel, Message} from "@/lib/types";
import { availableModels } from "@/lib/remotemodels";
import { cn, isEqual, sanitizeChatMessages } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { Copy, Check } from "lucide-react";
import { NodeResizer } from 'reactflow';
import Anthropic from '@anthropic-ai/sdk';
import { DEFAULT_AI_SETTINGS, AISettings, PRESET_ENDPOINTS } from '@/lib/constants';
import { ImageUpload } from "./ImageUpload";
import logo from "@/assets/logo.svg";
import { RAGService } from "@/lib/rag";
// import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "./ui/context-menu";
import { RAGSelector } from "./RAGSelector";
import { CodeBlock } from "./CodeBlock";
import remarkGfm from 'remark-gfm';
import { countTokens } from "@/lib/toksec";
import { useMetricsStore } from "@/lib/metricstore";
import { processThinkingContent } from "@/lib/utils";
import { ThinkingBlock } from "./ThinkingBlock";

export function ChatNode({ id, data: initialData }: NodeProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>(
    initialData.messages || [],
  );
  const [model, setModel] = useState(initialData.model || "chatgpt-4o-latest");
  const [isLoading, setIsLoading] = useState(false);
  const { settings, setSettings } = useStore();
  const { getNode, getEdges, setNodes } = useReactFlow();
  const { toast } = useToast();
  const [isResizing, setIsResizing] = useState(false);
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({});
  const [imageData, setImageData] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [selectedDocs, setSelectedDocs] = useState<string[]>(
    initialData.selectedDocuments || settings.rag.documents.map(d => d.id)
  );
  const [selectedWebsites, setSelectedWebsites] = useState<string[]>(
    initialData.selectedWebsites || settings.rag.websites?.map(w => w.id) || []
  );

  const copyToClipboard = async (text: string, id: string) => {
    console.log('Attempting to copy text:', text);
    console.log('Using ID:', id);
    try {
      await navigator.clipboard.writeText(text);
      console.log('Copy successful');
      setCopiedStates(prev => ({ ...prev, [id]: true }));
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [id]: false }));
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getContextFromSourceNodes = useCallback(() => {
    const edges = getEdges();
    const contextMessages: Message[] = [];
    const visited = new Set<string>();

    const getMessagesFromNode = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);

      const node = getNode(nodeId);
      if (!node?.data?.messages) return;

      contextMessages.push(...node.data.messages);

      const sourceEdges = edges.filter((edge) => edge.target === nodeId);

      sourceEdges.forEach((edge) => {
        if (edge.source && !visited.has(edge.source)) {
          getMessagesFromNode(edge.source);
        }
      });
    };

    const sourceEdges = edges.filter((edge) => edge.target === id);
    console.log("Source edges for node", id, ":", sourceEdges);

    sourceEdges.forEach((edge) => {
      if (edge.source) {
        console.log("Getting messages from source node:", edge.source);
        const sourceNode = getNode(edge.source);
        console.log("Source node data:", sourceNode?.data);
        getMessagesFromNode(edge.source);
      }
    });

    const sortedMessages = [...contextMessages].sort(
      (a, b) => contextMessages.indexOf(a) - contextMessages.indexOf(b),
    );
    console.log("Final context messages:", sortedMessages);

    return sortedMessages;
  }, [getEdges, getNode, id]);

  // const deleteNode = useCallback(() => {
  //   setSettings({
  //     ...settings,
  //     boards: settings.boards.map(board => 
  //       board.id === settings.currentBoardId
  //         ? {
  //             ...board,
  //             nodes: board.nodes.filter(node => !selectedNodes.some(selected => selected.id === node.id)),
  //             edges: board.edges.filter(edge => 
  //               !selectedNodes.some(node => node.id === edge.source || node.id === edge.target)
  //             )
  //           }
  //         : board
  //     )
  //   });
  //   // delete this node from the current board
  //   setNodes(nodes => nodes.filter(n => n.id !== id));
  // }, [id, settings, setSettings]);

  const { updateMetrics } = useMetricsStore.getState();
  const currentMetrics = useMetricsStore.getState().metrics[model] || {
    totalTokens: 0,
    totalTime: 0,
    inputTokens: 0,
    outputTokens: 0,
    tokensPerSecond: 0,
  };

  const updateMessageWithTokenMetrics = async (inputTok: number, streamedContent: string, startTime: number) => {
    const endTime = performance.now();
    const totalTime = (endTime - startTime) / 1000;
    const tokenCount = await countTokens(streamedContent);
    
    setMessages(prev => {
      return prev.map((message, index) => {
        if (index === prev.length - 1) {
          return {
            ...message,
            content: streamedContent,
            metrics: {
              totalTime,
              totalTokens: tokenCount,
              tokensPerSecond: Math.round(tokenCount / totalTime)
            }
          };
        }
        return message;
      });
    });

    // Count input tokens (including context)
    const inputTokens = inputTok;
    console.log("Input tokens:", inputTokens);
    // Count output tokens
    const outputTokens = await countTokens(streamedContent);
    console.log("Output tokens:", outputTokens);

    updateMetrics(model, {
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      totalTime,
      tokensPerSecond: outputTokens / totalTime
    });
  };

  const getEndpointForModel = (selectedModel: AIModel) => {
    if ('endpoint' in selectedModel) {
      return (selectedModel as CustomModel).endpoint;
    }
    
    return selectedModel.provider === "openai" ? "https://api.openai.com/v1" :
           selectedModel.provider === "xai" ? "https://api.x.ai/v1" :
           selectedModel.provider === "groq" ? "https://api.groq.com/openai/v1" :
           selectedModel.provider === "openrouter" ? "https://openrouter.ai/api/v1" :
           selectedModel.provider === "anthropic" ? "https://api.anthropic.com/v1" :
           selectedModel.provider === "google" ? "https://generativelanguage.googleapis.com/v1beta/openai" :
           "";
  };

  function filterAISettings(settings: Partial<AISettings>) {
    const filteredSettings: Partial<AISettings> = {};
    
    // Only include API-relevant settings
    if (settings.temperature !== DEFAULT_AI_SETTINGS.temperature) {
      filteredSettings.temperature = settings.temperature;
    }
    
    if (settings.top_p !== DEFAULT_AI_SETTINGS.top_p) {
      filteredSettings.top_p = settings.top_p;
    }
  
    if (settings.max_tokens !== DEFAULT_AI_SETTINGS.max_tokens) {
      filteredSettings.max_tokens = settings.max_tokens;
    }
  
    if (settings.frequency_penalty !== DEFAULT_AI_SETTINGS.frequency_penalty) {
      filteredSettings.frequency_penalty = settings.frequency_penalty;
    }
  
    if (settings.presence_penalty !== DEFAULT_AI_SETTINGS.presence_penalty) {
      filteredSettings.presence_penalty = settings.presence_penalty;
    }
    
    return filteredSettings;
  }

  function filterAnthropicAISettings(settings: Partial<AISettings>) {
    const filteredSettings: Record<string, any> = {};
  
    // Anthropic uses top_p instead of topP
    if (settings.top_p !== DEFAULT_AI_SETTINGS.top_p) {
      filteredSettings.top_p = settings.top_p;
    }
  
    // Temperature mapping
    if (settings.temperature !== DEFAULT_AI_SETTINGS.temperature) {
      filteredSettings.temperature = settings.temperature;
    }
    return filteredSettings;
  }

  const getApiKeyForModel = (selectedModel: AIModel | CustomModel) => {
    if ('endpoint' in selectedModel) {
      // For custom models (like Ollama), check if auth is required
      if (!selectedModel.requiresAuth) {
        return "";
      }
      return (selectedModel as CustomModel).apiKey;
    }
    
    // For standard providers, check if API key exists
    if (selectedModel.provider === "openai") {
      return settings.openai?.apiKey || "";
    }
    
    return selectedModel.provider === "xai" ? settings.xai?.apiKey || "" :
           selectedModel.provider === "groq" ? settings.groq?.apiKey || "" :
           selectedModel.provider === "openrouter" ? settings.openrouter?.apiKey || "" :
           selectedModel.provider === "anthropic" ? settings.anthropic?.apiKey || "" :
           selectedModel.provider === "google" ? settings.google?.apiKey || "" :
           "";
  };

  const formatSource = (metadata: any) => {
    console.log("Formatting source:", metadata);
    console.log("Type:", metadata.type);
    if (metadata.type === 'website') {
      return metadata.source;
    }
    return metadata.filename;
  };

  const sendMessage = useCallback(async () => {
    if (!input.trim()) return;

    const startTime = performance.now();
    let metrics: APIResponseMetrics = {};

    const newMessage: Message = {
      role: "user",
      content: input,
      image_url: imageData || undefined
    };

    setMessages((prev) => [...prev, newMessage]);
    setInput("");
    setImageData(null);
    setPreviewImage(null);
    setIsLoading(true);
    setUploadedFileName(null);

    const selectedModel = [...availableModels, ...(settings.customModels || [])].find((m) => m.id === model);
    if (!selectedModel) {
      toast({
        title: "Error",
        description: "Selected model not found",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    const apiKey = getApiKeyForModel(selectedModel);

    // Only check for API key if the model requires authentication
    if ('requiresAuth' in selectedModel && selectedModel.requiresAuth && !apiKey) {
      toast({
        title: "API Key Missing",
        description: `Please set the ${selectedModel.provider.toUpperCase()} API key in settings`,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    let context = '';
    if (settings.rag?.enabled) {
      console.log("RAG enabled, searching for:", input);
      const ragService = new RAGService();
      const relevantDocs = await ragService.search(input, selectedDocs, selectedWebsites);
    
      console.log("Relevant docs, Search results:", relevantDocs);
      
      if (relevantDocs.length > 0) {
        context = relevantDocs
          .map(doc => {
            const metadata = typeof doc.metadata === 'string' 
              ? JSON.parse(doc.metadata) 
              : doc.metadata;
            console.log("Processing metadata:", metadata);
            const source = formatSource(metadata);
            return `[From ${source}]: ${doc.content}`;
          })
          .join('\n\n');
      }
    }

    // Add context to system prompt if available
    const enhancedSystemPrompt = context 
      ? `${settings.systemPrompt}\n\nRelevant context for your response:\n${context}`
      : settings.systemPrompt;

    console.log("Enhanced system prompt:", enhancedSystemPrompt);

    try {
      
      const contextMessages = getContextFromSourceNodes();
      const baseUrl = getEndpointForModel(selectedModel);
  
      const allMessages = [...contextMessages, ...messages, newMessage];
      console.log("Sending all messages to API:", allMessages);
  
      let response;
      let result: any;
  
      if (selectedModel.provider === "anthropic") {
        const anthropic = new Anthropic({
          apiKey: apiKey,
          dangerouslyAllowBrowser: true
        });
      
        if (settings.streaming) {
          try {
            const startTime = performance.now();
            
            // Create empty assistant message first
            const assistantMessage: Message = {
              role: "assistant",
              content: "",
            };
            
            // Add the empty assistant message
            setMessages(prev => [...prev, assistantMessage]);
        
            let streamedContent = "";
            let loadingDots = "";
            let loadingInterval: NodeJS.Timeout;
        
            // Start the loading animation
            loadingInterval = setInterval(() => {
              loadingDots = loadingDots === "⬤" ? "⬤" : "⬤";
              setMessages(prev => {
                return prev.map((message, index) => {
                  if (index === prev.length - 1) {
                    return {
                      ...message,
                      content: streamedContent + loadingDots
                    };
                  }
                  return message;
                });
              });
            }, 500);

            const messagesToSend = sanitizeChatMessages(allMessages.map(msg => ({
              role: msg.role === "user" ? "user" : "assistant",
              content: msg.content
            })))
        
            // Use streamMessages.create() for streaming
            const stream = await anthropic.messages.stream({
              model: model,
              system: enhancedSystemPrompt,
              messages: messagesToSend,
              max_tokens: 8192,
              ...filterAnthropicAISettings(settings),
            });
        
            // Handle the stream
            for await (const chunk of stream) {
              if (chunk.type === 'content_block_delta') {
                const content = chunk.delta.text;
                if (content) {
                  streamedContent += content;
                  setMessages(prev => {
                    return prev.map((message, index) => {
                      if (index === prev.length - 1) {
                        return {
                          ...message,
                          content: streamedContent + loadingDots
                        };
                      }
                      return message;
                    });
                  });
                }
              }
            }
        
            // Clean up loading animation
            clearInterval(loadingInterval);

            const inputTokens = await countTokens(messagesToSend.map(m => m.content).join(" "));

            // Update final message with accurate token metrics
            await updateMessageWithTokenMetrics(inputTokens, streamedContent, startTime);
        
          } catch (error) {
            // Remove the empty assistant message on error
            setMessages(prev => prev.slice(0, -1));
            console.error("Anthropic streaming error:", error);
            // throw error;
          }
        } else {
          const response = await anthropic.messages.create({
            model: model,
            system: enhancedSystemPrompt,
            messages: 
            sanitizeChatMessages(allMessages.map(msg => ({
              role: msg.role === "user" ? "user" : "assistant",
              content: msg.content
            }))),
            max_tokens: 8192,
            ...filterAnthropicAISettings(settings),
          });

          metrics = {
            completion_tokens: response.usage?.output_tokens,
            prompt_tokens: response.usage?.input_tokens,
            total_tokens: response.usage?.input_tokens + response.usage?.output_tokens,
            model: response.model
          };
    
          const endTime = performance.now();
          const totalTime = (endTime - startTime) / 1000;
    
          const assistantMessage: Message = {
            role: "assistant",
            // @ts-ignore anthropic returns content as an array
            content: response.content[0].text,
            metrics: {
              tokensPerSecond: metrics.completion_tokens ? metrics.completion_tokens / totalTime : undefined,
              totalTokens: metrics.completion_tokens,
              totalTime
            }
          };
  
          setMessages((prev) => [...prev, assistantMessage]);
          const newTotalTokens = currentMetrics.totalTokens + (metrics.total_tokens || 0);
          const newTotalTime = currentMetrics.totalTime + totalTime;
          const newTokensPerSecond = newTotalTokens / newTotalTime;

          updateMetrics(model, {
            inputTokens: (metrics?.prompt_tokens || 0) - (metrics?.completion_tokens || 0),
            outputTokens: metrics?.completion_tokens || 0,
            totalTokens: metrics?.total_tokens || 0,
            totalTime,
            tokensPerSecond: newTokensPerSecond
          });
        }
        
      } else {

        const messageContent = imageData
        ? [
            { type: "text", text: input },
            { type: "image_url", image_url: { url: imageData } }
          ]
        : input;

        // Check if using O1 models
        const isO1Model = model.includes('o1-mini') || model.includes('o1') || model.includes('o1-preview');
        const messagesToSend = sanitizeChatMessages([
          ...((!isO1Model && enhancedSystemPrompt) ? [{ role: 'system', content: enhancedSystemPrompt }] : []),
          ...allMessages.slice(0, -1),
          { role: "user", content: messageContent }
        ]).filter(m => m.content);

        if (settings.streaming) {
          try {
            const startTime = performance.now();
        
            // Create empty assistant message first
            const assistantMessage: Message = {
              role: "assistant",
              content: "",
            };
            
            // Add the empty assistant message
            setMessages(prev => [...prev, assistantMessage]);
        
            let streamedContent = "";
            let loadingDots = "";
            let loadingInterval: NodeJS.Timeout;
        
            // Start the loading animation
            loadingInterval = setInterval(() => {
              loadingDots = loadingDots === "⬤" ? "⬤" : "⬤";
              setMessages(prev => {
                const updated = [...prev];
                const lastIndex = updated.length - 1;
                updated[lastIndex] = {
                  ...updated[lastIndex],
                  content: streamedContent + loadingDots
                };
                return updated;
              });
            }, 500);
        
            response = await fetch(`${baseUrl}/chat/completions`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
              },
              body: JSON.stringify({
                model,
                messages: messagesToSend,
                stream: true,
                ...filterAISettings({
                  temperature: settings.temperature,
                  top_p: settings.top_p,
                  max_tokens: settings.max_tokens,
                  frequency_penalty: settings.frequency_penalty,
                  presence_penalty: settings.presence_penalty
                }),
              }),
            });
        
            if (!response.ok) {
              clearInterval(loadingInterval);
              const errorData = await response.text();
              console.error(`API error: ${response.status} - ${errorData}`);
            }
        
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
        
            while (true) {
              const { done, value } = await reader?.read() || {};
              if (done) break;
              
              const chunk = decoder.decode(value, { stream: true });
              const lines = chunk.split("\n");
              
              for (const line of lines) {
                if (line.trim() === "") continue;
                const message = line.replace(/^data: /, "");
                if (message === "[DONE]") break;
                
                try {
                  const parsed = JSON.parse(message);
                  const content = parsed.choices[0].delta.content;
                  if (content) {
                    streamedContent += content;
                    setMessages(prev => {
                      const updated = [...prev];
                      const lastIndex = updated.length - 1;
                      updated[lastIndex] = {
                        ...updated[lastIndex],
                        content: streamedContent + loadingDots
                      };
                      return updated;
                    });
                  }
                } catch (error) {
                  console.error("Error parsing message:", error);
                }
              }
            }
        
            // Clean up loading animation
            clearInterval(loadingInterval);

            const inputTokens = await countTokens(messagesToSend.map(m => m.content).join(" "));
            await updateMessageWithTokenMetrics(inputTokens, streamedContent, startTime);
      
        
          } catch (error) {
            // Remove the empty assistant message on error
            setMessages(prev => prev.slice(0, -1));
            console.error("OpenAI streaming error:", error);
            toast({
              title: "Error",
              description: error instanceof Error ? error.message : "Failed to send message",
              variant: "destructive",
            });
          } finally {
            setIsLoading(false);
          }
        } else {
          
          response = await fetch(`${baseUrl}/chat/completions`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model,              
              messages: messagesToSend,
              ...filterAISettings({
                temperature: settings.temperature,
                top_p: settings.top_p,
                max_tokens: settings.max_tokens,
                frequency_penalty: settings.frequency_penalty,
                presence_penalty: settings.presence_penalty
              }),
            }),
          });
      
          if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`API error: ${response.status} - ${errorData}`);
          }
      
          result = await response.json();
      
          if (!result.choices?.[0]?.message?.content) {
            throw new Error("Invalid response format from API");
          }
      
          metrics = {
            completion_tokens: result.usage?.completion_tokens,
            prompt_tokens: result.usage?.prompt_tokens,
            total_tokens: result.usage?.total_tokens,
            model: result.model
          };
      
          const endTime = performance.now();
          const totalTime = (endTime - startTime) / 1000;
      
          const assistantMessage: Message = {
            role: "assistant",
            content: result.choices[0].message.content,
            metrics: {
              tokensPerSecond: metrics.completion_tokens ? metrics.completion_tokens / totalTime : undefined,
              totalTokens: metrics.completion_tokens,
              totalTime
            }
          };
      
          setMessages((prev) => [...prev, assistantMessage]);

          const newTotalTokens = currentMetrics.totalTokens + (result.usage?.total_tokens || 0);
          const newTotalTime = currentMetrics.totalTime + totalTime;
          const newTokensPerSecond = newTotalTokens / newTotalTime;

          updateMetrics(model, {
            inputTokens: (metrics?.prompt_tokens || 0) - (metrics?.completion_tokens || 0),
            outputTokens: metrics?.completion_tokens || 0,
            totalTokens: metrics?.total_tokens || 0,
            totalTime,
            tokensPerSecond: newTokensPerSecond
          });
        
          setInput("");
          setImageData(null);
          setPreviewImage(null);
          setUploadedFileName(null);
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      });
    } finally {  
      setInput("");
      setPreviewImage(null);
      setImageData(null); 
      setIsLoading(false);
      setUploadedFileName(null);
    }
  }, [input, messages, model, settings, getContextFromSourceNodes, toast]);

  const prevStateRef = useRef({
    messages: messages,
    model: model,
    selectedDocs: selectedDocs,
    selectedWebsites: selectedWebsites
  });
  
  useEffect(() => {
    const currentBoard = settings.boards.find(b => b.id === settings.currentBoardId);
    if (!currentBoard) return;
  
    // Check if the node still exists in the current board
    const nodeExists = currentBoard.nodes.some(node => node.id === id);
    if (!nodeExists) return;
  
    const prevState = prevStateRef.current;
    const hasChanged = 
      !isEqual(prevState.messages, messages) ||
      prevState.model !== model ||
      !isEqual(prevState.selectedDocs, selectedDocs) ||
      !isEqual(prevState.selectedWebsites, selectedWebsites);
  
    if (hasChanged) {
      prevStateRef.current = {
        messages,
        model,
        selectedDocs,
        selectedWebsites
      };
  
      useStore.setState(state => ({
        settings: {
          ...state.settings,
          boards: state.settings.boards.map(board => 
            board.id === state.settings.currentBoardId
              ? {
                  ...board,
                  nodes: board.nodes.map(node => 
                    node.id === id
                      ? { 
                          ...node, 
                          data: { 
                            ...node.data, 
                            messages, 
                            model,
                            selectedDocuments: selectedDocs,
                            selectedWebsites: selectedWebsites 
                          } 
                        }
                      : node
                  )
                }
              : board
          )
        }
      }));
    }
  }, [id, messages, model, selectedDocs, selectedWebsites, settings.currentBoardId]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    textarea.style.height = '40px';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [input, adjustTextareaHeight]);

  const currentModel = [...availableModels, ...(settings.customModels || [])].find((m) => m.id === model);

  const getNodeTitle = useCallback(() => {
    if (messages.length === 0) return "Chat Node";
    const firstMessage = messages[0].content;
    // Take first 20 chars or up to the first newline
    const preview = firstMessage.split('\n')[0].slice(0, 20);
    return preview + (preview.length < firstMessage.length ? '...' : '');
  }, [messages]);

  return (<>
    <NodeResizer 
      minWidth={400}
      minHeight={100}
      isVisible={isResizing}
      lineClassName="border-primary"
      handleClassName="h-3 w-3 bg-primary border-2 rounded"
    />
    <Card className="w-[650px] bg-card" style={{minWidth: '100%',
      width: '650px'}}>
      <CardHeader className="flex flex-row items-center p-2 pb-0">
        <div className="flex-1 flex items-center">
          <Handle
            type="target"
            position={Position.Left}
            className="!left-[15px] !top-[13px] w-4 h-4 !border-2"
            style={{ transform: 'none', top: '13px', left: '15px' }}
          />
          <span className="font-semibold ml-8">{getNodeTitle()}</span>
          <Handle
            type="source"
            position={Position.Right}
            className="!right-[15px] !top-[21px] w-4 h-4 !border-2"
            style={{ transform: 'none !important', top: '21px', right: '15px', left: 'none !important' }}
          />
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <div className="space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`${
              msg.role === "user"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            } p-3 rounded-lg relative group`}
          >
            <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 hover:bg-muted/50"
                onClick={() => copyToClipboard(msg.content, `message-${i}`)}
              >
                {copiedStates[`message-${i}`] ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
              {msg.image_url && (
                <img 
                  src={msg.image_url} 
                  alt="Uploaded" 
                  className="max-w-sm rounded-md"
                />
              )}
              {msg.content && (() => {
  const { blocks, processedContent } = processThinkingContent(msg.content);
  return (
    <>
      {blocks.map((block) => 
        block.type === 'thinking' ? (
          <ThinkingBlock key={block.key}>
            <ReactMarkdown 
            components={{
              code: CodeBlock as any,
              pre: ({ children }) => <pre className="p-0 m-0" onClick={e => e.stopPropagation()}>{children}</pre>,
              h1: ({ children }) => <h1 className="text-2xl font-bold mb-2">{children}</h1>,
              h2: ({ children }) => <h2 className="text-xl font-bold mb-2">{children}</h2>,
              h3: ({ children }) => <h3 className="text-lg font-bold mb-2">{children}</h3>,
              h4: ({ children }) => <h4 className="text-base font-bold mb-2">{children}</h4>,
              p: ({ children }) => <p className="mt-1 mb-2">{children}</p>,
              ul: ({ children }) => <ul className="list-disc list-inside mb-4">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal list-inside mb-4">{children}</ol>,
              li: ({ children }) => <li className="mb-2">{children}</li>,
              a: ({ href, children }) => (
                <a href={href} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                  {children}
                </a>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-primary pl-4 italic mb-4">
                  {children}
                </blockquote>
              ),
              img: ({ src, alt }) => (
                <img src={src} alt={alt} className="max-w-full h-auto rounded-lg mb-4" />
              ),
              table: ({ children }) => (
                <div className="overflow-x-auto mb-4">
                  <table className="min-w-full divide-y divide-border">
                    {children}
                  </table>
                </div>
              ),
              th: ({ children }) => (
                <th className="px-4 py-2 bg-muted font-medium">{children}</th>
              ),
              td: ({ children }) => (
                <td className="px-4 py-2 border-t">{children}</td>
              ),
            }}
            remarkPlugins={[remarkGfm]}>
              {block.content}
            </ReactMarkdown>
          </ThinkingBlock>
        ) : null
      )}
<ReactMarkdown
  components={{
    code: CodeBlock as any,
    pre: ({ children }) => <pre className="p-0 m-0" onClick={e => e.stopPropagation()}>{children}</pre>,
    h1: ({ children }) => <h1 className="text-2xl font-bold mb-2">{children}</h1>,
    h2: ({ children }) => <h2 className="text-xl font-bold mb-2">{children}</h2>,
    h3: ({ children }) => <h3 className="text-lg font-bold mb-2">{children}</h3>,
    h4: ({ children }) => <h4 className="text-base font-bold mb-2">{children}</h4>,
    p: ({ children }) => <p className="mt-1 mb-2">{children}</p>,
    ul: ({ children }) => <ul className="list-disc list-inside mb-4">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal list-inside mb-4">{children}</ol>,
    li: ({ children }) => <li className="mb-2">{children}</li>,
    a: ({ href, children }) => (
      <a href={href} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-primary pl-4 italic mb-4">
        {children}
      </blockquote>
    ),
    img: ({ src, alt }) => (
      <img src={src} alt={alt} className="max-w-full h-auto rounded-lg mb-4" />
    ),
    table: ({ children }) => (
      <div className="overflow-x-auto mb-4">
        <table className="min-w-full divide-y divide-border">
          {children}
        </table>
      </div>
    ),
    th: ({ children }) => (
      <th className="px-4 py-2 bg-muted font-medium">{children}</th>
    ),
    td: ({ children }) => (
      <td className="px-4 py-2 border-t">{children}</td>
    ),
  }}
  remarkPlugins={[remarkGfm]}
>
  {processedContent}
  </ReactMarkdown>
    </>
  );
})()}
              {msg.role === "assistant" && msg.metrics && (
                <div className="text-xs text-gray-500 mt-1">
                  {msg.metrics.totalTokens && `${msg.metrics.totalTokens} tokens`}
                  {msg.metrics.tokensPerSecond && ` · ${msg.metrics.tokensPerSecond.toFixed(1)} tok/s`}
                  {msg.metrics.totalTime && ` · ${msg.metrics.totalTime.toFixed(2)}s`}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
      {settings.rag?.enabled && (
        <div className="px-4 pb-2">
          <RAGSelector
            selectedDocs={selectedDocs}
            selectedWebsites={selectedWebsites}
            onDocsChange={setSelectedDocs}
            onWebsitesChange={setSelectedWebsites}
          />
        </div>
      )}
      <CardFooter className="p-2 pt-0 gap-2 flex-col">
        <div className="flex w-full gap-2">

          <div className="flex gap-2">
          <ImageUpload onImageSelect={(data) => {
          console.log("Image selected:", data ? "data received" : "no data"); // Debug log
          setImageData(data);
          setPreviewImage(data);
        }} />
          </div>
          <div className="relative flex-1">

          {previewImage && (
            <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
              <img src={previewImage} alt="Preview" className="h-20 w-20 rounded object-cover" />
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => {
                  setImageData(null);
                  setPreviewImage(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              adjustTextareaHeight();
            }}
            placeholder="Type a message..."
            className="resize-none pr-10 min-h-[40px]"
            style={{
              paddingTop: '8px',
              paddingBottom: '8px'
            }}
            disabled={isLoading}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (e.shiftKey) {
                  e.preventDefault();
                  setInput(prev => prev + '\n');
                  return;
                }
                e.preventDefault();
                sendMessage();
                if (previewImage) {
                  setPreviewImage(null);
                }
              }
            }}
          />
            <Button 
              size="icon" 
              onClick={() => {
                sendMessage();
                if (previewImage) {
                  setPreviewImage(null);
                }
              }} 
              disabled={isLoading}
              className="absolute right-1 bottom-1 h-8 w-8 rounded-sm"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="flex w-full justify-between items-center">
          <Select value={model}   
          onValueChange={(value) => {
            setModel(value);
            setSettings({ ...settings, lastSelectedModel: value });
          }}>
            <SelectTrigger className="w-[340px] h-8">
              <SelectValue placeholder="Select model">
                <div className="flex items-center gap-2">
                <img 
                    src={
                      currentModel && 'endpoint' in currentModel 
                        ? PRESET_ENDPOINTS.find(p => p.url === currentModel.endpoint)?.icon || currentModel.thumbnailUrl || logo
                        : currentModel?.thumbnailUrl || logo
                    } 
                    alt={currentModel?.name} 
                    className="w-4 h-4" 
                  />
                  <span className="text-xs">{currentModel?.name}</span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
            {[...availableModels, ...(settings.customModels || [])].map((m) => (
              <SelectItem key={m.id} value={m.id}>
                <div className="flex items-center gap-2">
                  <img 
                    src={
                      'endpoint' in m 
                        ? PRESET_ENDPOINTS.find(p => p.url === m.endpoint)?.icon || m.thumbnailUrl || logo
                        : m.thumbnailUrl || logo
                    } 
                    alt={m.name} 
                    className="w-4 h-4" 
                  />
                  <span>{m.name}</span>
                  {'endpoint' in m && <span className="text-xs text-muted-foreground">(Custom)</span>}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
          </Select>
          <div className="flex gap-1">
          {/* <Button
            variant="ghost"
            size="sm"
            onClick={deleteNode}
            className="h-8"
          >
            <Trash2 className="h-4 w-4" />
          </Button> */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsResizing(!isResizing)}
            className="h-8"
          >
            <Maximize2 className={cn("h-4 w-4", isResizing && "text-primary")} />
          </Button>
        </div>
        </div>
      </CardFooter>
    </Card>
    </>);
}
