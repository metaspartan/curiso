import { create } from 'zustand';
import { persist, type StorageValue } from 'zustand/middleware';
import type { CustomModel, GlobalSettings } from './types';
import { SecureStorage, StorageKey } from './secureStorage';
import { nanoid } from 'nanoid';
import { themeColors } from './constants';
import { defaultLocalModels } from './localmodels';
import { VectorDB } from './db';
import { useMetricsStore } from './metricstore';

export const STORE_VERSION = 7;
const MASTER_KEY = import.meta.env.VITE_MASTER_KEY ?? 'default-master-key';
const FALLBACK_KEY = import.meta.env.VITE_FALLBACK_KEY ?? 'default-fallback-key';

const getSecureStorage = async () => {
  if (window.crypto.subtle) {
    try {
      const encoder = new TextEncoder();
      const keyBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(MASTER_KEY));
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
  edges: [],
};

const defaultSettings: GlobalSettings = {
  hotkeys: {
    newNode: 'Cmd+N',
    newBoard: 'Cmd+Shift+N',
    deleteBoard: 'Cmd+Shift+D',
    dNode: 'Cmd+D',
  },
  version: STORE_VERSION,
  rag: {
    enabled: false,
    similarityThreshold: 0.1,
    chunkSize: 1000,
    documents: [],
    websites: [],
    supportedModels: [],
    embeddingModel: 'Xenova/bge-base-en-v1.5',
    modelStatus: 'unloaded',
  },
  primaryColor: themeColors[0].value,
  boards: [defaultBoard],
  currentBoardId: defaultBoard.id,
  openai: { apiKey: '' },
  deepseek: { apiKey: '' },
  perplexity: { apiKey: '' },
  xai: { apiKey: '' },
  wai: { apiKey: '' },
  inferencenet: { apiKey: '' },
  alibabacloud: { apiKey: '' },
  nvidia: { apiKey: '' },
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
  lastSelectedModel: 'chatgpt-4o-latest',
  streaming: false,
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
      websites: state.rag?.websites || [],
    },
  }),
  1: (state: any) => ({
    ...state,
    version: 2,
    rag: {
      ...state.rag,
      documents:
        state.rag?.documents?.map((doc: any) => ({
          ...doc,
          metrics: doc.metrics || {},
        })) || [],
      websites: state.rag?.websites || [],
    },
  }),
  2: (state: any) => ({
    ...state,
    version: 3,
    hotkeys: {
      ...defaultSettings.hotkeys,
      ...state.hotkeys,
    },
  }),
  3: (state: any) => ({
    ...state,
    version: 4,
    deepseek: { apiKey: '' },
  }),
  4: (state: any) => ({
    ...state,
    version: 5,
    perplexity: { apiKey: '' },
  }),
  5: (state: any) => ({
    ...state,
    version: 6,
  }),
  6: (state: any) => ({
    ...state,
    version: 7,
    wai: { apiKey: '' },
    inferencenet: { apiKey: '' },
    alibabacloud: { apiKey: '' },
    nvidia: { apiKey: '' },
  }),
};

const migrateStore = (persistedState: any): any => {
  let state = persistedState?.settings || persistedState;

  console.log('Starting migration from version:', state.version);

  // Special case 1: Handle broken v7 stores
  if (state.version === 7) {
    console.log('Fixing potentially broken v7 store');
    return {
      settings: {
        ...defaultSettings,
        ...state,
        // Preserve existing API keys while ensuring all fields exist
        openai: state.openai || { apiKey: '' },
        deepseek: state.deepseek || { apiKey: '' },
        perplexity: state.perplexity || { apiKey: '' },
        xai: state.xai || { apiKey: '' },
        wai: state.wai || { apiKey: '' },
        inferencenet: state.inferencenet || { apiKey: '' },
        alibabacloud: state.alibabacloud || { apiKey: '' },
        groq: state.groq || { apiKey: '' },
        openrouter: state.openrouter || { apiKey: '' },
        anthropic: state.anthropic || { apiKey: '' },
        google: state.google || { apiKey: '' },
        nvidia: state.nvidia || { apiKey: '' },
      },
    };
  }

  // Special case 2: Handle v6 stores that need to migrate
  if (state.version === 6) {
    console.log('Migrating v6 store with proper API fields');
    return {
      settings: {
        ...state,
        version: 7,
        wai: { apiKey: '' },
        inferencenet: { apiKey: '' },
        alibabacloud: { apiKey: '' },
        groq: state.groq || { apiKey: '' },
        openrouter: state.openrouter || { apiKey: '' },
        anthropic: state.anthropic || { apiKey: '' },
        google: state.google || { apiKey: '' },
        nvidia: state.nvidia || { apiKey: '' },
      },
    };
  }

  // Handle legacy stores without version
  if (!state.version) {
    console.log('Migrating legacy store without version');
    state = {
      ...defaultSettings,
      ...state,
      version: 0,
    };
  }

  // Normal migration path
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
    set => ({
      settings: defaultSettings,
      setSettings: settings => set({ settings }),
      updateCustomModels: models =>
        set(state => ({
          settings: {
            ...state.settings,
            customModels: models,
          },
        })),
      clearAllData: async () => {
        const storage = await getSecureStorage();
        storage.clear();

        localStorage.removeItem('hasSeenWelcome');

        // Clear metrics store
        useMetricsStore.getState().resetMetrics();

        // Clear VectorDB IndexedDB
        const db = new VectorDB();
        await db.clearAll();

        // Clear embedding models from Browser Cache Storage
        const cacheKeys = await caches.keys();
        for (const key of cacheKeys) {
          // if (key.includes('transformers')) {
          await caches.delete(key);
          console.log('Cleared cache:', key);
          // }
        }

        // Garbage collect
        if (globalThis.gc) {
          globalThis.gc();
        }

        set({ settings: defaultSettings });
      },
    }),
    {
      name: 'settings' as StorageKey,
      storage: {
        getItem: async name => {
          try {
            const storage = await getSecureStorage();
            const data = await storage.getItem<StorageValue<StoreState>>(name as StorageKey);

            if (data) {
              const migratedState = migrateStore(data.state);
              return {
                ...data,
                state: migratedState,
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
        removeItem: async name => {
          try {
            const storage = await getSecureStorage();
            storage.removeItem(name as StorageKey);
          } catch (e) {
            console.error('Storage removeItem failed:', e);
          }
        },
      },
    }
  )
);
