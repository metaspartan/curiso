import { Encryption } from './encryption';

export const STORAGE_KEYS = ['settings', 'auth', 'boards'] as const;
export type StorageKey = (typeof STORAGE_KEYS)[number];

interface SecureStorageOptions {
  readonly password: string;
  readonly prefix?: string;
}

export class SecureStorage {
  private readonly password: string;
  private readonly prefix: string;

  constructor(options: SecureStorageOptions) {
    this.password = options.password;
    this.prefix = options.prefix ?? 'curiso';
  }

  private getFullKey(key: StorageKey): string {
    return `${this.prefix}:${key}`;
  }

  getItem<T>(key: StorageKey): T | null {
    const fullKey = this.getFullKey(key);
    const encrypted = localStorage.getItem(fullKey);
    if (!encrypted) return null;
    return Encryption.decrypt<T>(encrypted, this.password);
  }

  setItem(key: StorageKey, value: unknown): void {
    const fullKey = this.getFullKey(key);
    const encrypted = Encryption.encrypt(value, this.password);
    localStorage.setItem(fullKey, encrypted);
  }

  removeItem(key: StorageKey): void {
    const fullKey = this.getFullKey(key);
    localStorage.removeItem(fullKey);
  }

  clear(): void {
    STORAGE_KEYS.forEach(key => this.removeItem(key));
  }
}
