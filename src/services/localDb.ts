import Dexie, { Table } from 'dexie';

export interface LocalWidget {
  id?: number; // Auto-incremented local ID
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
  id?: number;
  userId: string;
  type: 'font' | 'icon' | 'bitmap';
  name: string;
  data: Blob; // The actual file data
  createdAt: number;
}

export interface LocalPalette {
  id?: number;
  userId: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  createdAt: number;
}

export class AppDatabase extends Dexie {
  widgets!: Table<LocalWidget, number>;
  userSettings!: Table<LocalUserSettings, string>;
  assets!: Table<LocalAsset, number>;
  palettes!: Table<LocalPalette, number>;

  constructor() {
    super('KwgtMakerDB');
    
    this.version(2).stores({
      widgets: '++id, cloudId, userId, createdAt, updatedAt',
      userSettings: 'userId',
      assets: '++id, userId, type, name',
      palettes: '++id, userId, name'
    });
  }
}

export const localDb = new AppDatabase();
