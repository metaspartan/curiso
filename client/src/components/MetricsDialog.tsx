import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Activity, RotateCcw } from 'lucide-react';
import { useMetricsStore } from '@/lib/metricstore';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from './ui/card';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
} from 'recharts';
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
// Add to existing imports at the top
import { useStore } from '@/lib/store';
import { PRESET_ENDPOINTS } from '@/lib/constants';
import logo from '@/assets/logo.svg';
import { cn } from '@/lib/utils';
import { generateChartColor } from '@/lib/colors';
// Add these functions before the MetricsDialog component
const getEndpointIcon = (modelId: string) => {
  if (modelId.includes('://')) {
    const preset = PRESET_ENDPOINTS.find(p => p.url === modelId);
    return preset?.icon;
  }
  return null;
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-lg p-2 shadow-md min-w-[150px]">
        <p className="font-medium text-foreground mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex justify-between items-center text-foreground">
            <span>{entry.name}:</span>
            <span className="ml-4 tabular-nums">{entry.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const formatNumber = (num: number) => {
  if (num >= 1000000000000) return `${(num / 1000000000000).toFixed(1)}T`;
  if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)}B`;
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

const CustomLegend = ({ payload }: any) => {
  return (
    <ScrollArea className="h-[200px] w-[180px]">
      <div className="space-y-1 pr-4">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <div
              className={`h-2 w-2 shrink-0 rounded-sm`}
              style={{
                backgroundColor: `hsl(${generateChartColor(index)})`,
              }}
            />
            <span
              className="truncate"
              title={`${entry.value} (${formatNumber(entry.payload.value)})`}
            >
              {entry.value} ({formatNumber(entry.payload.value)})
            </span>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

export function MetricsDialog() {
  const metrics = useMetricsStore(state => state.metrics);
  const resetMetrics = useMetricsStore(state => state.resetMetrics);

  const barChartData = Object.entries(metrics).map(([modelId, data]) => ({
    name: modelId,
    Input: data.inputTokens,
    Output: data.outputTokens,
  }));

  const chartData = Object.entries(metrics).map(([modelId, data], index) => {
    const colorValue = generateChartColor(index);
    return {
      model: modelId,
      tokens: data.totalTokens,
      fill: `hsl(${colorValue})`,
      className: `chart-color-${index}`,
      style: {
        '--chart-color-h': colorValue.split(' ')[0],
      } as React.CSSProperties,
    };
  });

  const chartConfig = Object.entries(metrics).reduce((acc, [modelId, _], index) => {
    const safeId = modelId.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const colorValue = generateChartColor(index);
    acc[safeId] = {
      label: modelId,
      color: `hsl(${colorValue})`,
    };
    return acc;
  }, {} as ChartConfig);

  const ioChartConfig = {
    Input: {
      label: 'Input Toks',
      color: 'hsl(var(--c-1))',
    },
    Output: {
      label: 'Output Toks',
      color: 'hsl(var(--c-3))',
    },
  } satisfies ChartConfig;

  chartConfig.tokens = { label: 'Tokens' };

  const totalTokens = Object.values(metrics).reduce((sum, data) => sum + data.totalTokens, 0);

  const formatNumber = (num: number) => {
    if (num >= 1000000000000) return `${(num / 1000000000000).toFixed(1)}T`;
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="icon" variant="outline">
          <Activity className="h-4 w-4" />
          {/* Metrics */}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Usage Metrics</span>
            {/* <Button
                variant="outline"
                size="sm"
                onClick={resetMetrics}
                className="h-8"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button> */}
          </DialogTitle>
          <DialogDescription>
            Detailed analysis of your token usage across different LLM models
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="io">Input/Output</TabsTrigger>
            <TabsTrigger value="detailed">Detailed Stats</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="mt-4">
              <Card>
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Token Distribution</h3>
                    <span className="text-sm text-muted-foreground">
                      Total: {formatNumber(totalTokens)} tokens
                    </span>
                  </div>
                  <ChartContainer
                    config={chartConfig}
                    className="mx-auto aspect-square max-h-[300px] mt-4"
                  >
                    <PieChart>
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            labelFormatter={value => value}
                            formatter={(value, name) => (
                              <div className="flex justify-between gap-2">
                                <span className="text-muted-foreground">{name}</span>
                                <span className="font-medium tabular-nums">
                                  {value.toLocaleString()}
                                </span>
                              </div>
                            )}
                          />
                        }
                      />
                      <Pie
                        data={chartData}
                        dataKey="tokens"
                        nameKey="model"
                        innerRadius={60}
                        paddingAngle={2}
                      >
                        {chartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            className={entry.className}
                            fill={`hsl(${generateChartColor(index)})`}
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                  <div className="mt-4">
                    <ScrollArea className="h-[100px]">
                      <div className="grid grid-cols-2 gap-2 p-4">
                        {Object.entries(metrics).map(([modelId, data]) => (
                          <div key={modelId} className="flex items-center gap-2 text-sm">
                            <div
                              className="h-2 w-2 rounded-full"
                              style={{
                                backgroundColor:
                                  chartConfig[modelId.toLowerCase().replace(/[^a-z0-9]/g, '-')]
                                    ?.color,
                              }}
                            />
                            <span className="truncate">{modelId}</span>
                            <span className="text-muted-foreground ml-auto">
                              {formatNumber(data.totalTokens)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="io">
            <div className="mt-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-medium">Input/Output Distribution</CardTitle>
                    <span className="text-sm text-muted-foreground">
                      Total: {formatNumber(totalTokens)} tokens
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={ioChartConfig}>
                    <BarChart data={barChartData}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        tickLine={false}
                        tickMargin={5}
                        axisLine={false}
                        interval={0}
                        angle={-70}
                        textAnchor="end"
                        height={100}
                        tick={{
                          fontSize: 11,
                          fill: 'var(--foreground)',
                        }}
                        tickFormatter={value =>
                          value.length > 15 ? `${value.substring(0, 15)}...` : value
                        }
                      />
                      {/* <YAxis
                                tickFormatter={formatNumber}
                                tickLine={false}
                                axisLine={false}
                            /> */}
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            formatter={(value, name) => (
                              <div className="flex justify-between gap-2">
                                <span className="text-muted-foreground">{name} Tokens</span>
                                <span className="font-medium tabular-nums">
                                  {value.toLocaleString()}
                                </span>
                              </div>
                            )}
                          />
                        }
                      />
                      {/* <ChartLegend content={<ChartLegendContent />} /> */}
                      <Bar
                        dataKey="Output"
                        stackId="tokens"
                        className="fill-[--color-Output]"
                        radius={[0, 0, 4, 4]}
                      />
                      <Bar
                        dataKey="Input"
                        stackId="tokens"
                        className="fill-[--color-Input]"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
                <CardFooter className="text-sm text-muted-foreground">
                  Showing input and output token distribution across models, with your overall token
                  usage. Input tokens are the total tokens sent to the model, and output tokens are
                  the total tokens received from the model.
                </CardFooter>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="detailed">
            <ScrollArea className="h-[400px] mt-4">
              <div className="space-y-2">
                {Object.entries(metrics).map(([modelId, data]) => (
                  <Card key={modelId} className="p-3">
                    <h3 className="font-medium text-sm mb-2">
                      {modelId} ({data.provider})
                    </h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Input Tokens</p>
                        <p className="font-medium">{formatNumber(data.inputTokens)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Output Tokens</p>
                        <p className="font-medium">{formatNumber(data.outputTokens)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Total Tokens</p>
                        <p className="font-medium">{formatNumber(data.totalTokens)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Total Inference Time</p>
                        <p className="font-medium">{data.totalTime.toFixed(1)}s</p>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t flex items-center justify-between text-xs text-muted-foreground">
                      <div>
                        <span className="font-medium text-foreground">
                          {(data.inputTokens / data.outputTokens).toFixed(2)}
                        </span>{' '}
                        I/O ratio ({Math.round((data.inputTokens / data.totalTokens) * 100)}% input)
                      </div>
                      <div>
                        <span className="font-medium text-foreground">
                          Average {data.tokensPerSecond.toFixed(1)}
                        </span>{' '}
                        tokens/sec
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
