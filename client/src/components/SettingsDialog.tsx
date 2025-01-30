import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { useStore } from '@/lib/store';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from './ui/textarea';
import { Switch } from '@/components/ui/switch';
import { themeColors } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { Card } from './ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { CustomModel } from '@/lib/types';
import { AddModelDialog } from './AddModelDialog';
import logo from '@/assets/logo.svg';
import { ClearDataDialog } from './ClearDataDialog';
import { RAGManager } from './RAGManager';
import { open as tauriOpen } from '@tauri-apps/plugin-shell';
import openaiLogo from '@/assets/openai-logo.svg';
import googleLogo from '@/assets/google-logo.svg';
import deepseekLogo from '@/assets/deepseek-logo.svg';
import anthropicLogo from '@/assets/anthropic-logo.svg';
import groqLogo from '@/assets/groq-logo.svg';
import openrouterLogo from '@/assets/openrouter-logo.svg';
import xaiLogo from '@/assets/xai-logo.svg';
import waiLogo from '@/assets/wai-logo.svg';
import inferencenetLogo from '@/assets/inferencenet-logo.svg';
import alibabacloudLogo from '@/assets/alibaba-logo.png';
import nvidiaLogo from '@/assets/nvidia-logo.svg';
import { BackupDialog } from './BackupDialog';
interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { settings, setSettings } = useStore();
  const [newModel, setNewModel] = useState<Partial<CustomModel>>({
    provider: 'openai',
    requiresAuth: true,
    maxTokens: 8192,
  });

  const [showAddModel, setShowAddModel] = useState(false);

  const updateCustomModel = (index: number, field: keyof CustomModel, value: any) => {
    setSettings({
      ...settings,
      customModels: settings.customModels.map((model, i) =>
        i === index ? { ...model, [field]: value } : model
      ),
    });
  };

  const removeCustomModel = (index: number) => {
    setSettings({
      ...settings,
      customModels: settings.customModels.filter((_, i) => i !== index),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Global Settings</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="settings">
          <div className="flex justify-center mb-4">
            <TabsList>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="api">API Keys</TabsTrigger>
              <TabsTrigger value="custom-models">Models</TabsTrigger>
              <TabsTrigger value="parameters">Inference Params</TabsTrigger>
              <TabsTrigger value="rag">RAG</TabsTrigger>
              <TabsTrigger value="hotkeys">Hotkeys</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="settings" className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2 mt-2 text-center">
                <div className="flex justify-center">
                  <img src={logo} alt="Curiso.ai" title="Curiso.ai" className="w-12 h-12" />
                </div>
                <div className="flex justify-center">
                  <p className="text-sm text-muted-foreground justify-center mb-2">
                    Version v1.2.2 by{' '}
                    <a
                      href="https://github.com/metaspartan/curiso"
                      onClick={e => {
                        e.preventDefault();
                        tauriOpen('https://github.com/metaspartan/curiso');
                      }}
                      className="hover:underline"
                    >
                      Carsen Klock
                    </a>
                  </p>
                </div>
                <strong>Curiso.ai</strong> is an infinite canvas for your thoughts—a platform that
                seamlessly connects nodes and AI services so you can explore ideas in depth.
              </div>
              <div className="space-y-2 mt-2">
                <Label>Primary Theme Color</Label>
                <div className="flex gap-2">
                  {themeColors.map(color => (
                    <button
                      key={color.value}
                      onClick={() => setSettings({ ...settings, primaryColor: color.value })}
                      className={cn(
                        'w-8 h-8 rounded-full transition-transform',
                        settings.primaryColor === color.value &&
                          'ring-2 ring-offset-2 ring-primary scale-110'
                      )}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center space-x-2 mt-4">
                <Switch
                  id="snap-grid"
                  checked={settings.snapToGrid}
                  onCheckedChange={checked => setSettings({ ...settings, snapToGrid: checked })}
                />
                <Label htmlFor="snap-grid">Snap to grid</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="double-click-zoom"
                  checked={settings.doubleClickZoom}
                  onCheckedChange={checked =>
                    setSettings({ ...settings, doubleClickZoom: checked })
                  }
                />
                <Label htmlFor="double-click-zoom">Double click to zoom</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="pan-on-drag"
                  checked={settings.panOnDrag}
                  onCheckedChange={checked => setSettings({ ...settings, panOnDrag: checked })}
                />
                <Label htmlFor="pan-on-drag">Pan on drag</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="pan-on-scroll"
                  checked={settings.panOnScroll}
                  onCheckedChange={checked => setSettings({ ...settings, panOnScroll: checked })}
                />
                <Label htmlFor="pan-on-scroll">Pan on scroll (hold Shift)</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="zoom-on-scroll"
                  checked={settings.zoomOnScroll}
                  onCheckedChange={checked => setSettings({ ...settings, zoomOnScroll: checked })}
                />
                <Label htmlFor="zoom-on-scroll">Zoom on scroll</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="fit-view-on-init"
                  checked={settings.fitViewOnInit}
                  onCheckedChange={checked => setSettings({ ...settings, fitViewOnInit: checked })}
                />
                <Label htmlFor="fit-view-on-init">Fit view on load</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="streaming"
                  checked={settings.streaming}
                  onCheckedChange={checked => setSettings({ ...settings, streaming: checked })}
                />
                <Label htmlFor="streaming">Enable Streaming</Label>
              </div>

              <div className="space-y-4 mt-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-medium">Clear All Data</h4>
                    <p className="text-sm text-muted-foreground text-gray-500">
                      Permanently delete all locally stored data
                    </p>
                  </div>
                  <ClearDataDialog />
                </div>
                {/* <div className="flex items-center justify-between">
                  <Label>Backup & Restore</Label>
                  <BackupDialog />
                </div> */}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="rag" className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Card className="p-4">
                  <RAGManager />
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="api" className="space-y-4">
            <div className="max-h-[400px] overflow-y-auto pr-4">
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <img src={openaiLogo} alt="OpenAI" className="w-6 h-6" />
                      <Label>OpenAI API Key</Label>
                    </div>
                    <Input
                      type="password"
                      value={settings.openai.apiKey}
                      onChange={e =>
                        setSettings({
                          ...settings,
                          openai: {
                            ...settings.openai,
                            apiKey: e.target.value,
                          },
                        })
                      }
                      placeholder="sk-..."
                    />
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <img src={anthropicLogo} alt="Anthropic" className="w-6 h-6" />
                      <Label>Anthropic API Key</Label>
                    </div>
                    <Input
                      type="password"
                      value={settings.anthropic.apiKey}
                      onChange={e =>
                        setSettings({
                          ...settings,
                          anthropic: {
                            ...settings.anthropic,
                            apiKey: e.target.value,
                          },
                        })
                      }
                      placeholder="sk-ant-..."
                    />
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <img src={xaiLogo} alt="xAI" className="w-6 h-6" />
                      <Label>xAI API Key</Label>
                    </div>
                    <Input
                      type="password"
                      value={settings.xai.apiKey}
                      onChange={e =>
                        setSettings({
                          ...settings,
                          xai: { ...settings.xai, apiKey: e.target.value },
                        })
                      }
                      placeholder="xai-..."
                    />
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <img src={googleLogo} alt="Google" className="w-6 h-6" />
                      <Label>Google API Key</Label>
                    </div>
                    <Input
                      type="password"
                      value={settings.google.apiKey}
                      onChange={e =>
                        setSettings({
                          ...settings,
                          google: {
                            ...settings.google,
                            apiKey: e.target.value,
                          },
                        })
                      }
                      placeholder="AIza..."
                    />
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <img src={groqLogo} alt="Groq" className="w-6 h-6" />
                      <Label>Groq API Key</Label>
                    </div>
                    <Input
                      type="password"
                      value={settings.groq.apiKey}
                      onChange={e =>
                        setSettings({
                          ...settings,
                          groq: { ...settings.groq, apiKey: e.target.value },
                        })
                      }
                      placeholder="gsk-..."
                    />
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <img src={openrouterLogo} alt="OpenRouter" className="w-6 h-6" />
                      <Label>OpenRouter API Key</Label>
                    </div>
                    <Input
                      type="password"
                      value={settings.openrouter.apiKey}
                      onChange={e =>
                        setSettings({
                          ...settings,
                          openrouter: {
                            ...settings.openrouter,
                            apiKey: e.target.value,
                          },
                        })
                      }
                      placeholder="sk-or-..."
                    />
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <img src={deepseekLogo} alt="Deepseek" className="w-6 h-6" />
                      <Label>Deepseek API Key</Label>
                    </div>
                    <Input
                      type="password"
                      value={settings.deepseek.apiKey}
                      onChange={e =>
                        setSettings({
                          ...settings,
                          deepseek: {
                            ...settings.deepseek,
                            apiKey: e.target.value,
                          },
                        })
                      }
                      placeholder="sk-..."
                    />
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <img src={waiLogo} alt="wAI" className="w-6 h-6" />
                      <Label>wAI API Key</Label>
                    </div>
                    <Input
                      type="password"
                      placeholder="wsk-..."
                      value={settings.wai.apiKey}
                      onChange={e =>
                        setSettings({
                          ...settings,
                          wai: { ...settings.wai, apiKey: e.target.value },
                        })
                      }
                    />
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <img src={inferencenetLogo} alt="Inferencenet" className="w-6 h-6" />
                      <Label>Inference.net API Key</Label>
                    </div>
                    <Input
                      type="password"
                      placeholder="inference-..."
                      value={settings.inferencenet.apiKey}
                      onChange={e =>
                        setSettings({
                          ...settings,
                          inferencenet: { ...settings.inferencenet, apiKey: e.target.value },
                        })
                      }
                    />
                  </div>
                </Card>

                {/* <Card className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <img src={nvidiaLogo} alt="NVIDIA" className="w-6 h-6" />
                      <Label>NVIDIA NIMs API Key</Label>
                    </div>
                    <Input
                      type="password"
                      placeholder="nvapi-..."
                      value={settings.nvidia.apiKey}
                      onChange={(e) => setSettings({ ...settings, nvidia: { ...settings.nvidia, apiKey: e.target.value }
                        })
                      }
                    />
                  </div>
                </Card> */}

                <Card className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <img src={alibabacloudLogo} alt="Alibaba Cloud" className="w-6 h-6" />
                      <Label>Alibaba Cloud API Key</Label>
                    </div>
                    <Input
                      type="password"
                      placeholder="alibaba-..."
                      value={settings.alibabacloud.apiKey}
                      onChange={e =>
                        setSettings({
                          ...settings,
                          alibabacloud: { ...settings.alibabacloud, apiKey: e.target.value },
                        })
                      }
                    />
                  </div>
                </Card>

                {/* <Card className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <img src={perplexityLogo} alt="Perplexity" className="w-6 h-6" />
                    <Label>Perplexity API Key</Label>
                  </div>
                  <Input
                    type="password"
                    value={settings.perplexity.apiKey}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        perplexity: { ...settings.perplexity, apiKey: e.target.value }
                      })
                    }
                    placeholder="pplx-..."
                  />
                </div>
              </Card> */}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="custom-models" className="space-y-4">
            <div className="space-y-4 mt-5">
              <div className="flex justify-center">
                <Button onClick={() => setShowAddModel(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Model
                </Button>
                <AddModelDialog open={showAddModel} onOpenChange={setShowAddModel} />
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                {settings.customModels?.map((model, index) => (
                  <Card key={model.id} className="p-4 mt-2">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <Input
                            value={model.name}
                            onChange={e => updateCustomModel(index, 'name', e.target.value)}
                            placeholder="Model Name"
                          />
                          <Input
                            value={model.endpoint}
                            onChange={e => updateCustomModel(index, 'endpoint', e.target.value)}
                            placeholder="API Endpoint"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            value={model.id}
                            onChange={e => updateCustomModel(index, 'id', e.target.value)}
                            placeholder="Model ID"
                          />
                          <Select
                            value={model.provider}
                            onValueChange={(value: 'openai' | 'anthropic') =>
                              updateCustomModel(index, 'provider', value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Provider" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="openai">OpenAI Compatible</SelectItem>
                              <SelectItem value="anthropic">Anthropic Compatible</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={model.maxTokens}
                            onChange={e =>
                              updateCustomModel(index, 'maxTokens', parseInt(e.target.value))
                            }
                            placeholder="Max Tokens"
                          />
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={model.requiresAuth}
                              onCheckedChange={checked =>
                                updateCustomModel(index, 'requiresAuth', checked)
                              }
                            />
                            <Label>Requires Authentication</Label>
                          </div>
                        </div>
                        {model.requiresAuth && (
                          <Input
                            type="password"
                            value={model.apiKey}
                            onChange={e => updateCustomModel(index, 'apiKey', e.target.value)}
                            placeholder="API Key"
                          />
                        )}
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeCustomModel(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="parameters" className="space-y-4">
            <Card className="p-4">
              <div className="grid gap-4">
                <Label>System Prompt</Label>
                <Textarea
                  value={settings.systemPrompt}
                  onChange={e => setSettings({ ...settings, systemPrompt: e.target.value })}
                  placeholder="Enter system prompt..."
                />

                <div className="space-y-2">
                  <Label>Max Tokens</Label>
                  <Input
                    type="number"
                    min={1}
                    max={999999999}
                    value={settings.max_tokens}
                    onChange={e => {
                      const value = parseInt(e.target.value);
                      if (value >= 1 && value <= 999999999) {
                        setSettings({ ...settings, max_tokens: value });
                      }
                    }}
                    placeholder="Enter max tokens..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Temperature ({settings.temperature})</Label>
                  <Slider
                    value={[settings.temperature]}
                    min={0}
                    max={2}
                    step={0.1}
                    onValueChange={([value]) => setSettings({ ...settings, temperature: value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Top P ({settings.top_p})</Label>
                  <Slider
                    value={[settings.top_p]}
                    min={0}
                    max={1}
                    step={0.01}
                    onValueChange={([value]) => setSettings({ ...settings, top_p: value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Frequency Penalty ({settings.frequency_penalty})</Label>
                  <Slider
                    value={[settings.frequency_penalty]}
                    min={0}
                    max={1}
                    step={0.1}
                    onValueChange={([value]) =>
                      setSettings({ ...settings, frequency_penalty: value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Presence Penalty ({settings.presence_penalty})</Label>
                  <Slider
                    value={[settings.presence_penalty]}
                    min={0}
                    max={1}
                    step={0.1}
                    onValueChange={([value]) =>
                      setSettings({ ...settings, presence_penalty: value })
                    }
                  />
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="hotkeys" className="space-y-4">
            <Card className="p-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>New Node</Label>
                  <Input
                    value={settings.hotkeys.newNode}
                    onChange={e =>
                      setSettings({
                        ...settings,
                        hotkeys: {
                          ...settings.hotkeys,
                          newNode: e.target.value,
                        },
                      })
                    }
                    placeholder="Cmd+N"
                  />
                </div>
                <div className="space-y-2">
                  <Label>New Board</Label>
                  <Input
                    value={settings.hotkeys.newBoard}
                    onChange={e =>
                      setSettings({
                        ...settings,
                        hotkeys: {
                          ...settings.hotkeys,
                          newBoard: e.target.value,
                        },
                      })
                    }
                    placeholder="Cmd+Shift+N"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Delete Node</Label>
                  <Input
                    value={settings.hotkeys.dNode}
                    onChange={e =>
                      setSettings({
                        ...settings,
                        hotkeys: { ...settings.hotkeys, dNode: e.target.value },
                      })
                    }
                    placeholder="Cmd+D"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Delete Board</Label>
                  <Input
                    value={settings.hotkeys.deleteBoard}
                    onChange={e =>
                      setSettings({
                        ...settings,
                        hotkeys: {
                          ...settings.hotkeys,
                          deleteBoard: e.target.value,
                        },
                      })
                    }
                    placeholder="Cmd+Shift+D"
                  />
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
