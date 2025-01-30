import { AES, enc, lib, PBKDF2, mode, pad } from 'crypto-js';

interface EncryptionConfig {
  readonly iterations: number;
  readonly keySize: number;
  readonly saltSize: number;
}

export class Encryption {
  private static readonly config: EncryptionConfig = {
    iterations: 10000,
    keySize: 256 / 32,
    saltSize: 128 / 8,
  };

  private static generateSalt(): string {
    return lib.WordArray.random(this.config.saltSize).toString();
  }

  private static deriveKey(password: string, salt: string): lib.WordArray {
    return PBKDF2(password, salt, {
      keySize: this.config.keySize,
      iterations: this.config.iterations,
    });
  }

  static encrypt(data: unknown, password: string): string {
    try {
      const jsonString = JSON.stringify(data);
      return AES.encrypt(jsonString, password).toString();
    } catch (e) {
      console.error('Encryption failed:', e);
      return '';
    }
  }

  static decrypt<T>(encryptedData: string, password: string): T | null {
    try {
      const decrypted = AES.decrypt(encryptedData, password);
      const jsonString = decrypted.toString(enc.Utf8);
      return JSON.parse(jsonString);
    } catch (e) {
      console.error('Decryption failed:', e);
      return null;
    }
  }
}
