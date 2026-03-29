import Dexie, { Table } from 'dexie';

export interface LocalWidget {
  id?: string; // Auto-incremented local ID
  cloudId?: string; // ID from Firestore if it was synced
  userId: string;
  prompt: string;
  aspectRatio: string;
  mockupUrl: string; // Base64 or local blob URL
  instructions: string;
  presetJson?: any;
  createdAt: number; // Timestamp
  updatedAt: number;
}

export interface LocalUserSettings {
  userId: string; // Primary key
  favoriteColors: string[];
  customPalettes?: { id: string; name: string; colors: string[] }[];
  updatedAt: number;
}

export interface LocalAsset {
  id?: string;
  userId: string;
  type: 'font' | 'icon' | 'bitmap';
  name: string;
  data: Blob; // The actual file data
  createdAt: number;
}

export class AppDatabase extends Dexie {
  widgets!: Table<LocalWidget, string>;
  userSettings!: Table<LocalUserSettings, string>;
  assets!: Table<LocalAsset, string>;

  constructor() {
    super('KwgtMakerDB');
    
    this.version(1).stores({
      widgets: '++id, cloudId, userId, createdAt, updatedAt',
      userSettings: 'userId',
      assets: '++id, userId, type, name'
    });
  }
}

export const localDb = new AppDatabase();
