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
import { Plus, Settings, MessageCirclePlus, Trash2 } from 'lucide-react';
import { ChatNode } from '@/components/ChatNode';
import { SettingsDialog } from '@/components/SettingsDialog';
import { nanoid } from 'nanoid';
import { BoardSelector } from '@/components/BoardSelector';
import logo from "@/assets/logo.svg"
import { useDebouncedCallback } from 'use-debounce';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { MetricsDialog } from '@/components/MetricsDialog';
import { WelcomeDialog } from '@/components/WelcomeDialog';

const nodeTypes = {
  chat: ChatNode
};

function Flow({ settingsOpen, setSettingsOpen }: { settingsOpen: boolean; setSettingsOpen: (open: boolean) => void }) {
  const { settings, setSettings } = useStore();
  const { getViewport, screenToFlowPosition } = useReactFlow();
  const debouncedSetSettings = useDebouncedCallback((newSettings) => {
    setSettings(newSettings);
  }, 1000); // 1 second delay

  const [showWelcome, setShowWelcome] = useState(true);
  const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');

  useEffect(() => {
    if (!hasSeenWelcome) {
      setShowWelcome(true);
      localStorage.setItem('hasSeenWelcome', 'true');
    }
  }, []);

  const currentBoard = settings.boards.find(b => b.id === settings.currentBoardId)!;
  
    const onNodesChange = (changes: NodeChange[]) => {
    // Filter out remove changes
    const filteredChanges = changes.filter(change => change.type !== 'remove');

    // Batch multiple position updates
    const positionChanges = filteredChanges.filter(change => change.type === 'position');
    if (positionChanges.length > 0) {
      requestAnimationFrame(() => {
        const newSettings = {
          ...settings,
          boards: settings.boards.map(board => 
            board.id === settings.currentBoardId
              ? { ...board, nodes: applyNodeChanges(filteredChanges, board.nodes) }
              : board
          )
        };
        useStore.setState({ settings: newSettings });
      });
      return;
    }
  
    // Handle other changes immediately
    const newSettings = {
      ...settings,
      boards: settings.boards.map(board => 
        board.id === settings.currentBoardId
          ? { ...board, nodes: applyNodeChanges(filteredChanges, board.nodes) }
          : board
      )
    };
    useStore.setState({ settings: newSettings });
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
    // // Debounce storage update
    // debouncedSetSettings(newSettings);
  };

  const onConnect = (connection: Connection) => {
    if (!connection.source || !connection.target) return;
  
    useStore.setState(state => {
      const currentBoard = state.settings.boards.find(b => b.id === state.settings.currentBoardId);
      if (!currentBoard) return state;

      const exists = currentBoard.edges.some(
        (edge) =>
          edge.source === connection.source && edge.target === connection.target
      );
      if (exists) return state;

      const newEdge: Edge = {
        id: nanoid(),
        type: 'default',
        animated: true,
        style: { stroke: 'var(--primary-color)' },
        source: connection.source || '',
        target: connection.target || '',
        sourceHandle: connection.sourceHandle || null,
        targetHandle: connection.targetHandle || null
      };

      return {
        settings: {
          ...state.settings,
          boards: state.settings.boards.map(board => 
            board.id === state.settings.currentBoardId
              ? {
                  ...board,
                  edges: [...board.edges, newEdge]
                }
              : board
          )
        }
      };
    });
  };

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      const { hotkeys } = settings;
      if (!hotkeys) return;
  
      // Prevent handling if user is typing in an input
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }
  
      const isMac = navigator.userAgent.includes('Mac');
      const cmdKey = isMac ? event.metaKey : event.ctrlKey;
      
      // Convert stored hotkey format to match event
      const convertHotkeyToEvent = (hotkey: string) => {
        const parts = hotkey.toLowerCase().split('+');
        return {
          needsCmd: parts.includes('cmd') || parts.includes('meta') || parts.includes('ctrl'),
          needsShift: parts.includes('shift'),
          key: parts[parts.length - 1]
        };
      };
  
      // Check each hotkey
      const pressedKey = event.key.toLowerCase();
      const hotkeyMap = {
        newNode: convertHotkeyToEvent(hotkeys.newNode),
        newBoard: convertHotkeyToEvent(hotkeys.newBoard),
        dNode: convertHotkeyToEvent(hotkeys.dNode),
        deleteBoard: convertHotkeyToEvent(hotkeys.deleteBoard)
      };
  
      Object.entries(hotkeyMap).forEach(([action, config]) => {
        if (cmdKey === config.needsCmd && 
            event.shiftKey === config.needsShift && 
            pressedKey === config.key) {
          event.preventDefault();
          switch(action) {
            case 'newNode': addNode(); break;
            case 'newBoard': plusBoard(); break;
            case 'dNode': delNode(); break;
            case 'deleteBoard': delBoard(); break;
          }
        }
      });
    };
  
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [settings.hotkeys, currentBoard]);

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

  const delNode = () => {
    const selectedNodes = currentBoard.nodes.filter(node => node.selected);
    if (selectedNodes.length === 0) return;
  
    setSettings({
      ...settings,
      boards: settings.boards.map(board => 
        board.id === settings.currentBoardId
          ? {
              ...board,
              nodes: board.nodes.filter(node => !selectedNodes.some(selected => selected.id === node.id)),
              edges: board.edges.filter(edge => 
                !selectedNodes.some(node => node.id === edge.source || node.id === edge.target)
              )
            }
          : board
      )
    });
  };
  
  const plusBoard = () => {
    const newBoard = {
      id: nanoid(),
      name: `Board ${settings.boards.length + 1}`,
      nodes: [],
      edges: []
    };
    setSettings({
      ...settings,
      boards: [...settings.boards, newBoard],
      currentBoardId: newBoard.id
    });
  };
  
  const delBoard = () => {
    if (settings.boards.length <= 1) return;
    const newBoards = settings.boards.filter(b => b.id !== settings.currentBoardId);
    setSettings({
      ...settings,
      boards: newBoards,
      currentBoardId: newBoards[0].id
    });
  };

  const selectedNodes = currentBoard.nodes.filter(node => node.selected);

  return (<>
    <ReactFlow
      nodes={currentBoard.nodes}
      edges={currentBoard.edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      nodeTypes={nodeTypes}
      fitView
      minZoom={0.1}
      maxZoom={6}
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
          <MessageCirclePlus className="h-4 w-4" />
        </Button>
        {selectedNodes.length > 0 && (
          <Button onClick={delNode} size="icon" variant="outline">
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
        <Button onClick={() => setSettingsOpen(true)} size="icon" variant="outline">
          <Settings className="h-4 w-4" />
        </Button>
      </Panel>
      <Panel position="bottom-right" className="space-x-2">
        <MetricsDialog />
      </Panel>
    </ReactFlow>
    <WelcomeDialog 
        open={showWelcome} 
        onOpenChange={setShowWelcome}
      />
      </>
  );
}

export default function Dashboard() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    
    <div className="w-screen h-screen bg-background">
      <ErrorBoundary>
      <ReactFlowProvider>
        <Flow settingsOpen={settingsOpen} setSettingsOpen={setSettingsOpen} />
        <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      </ReactFlowProvider>
      </ErrorBoundary>
    </div>
  );
}