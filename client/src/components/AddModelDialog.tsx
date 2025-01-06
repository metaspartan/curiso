import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
  } from "@/components/ui/dialog";
  import { Label } from "@/components/ui/label";
  import { Input } from "@/components/ui/input";
  import { Button } from "@/components/ui/button";
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
  import { Switch } from "@/components/ui/switch";
  import { useState } from "react";
  import { CustomModel } from "@/lib/types";
  import { useStore } from "@/lib/store";
  import logo from "@/assets/logo.svg"
import { PRESET_ENDPOINTS } from "@/lib/constants";

  interface AddModelDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }
  
  export function AddModelDialog({ open, onOpenChange }: AddModelDialogProps) {
    const [isCustomEndpoint, setIsCustomEndpoint] = useState(true);
    const { settings, setSettings } = useStore();
    const [newModel, setNewModel] = useState<Partial<CustomModel>>({
      provider: 'openai',
      requiresAuth: true,
      maxTokens: 8192
    });
  
    const addCustomModel = () => {
      if (!newModel.name || !newModel.id || !newModel.endpoint) return;
  
      const customModel: CustomModel = {
        ...newModel as CustomModel,
        description: newModel.description || `Custom ${newModel.provider} compatible model`,
        thumbnailUrl: logo
      };
  
      setSettings({
        ...settings,
        customModels: [...(settings.customModels || []), customModel]
      });
      onOpenChange(false);
      setNewModel({
        provider: 'openai',
        requiresAuth: true,
        maxTokens: 8192
      });
    };
  
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Custom Model</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <div className="space-y-2">
                <Label>Endpoint Type</Label>
                <Select
                    value={newModel.endpoint || "custom"}
                    onValueChange={(value) => {
                        const preset = PRESET_ENDPOINTS.find(p => p.url === value);
                        setIsCustomEndpoint(value === "custom");
                        setNewModel({ 
                          ...newModel, 
                          endpoint: value === "custom" ? "" : value,
                          name: preset && preset.name !== "Custom" ? `${preset.name} Model` : newModel.name,
                          requiresAuth: preset?.name === "Custom"
                        });
                      }}
                >
                    <SelectTrigger>
                    <SelectValue placeholder="Select endpoint type">
                        {newModel.endpoint && (
                        <div className="flex items-start gap-2">
                            <img 
                            src={PRESET_ENDPOINTS.find(p => p.url === newModel.endpoint)?.icon} 
                            alt={PRESET_ENDPOINTS.find(p => p.url === newModel.endpoint)?.name} 
                            className="w-5 h-5 object-contain"
                            />
                            <div className="flex flex-col">
                            <span>{PRESET_ENDPOINTS.find(p => p.url === newModel.endpoint)?.name}</span>
                            </div>
                        </div>
                        )}
                    </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                    {PRESET_ENDPOINTS.map((preset) => (
                        <SelectItem key={preset.url} value={preset.url || "custom"}>
                        <div className="flex items-start gap-2">
                          <img 
                            src={preset.icon} 
                            alt={preset.name} 
                            className="w-5 h-5 object-contain"
                          />
                          <div className="flex flex-col">
                            <span>{preset.name}</span>
                            {/* <span className="text-xs text-muted-foreground">
                              {preset.description}
                            </span> */}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                </div>

                {isCustomEndpoint && (
                <div className="space-y-2">
                    <Label>Custom Endpoint URL</Label>
                    <Input
                    placeholder="https://localhost:11434/v1"
                    value={newModel.endpoint}
                    onChange={(e) => setNewModel({ 
                        ...newModel, 
                        endpoint: e.target.value 
                    })}
                    />
                </div>
                )}
              </div>
              <Label>Model Details</Label>
                <Input
                  value={newModel.name || ''}
                  onChange={(e) => setNewModel({ ...newModel, name: e.target.value })}
                  placeholder="Model Name"
                />
                <Input
                  value={newModel.id || ''}
                  onChange={(e) => setNewModel({ ...newModel, id: e.target.value })}
                  placeholder="Model ID (llama3.2:1b)"
                />
              <div className="space-y-2">
                <Label>Provider</Label>
                <Select
                  value={newModel.provider}
                  onValueChange={(value: 'openai' | 'anthropic') => 
                    setNewModel({ ...newModel, provider: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI Compatible</SelectItem>
                    <SelectItem value="anthropic">Anthropic Compatible</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={newModel.requiresAuth}
                  onCheckedChange={(checked) => 
                    setNewModel({ ...newModel, requiresAuth: checked })
                  }
                />
                <Label>Requires Authentication</Label>
              </div>
              {newModel.requiresAuth && (
                <Input
                  type="password"
                  value={newModel.apiKey || ''}
                  onChange={(e) => setNewModel({ ...newModel, apiKey: e.target.value })}
                  placeholder="API Key"
                />
              )}
              <Label>Max Tokens</Label>
              <Input
                type="number"
                value={newModel.maxTokens || 8192}
                onChange={(e) => setNewModel({ ...newModel, maxTokens: parseInt(e.target.value) })}
                placeholder="Max Tokens"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={addCustomModel}>
                Add Model
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }