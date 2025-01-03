import { AIModel, CustomModel, GlobalSettings } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import logo from "@/assets/logo.svg"
import { PRESET_ENDPOINTS } from "@/lib/constants";
interface ModelSelectorProps {
  models: AIModel[];
  selectedModel: string;
  onSelect: (modelId: string) => void;
}

export function ModelSelector({ models, selectedModel, onSelect }: ModelSelectorProps) {
  const settings = useStore((state) => state.settings);
  const allModels = [...models, ...(settings.customModels || [])];

  const getEndpointIcon = (model: AIModel | CustomModel) => {
    if ('endpoint' in model) {
      const preset = PRESET_ENDPOINTS.find(p => p.url === model.endpoint);
      return preset?.icon;
    }
    return null;
  };

  const getModelAuthStatus = (model: AIModel | CustomModel) => {
    if ('requiresAuth' in model) {
      const customModel = model as CustomModel;
      if (!customModel.requiresAuth) return { needsAuth: false };
      return {
        needsAuth: true,
        hasAuth: !!customModel.apiKey,
        label: 'API Key Required'
      };
    }

    const provider = model.provider;
    const apiKey = settings[provider]?.apiKey;
    return {
      needsAuth: true,
      hasAuth: !!apiKey,
      label: `${provider.toUpperCase()} API Key Required`
    };
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      {allModels.map((model) => {
        const authStatus = getModelAuthStatus(model);
        
        return (
          <Card
            key={model.id}
            className={cn(
              "cursor-pointer transition-colors hover:bg-muted",
              selectedModel === model.id && "border-primary"
            )}
            onClick={() => onSelect(model.id)}
          >
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                <img
                    src={getEndpointIcon(model) || model.thumbnailUrl || logo}
                    alt={model.name}
                    className="w-8 h-8 [&>path]:text-foreground"
                  />
                  <div>
                    <h3 className="font-medium">{model.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {model.provider.toUpperCase()}
                      {('endpoint' in model) && ' (Custom)'}
                    </p>
                  </div>
                </div>
                {authStatus.needsAuth && (
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant={authStatus.hasAuth ? "secondary" : "destructive"}>
                        <Info className="h-3 w-3 mr-1" />
                        {authStatus.hasAuth ? "Authenticated" : "Auth Required"}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{authStatus.label}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{model.description}</p>
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>Max tokens: {model.maxTokens.toLocaleString()}</span>
                {'endpoint' in model && (
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="outline" className="text-xs">
                        {new URL(model.endpoint as string).hostname}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">{model.endpoint as string}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}