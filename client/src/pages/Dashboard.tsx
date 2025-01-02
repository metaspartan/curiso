import ReactFlow, {
  Background,
  Controls,
  Edge,
  Node,
  Panel,
  useNodesState,
  useEdgesState,
  Connection,
  applyEdgeChanges,
  EdgeChange,
  applyNodeChanges,
  NodeChange,
  useReactFlow,
  ReactFlowProvider
} from 'reactflow';
import { useStore } from "@/lib/store";
import 'reactflow/dist/style.css';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Settings } from 'lucide-react';
import { ChatNode } from '@/components/ChatNode';
import { SettingsDialog } from '@/components/SettingsDialog';
import { nanoid } from 'nanoid';
import { BoardSelector } from '@/components/BoardSelector';
import logo from "@/assets/logo.svg"
import { useDebouncedCallback } from 'use-debounce';

const nodeTypes = {
  chat: ChatNode
};

function Flow({ settingsOpen, setSettingsOpen }: { settingsOpen: boolean; setSettingsOpen: (open: boolean) => void }) {
  const { settings, setSettings } = useStore();
  const { getViewport, screenToFlowPosition } = useReactFlow();
  const debouncedSetSettings = useDebouncedCallback((newSettings) => {
    setSettings(newSettings);
  }, 1000); // 1 second delay

  const currentBoard = settings.boards.find(b => b.id === settings.currentBoardId)!;
  
    const onNodesChange = (changes: NodeChange[]) => {
    const newSettings = {
      ...settings,
      boards: settings.boards.map(board => 
        board.id === settings.currentBoardId
          ? { ...board, nodes: applyNodeChanges(changes, board.nodes) }
          : board
      )
    };
    
    // Update UI immediately
    useStore.setState({ settings: newSettings });
    // Debounce storage update
    debouncedSetSettings(newSettings);
  };

  const onEdgesChange = (changes: EdgeChange[]) => {
    const newSettings = {
      ...settings,
      boards: settings.boards.map(board => 
        board.id === settings.currentBoardId
          ? { ...board, edges: applyEdgeChanges(changes, board.edges) }
          : board
      )
    };
    
    // Update UI immediately
    useStore.setState({ settings: newSettings });
    // Debounce storage update
    debouncedSetSettings(newSettings);
  };

  const onConnect = (connection: Connection) => {
    if (!connection.source || !connection.target) return;
  
    const newSettings = {
      ...settings,
      boards: settings.boards.map(board => {
        if (board.id !== settings.currentBoardId) return board;
        
        const exists = board.edges.some(
          (edge) =>
            edge.source === connection.source && edge.target === connection.target
        );
        if (exists) return board;
  
        return {
          ...board,
          edges: [...board.edges, {
            ...connection,
            id: nanoid(),
            type: 'default',
            animated: true,
            style: { stroke: 'var(--primary-color)' },
            source: connection.source,
            target: connection.target,
            sourceHandle: connection.sourceHandle || null,
            targetHandle: connection.targetHandle || null
          }]
        };
      })
    };
  
    // Update UI immediately
    useStore.setState({ settings: newSettings });
    // Debounce storage update
    debouncedSetSettings(newSettings);
  };

  useEffect(() => {
    setSettings({
      ...settings,
      boards: settings.boards.map(board => ({
        ...board,
        edges: board.edges.map(edge => ({
          ...edge,
          style: { ...edge.style, stroke: 'var(--primary-color)' }
        }))
      }))
    });
  }, [settings.primaryColor]);

  const addNode = () => {
    const id = nanoid();
    
    const position = screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });

    const newNode = {
      id,
      type: 'chat',
      position,
      resizable: true,
      data: {
        messages: [],
        model: settings.lastSelectedModel || 'chatgpt-4o-latest',
        provider: 'openai'
      }
    };
    
    setSettings({
      ...settings,
      boards: settings.boards.map(board => 
        board.id === settings.currentBoardId
          ? { ...board, nodes: [...board.nodes, newNode] }
          : board
      )
    });
  };

  return (
    <ReactFlow
      nodes={currentBoard.nodes}
      edges={currentBoard.edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      nodeTypes={nodeTypes}
      fitView
      minZoom={0.1}
      maxZoom={4}
      snapToGrid={settings.snapToGrid}
      snapGrid={[30, 30]}
      panOnDrag={settings.panOnDrag}
      panOnScroll={settings.panOnScroll}
      zoomOnScroll={settings.zoomOnScroll}
      zoomOnDoubleClick={settings.doubleClickZoom}
      fitViewOptions={{ includeHiddenNodes: settings.fitViewOnInit }}
      className="dark [&_.react-flow__controls]:bg-background [&_.react-flow__controls]:border-border [&_.react-flow__controls]:shadow-none [&_.react-flow__controls-button]:border-border [&_.react-flow__controls-button]:bg-background [&_.react-flow__controls-button]:hover:bg-muted [&_.react-flow__controls-button]:fill-foreground"
    >
      <Background className="bg-background" />
      <Controls />
      <BoardSelector />
      <Panel position="top-left" className="space-x-2">
      <img src={logo} alt="Curiso.ai" title="Curiso.ai" className="w-12 h-12 z-100" />
    </Panel>
      <Panel position="top-right" className="space-x-2">
        <Button onClick={addNode} size="icon">
          <Plus className="h-4 w-4" />
        </Button>
        <Button onClick={() => setSettingsOpen(true)} size="icon" variant="outline">
          <Settings className="h-4 w-4" />
        </Button>
      </Panel>
    </ReactFlow>
  );
}

export default function Dashboard() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="w-screen h-screen bg-background">
      <ReactFlowProvider>
        <Flow settingsOpen={settingsOpen} setSettingsOpen={setSettingsOpen} />
        <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      </ReactFlowProvider>

    </div>
  );
}