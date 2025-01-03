import { useCallback, useState, useEffect, useRef } from "react";
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
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AIModel, CustomModel, Message, availableModels } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { Copy, Check } from "lucide-react";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { NodeResizer } from 'reactflow';
import Anthropic from '@anthropic-ai/sdk';
import { DEFAULT_AI_SETTINGS, AISettings, PRESET_ENDPOINTS } from '@/lib/constants';
import { ImageUpload } from "./ImageUpload";
import logo from "@/assets/logo.svg";

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

  const copyToClipboard = async (text: string, id: string) => {
    // console.log('Attempting to copy text:', text);
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

  const deleteNode = useCallback(() => {
    setSettings({
      ...settings,
      boards: settings.boards.map(board => 
        board.id === settings.currentBoardId
          ? { ...board, nodes: board.nodes.filter(n => n.id !== id) }
          : board
      )
    });
  }, [id, settings, setSettings]);

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
    
    (Object.keys(DEFAULT_AI_SETTINGS) as Array<keyof AISettings>).forEach(key => {
      if (settings[key] !== DEFAULT_AI_SETTINGS[key] && settings[key] !== undefined) {
        filteredSettings[key] = settings[key];
      }
    });
    
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
      return (selectedModel as CustomModel).apiKey;
    }
    
    return selectedModel.provider === "openai" ? settings.openai.apiKey :
           selectedModel.provider === "xai" ? settings.xai.apiKey :
           selectedModel.provider === "groq" ? settings.groq.apiKey :
           selectedModel.provider === "openrouter" ? settings.openrouter.apiKey :
           selectedModel.provider === "anthropic" ? settings.anthropic.apiKey :
           selectedModel.provider === "google" ? settings.google.apiKey :
           "";
  };

  const sendMessage = useCallback(async () => {
    if (!input.trim()) return;

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

    try {
      
      const contextMessages = getContextFromSourceNodes();
      const baseUrl = getEndpointForModel(selectedModel);
  
      const allMessages = [...contextMessages, ...messages, newMessage];
      console.log("Sending all messages to API:", allMessages);
  
      let response;
      let result;
  
      if (selectedModel.provider === "anthropic") {
        const anthropic = new Anthropic({
          apiKey: apiKey,
          dangerouslyAllowBrowser: true
        });
      
        const response = await anthropic.messages.create({
          model: model,
          system: settings.systemPrompt,
          messages: allMessages.map(msg => ({
            role: msg.role === "user" ? "user" : "assistant",
            content: msg.content
          })),
          max_tokens: 8192,
          ...filterAnthropicAISettings(settings),
        });
      
        const assistantMessage: Message = {
          role: "assistant",
          content: response.content[0].text,
        };
      
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        const messageContent = imageData
        ? [
            { type: "text", text: input },
            { type: "image_url", image_url: { url: imageData } }
          ]
        : input;
        response = await fetch(`${baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: settings.systemPrompt },
              ...allMessages.slice(0, -1),
              { role: "user", content: messageContent }
            ].filter(m => m.content),
            // we shouldnt pass any of these unless they are changed from the defaults
            ...filterAISettings(settings),
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
  
        const assistantMessage: Message = {
          role: "assistant",
          content: result.choices[0].message.content,
        };
  
        setMessages((prev) => [...prev, assistantMessage]);
        setInput("");
        setImageData(null);
        setPreviewImage(null);
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
    }
  }, [input, messages, model, settings, getContextFromSourceNodes, toast]);

  useEffect(() => {
    const currentBoard = settings.boards.find(b => b.id === settings.currentBoardId);
    if (!currentBoard) return;
  
    const currentNode = currentBoard.nodes.find(n => n.id === id);
    if (!currentNode) return;
  
    // Only update if the data has actually changed
    if (currentNode.data.messages !== messages || currentNode.data.model !== model) {
      setSettings({
        ...settings,
        boards: settings.boards.map(board => 
          board.id === settings.currentBoardId
            ? {
                ...board,
                nodes: board.nodes.map(node => 
                  node.id === id
                    ? { ...node, data: { ...node.data, messages, model } }
                    : node
                )
              }
            : board
        )
      });
    }
  }, [messages, model]);

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
                ? "bg-primary text-primary-foreground ml-4"
                : "bg-muted text-muted-foreground mr-4"
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
              <ReactMarkdown
                components={{
                  h1: (props) => <h1 {...props} className="text-xl font-bold mt-6 mb-4" />,
                  h2: (props) => <h2 {...props} className="text-lg font-semibold mt-5 mb-3" />,
                  h3: (props) => <h3 {...props} className="text-md font-semibold mt-4 mb-2" />,
                  p: (props) => <p {...props} className="mb-4 last:mb-0" />,
                  ul: (props) => <ul {...props} className="mb-4 list-disc pl-6" />,
                  ol: (props) => <ol {...props} className="mb-4 list-decimal pl-6" />,
                  li: (props) => <li {...props} className="mb-1" />,
                  code: ({ node, className, children, ...props }) => {
                    const match = /language-(\w+)/.exec(className || "");
                    const codeId = `code-${i}-${String(children).slice(0, 20)}`;

                    return match ? (
                      <div className="mb-4 relative group">
                      <div className="absolute right-2 top-2 z-50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto">
                        {/* <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 hover:bg-muted/50"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            copyToClipboard(String(children).replace(/\n$/, ""), codeId);
                          }}
                        >
                          {copiedStates[codeId] ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button> */}
                      </div>
                        <div className="rounded-md">
                          <SyntaxHighlighter
                            language={match[1]}
                            style={oneDark}
                            customStyle={{
                              margin: 0,
                              minWidth: '100%',
                              width: '100%',
                              borderRadius: '0.375rem',
                            }}
                          >
                            {String(children).replace(/\n$/, "")}
                          </SyntaxHighlighter>
                        </div>
                      </div>
                    ) : (
                      <code className={cn("bg-muted px-1.5 py-0.5 rounded-md text-sm", className)} {...props}>
                        {children}
                      </code>
                    );
                  }
                }}
              >
                {msg.content}
              </ReactMarkdown>
            </div>
          ))}
        </div>
      </CardContent>

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
          <Button
            variant="ghost"
            size="sm"
            onClick={deleteNode}
            className="h-8"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
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