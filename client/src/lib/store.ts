import { create } from 'zustand';
import { persist, type StorageValue } from 'zustand/middleware';
import type { CustomModel, GlobalSettings } from './types';
import { SecureStorage, StorageKey } from './secureStorage';
import { nanoid } from 'nanoid';
import { themeColors } from './constants';
import { defaultLocalModels } from './localmodels';
import { VectorDB } from './db';

const STORE_VERSION = 2;
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
  version: STORE_VERSION,
  rag: {
    enabled: false,
    similarityThreshold: 0.1,
    chunkSize: 1000,
    documents: [],
    websites: [],
    supportedModels: [],
    embeddingModel: 'Xenova/bge-base-en-v1.5',
    modelStatus: 'unloaded'
  },
  primaryColor: themeColors[0].value,
  boards: [defaultBoard],
  currentBoardId: defaultBoard.id,
  openai: { apiKey: '' },
  xai: { apiKey: '' },
  groq: { apiKey: '' },
  openrouter: { apiKey: '' },
  anthropic: { apiKey: '' },
  google: { apiKey: '' },
  customModels: defaultLocalModels,
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

// Migration functions for each version
const migrations = {
  0: (state: any) => ({
    ...defaultSettings,
    ...state,
    version: 1,
    rag: {
      ...defaultSettings.rag,
      ...state.rag,
      websites: state.rag?.websites || []
    }
  }),
  1: (state: any) => ({
    ...state,
    version: 2,
    rag: {
      ...state.rag,
      documents: state.rag?.documents?.map((doc: any) => ({
        ...doc,
        metrics: doc.metrics || {}
      })) || [],
      websites: state.rag?.websites || []
    }
  })
};

const migrateStore = (persistedState: any): any => {
  // Handle old store format where settings were directly in state
  let state = persistedState?.settings || persistedState;
  
  // If no version, start from 0 and merge with default settings to ensure all fields exist
  if (!state.version) {
    console.log('Migrating legacy store without version');
    state = {
      ...defaultSettings,
      ...state,
      version: 0
    };
  }
  
  // Apply all migrations sequentially
  for (let v = state.version; v < STORE_VERSION; v++) {
    if (migrations[v as keyof typeof migrations]) {
      console.log(`Migrating store from version ${v} to ${v + 1}`);
      state = migrations[v as keyof typeof migrations](state);
    }
  }

  return { settings: state };
};

interface StoreState {
  settings: GlobalSettings;
  setSettings: (settings: GlobalSettings) => void;
  clearAllData: () => Promise<void>;
  updateCustomModels: (models: CustomModel[]) => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      setSettings: (settings) => set({ settings }),
      updateCustomModels: (models) => set((state) => ({
        settings: {
          ...state.settings,
          customModels: models
        }
      })),
      clearAllData: async () => {
        const storage = await getSecureStorage();
        storage.clear();
        const db = new VectorDB();
        await db.clearAll();
        set({ settings: defaultSettings });
      }
    }),
    {
      name: 'settings' as StorageKey,
      storage: {
        getItem: async (name) => {
          try {
            const storage = await getSecureStorage();
            const data = await storage.getItem<StorageValue<StoreState>>(name as StorageKey);
            
            if (data) {
              const migratedState = migrateStore(data.state);
              return {
                ...data,
                state: migratedState
              };
            }
            return null;
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