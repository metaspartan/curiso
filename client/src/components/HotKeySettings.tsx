import { Button } from './ui/button';
import { Input } from './ui/input';
import { useStore } from '@/lib/store';
import { useState } from 'react';

export function HotkeySettings() {
  const { settings, setSettings } = useStore();
  const [recording, setRecording] = useState<string | null>(null);

  const handleKeyDown = (e: React.KeyboardEvent, hotkeyName: string) => {
    e.preventDefault();
    if (recording === hotkeyName) {
      const modifiers = [];
      if (e.ctrlKey) modifiers.push('ctrl');
      if (e.metaKey) modifiers.push('meta');
      if (e.altKey) modifiers.push('alt');
      if (e.shiftKey) modifiers.push('shift');

      const key = e.key.toLowerCase();
      const hotkey = [...modifiers, key].join('+');

      setSettings({
        ...settings,
        hotkeys: {
          ...settings.hotkeys,
          [hotkeyName]: hotkey,
        },
      });
      setRecording(null);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Hotkeys</h3>
      {Object.entries(settings.hotkeys).map(([name, value]) => (
        <div key={name} className="flex items-center justify-between">
          <span className="capitalize">{name.replace(/([A-Z])/g, ' $1')}</span>
          <div className="flex gap-2">
            <Input
              value={recording === name ? 'Press keys...' : value}
              onKeyDown={e => handleKeyDown(e, name)}
              onFocus={() => setRecording(name)}
              onBlur={() => setRecording(null)}
              className="w-32 text-center"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
