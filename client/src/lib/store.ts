import { create } from 'zustand';
import { persist, type StorageValue } from 'zustand/middleware';
import type { GlobalSettings } from './types';
import { SecureStorage, StorageKey } from './secureStorage';
import { nanoid } from 'nanoid';
import { themeColors } from './constants';
import { defaultOllamaModels } from './ollama';

const MASTER_KEY = import.meta.env.VITE_MASTER_KEY ?? 'default-master-key';
const FALLBACK_KEY = import.meta.env.VITE_FALLBACK_KEY ?? 'default-fallback-key';

const getSecureStorage = async () => {
  if (window.crypto.subtle) {
    try {
      const encoder = new TextEncoder();
      const keyBuffer = await crypto.subtle.digest(
        'SHA-256',
        encoder.encode(MASTER_KEY)
      );
      const keyArray = Array.from(new Uint8Array(keyBuffer));
      const keyString = keyArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return new SecureStorage({ password: keyString });
    } catch (e) {
      console.warn('Secure storage initialization failed:', e);
      return new SecureStorage({ password: FALLBACK_KEY });
    }
  }
  return new SecureStorage({ password: FALLBACK_KEY });
};

const defaultBoard = {
  id: nanoid(),
  name: 'Default Board',
  nodes: [],
  edges: []
};

const defaultSettings: GlobalSettings = {
  primaryColor: themeColors[0].value,
  boards: [defaultBoard],
  currentBoardId: defaultBoard.id,
  openai: { apiKey: '' },
  xai: { apiKey: '' },
  groq: { apiKey: '' },
  openrouter: { apiKey: '' },
  anthropic: { apiKey: '' },
  google: { apiKey: '' },
  customModels: defaultOllamaModels,
  temperature: 0.7,
  top_p: 0,
  max_tokens: 8192,
  frequency_penalty: 0,
  presence_penalty: 0,
  systemPrompt: '',
  snapToGrid: false,
  doubleClickZoom: true,
  panOnDrag: true,
  panOnScroll: false,
  zoomOnScroll: true,
  fitViewOnInit: true,
  lastSelectedModel: 'chatgpt-4o-latest'
};

interface StoreState {
  settings: GlobalSettings;
  setSettings: (settings: GlobalSettings) => void;
  clearAllData: () => Promise<void>;
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      setSettings: (settings) => set({ settings }),
      clearAllData: async () => {
        const storage = await getSecureStorage();
        storage.clear();
        set({ settings: defaultSettings });
      }
    }),
    {
      name: 'settings' as StorageKey,
      storage: {
        getItem: async (name) => {
          try {
            const storage = await getSecureStorage();
            return storage.getItem<StorageValue<StoreState>>(name as StorageKey);
          } catch (e) {
            console.error('Storage getItem failed:', e);
            return null;
          }
        },
        setItem: async (name, value) => {
          try {
            const storage = await getSecureStorage();
            storage.setItem(name as StorageKey, value);
          } catch (e) {
            console.error('Storage setItem failed:', e);
          }
        },
        removeItem: async (name) => {
          try {
            const storage = await getSecureStorage();
            storage.removeItem(name as StorageKey);
          } catch (e) {
            console.error('Storage removeItem failed:', e);
          }
        }
      }
    }
  )
);