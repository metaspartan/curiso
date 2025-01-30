import { Plus, Trash2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useStore } from '@/lib/store';
import { nanoid } from 'nanoid';
import { useState, useEffect } from 'react';

export function BoardSelector() {
  const { settings, setSettings } = useStore();
  const currentBoard = settings.boards.find(b => b.id === settings.currentBoardId);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(currentBoard?.name || '');

  useEffect(() => {
    setEditName(currentBoard?.name || '');
  }, [currentBoard?.name]);

  const addBoard = () => {
    const newBoard = {
      id: nanoid(),
      name: `Board ${settings.boards.length + 1}`,
      nodes: [],
      edges: [],
    };
    setSettings({
      ...settings,
      boards: [...settings.boards, newBoard],
      currentBoardId: newBoard.id,
    });
  };

  const deleteBoard = () => {
    if (settings.boards.length <= 1) return;
    const newBoards = settings.boards.filter(b => b.id !== settings.currentBoardId);
    setSettings({
      ...settings,
      boards: newBoards,
      currentBoardId: newBoards[0].id,
    });
  };

  const updateBoardName = (boardId: string, newName: string) => {
    if (!newName.trim()) return;
    setSettings({
      ...settings,
      boards: settings.boards.map(board =>
        board.id === boardId ? { ...board, name: newName } : board
      ),
    });
    setIsEditing(false);
  };

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
      <div className="relative flex items-center gap-2">
        {isEditing ? (
          <div className="relative">
            <input
              type="text"
              list="board-names"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              onBlur={() => updateBoardName(currentBoard?.id || '', editName)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  updateBoardName(currentBoard?.id || '', editName);
                }
                if (e.key === 'Escape') {
                  setIsEditing(false);
                  setEditName(currentBoard?.name || '');
                }
              }}
              className="h-10 w-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              autoFocus
            />
            <datalist id="board-names">
              {settings.boards.map(board => (
                <option key={board.id} value={board.name} />
              ))}
            </datalist>
          </div>
        ) : (
          <>
            <Select
              value={settings.currentBoardId}
              onValueChange={value => setSettings({ ...settings, currentBoardId: value })}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select board">{currentBoard?.name}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {settings.boards.map(board => (
                  <SelectItem key={board.id} value={board.id}>
                    {board.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => setIsEditing(true)}
              size="icon"
              variant="outline"
              className="h-10 w-10"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
      <Button onClick={addBoard} size="icon" variant="outline">
        <Plus className="h-4 w-4" />
      </Button>
      <Button
        onClick={deleteBoard}
        size="icon"
        variant="outline"
        disabled={settings.boards.length <= 1}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
