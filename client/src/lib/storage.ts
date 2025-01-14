import { openDB, type IDBPDatabase } from 'idb';
import { Encryption } from "./encryption";
import type { GlobalSettings } from './types';
import { useStore } from './store';
import { VectorDB } from './db';

const DB_NAME = 'curiso-db';
const DB_VERSION = 1;

async function getDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('documents')) {
        db.createObjectStore('documents', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('websites')) {
        db.createObjectStore('websites', { keyPath: 'id' });
      }
    },
  });
}

export const exportData = async (password: string) => {
  const settings = useStore.getState().settings;
  const vectorDB = new VectorDB();
  const db = await getDB();
  
  // Get vector database contents
  const documents = await vectorDB.documents.toArray();
  const websites = await db.getAll('websites');
  
  // Combine all data
  const exportData = {
    settings,
    vectorDB: documents,
    websites
  };
  
  // Encrypt the combined data
  const encrypted = Encryption.encrypt(exportData, password);
  
  // Create and download file
  const blob = new Blob([encrypted], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `curiso-backup-${new Date().toISOString()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const importData = async (file: File, password: string): Promise<void> => {
  const text = await file.text();
  const decrypted = Encryption.decrypt<{
    settings: GlobalSettings;
    vectorDB: any[];
    websites: any[];
  }>(text, password);
  
  if (!decrypted || !decrypted.settings) {
    throw new Error('Invalid backup file format');
  }
  
  // Update settings
  useStore.setState({ settings: decrypted.settings });
  
  // Update vector database
  const vectorDB = new VectorDB();
  await vectorDB.clearAll();
  
  if (decrypted.vectorDB) {
    for (const doc of decrypted.vectorDB) {
      await vectorDB.addDocument(
        doc.embedding,
        doc.content,
        JSON.parse(doc.metadata)
      );
    }
  }
  
  // Update websites database
  if (decrypted.websites) {
    const db = await getDB();
    const tx = db.transaction('websites', 'readwrite');
    await tx.objectStore('websites').clear();
    for (const website of decrypted.websites) {
      await tx.objectStore('websites').add(website);
    }
    await tx.done;
  }
};