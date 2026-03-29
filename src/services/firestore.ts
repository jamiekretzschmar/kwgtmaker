import { collection, addDoc, getDocs, query, where, orderBy, deleteDoc, doc, serverTimestamp, getDocFromServer, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { localDb, LocalWidget } from './localDb';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  if (errorMessage.includes('Missing or insufficient permissions')) {
    const errInfo: FirestoreErrorInfo = {
      error: errorMessage,
      authInfo: {
        userId: auth.currentUser?.uid,
        email: auth.currentUser?.email,
        emailVerified: auth.currentUser?.emailVerified,
        isAnonymous: auth.currentUser?.isAnonymous,
        tenantId: auth.currentUser?.tenantId,
        providerInfo: auth.currentUser?.providerData.map(provider => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL
        })) || []
      },
      operationType,
      path
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  }
  
  console.error(`Firestore ${operationType} failed at ${path}:`, error);
  throw error;
}

export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}

export interface WidgetData {
  id?: string;
  userId: string;
  prompt: string;
  aspectRatio: string;
  mockupUrl: string;
  instructions: string;
  presetJson?: any;
  createdAt: any;
}

// Convert local widget to the format expected by the UI
function mapLocalToWidgetData(local: LocalWidget): WidgetData {
  return {
    id: local.id,
    userId: local.userId,
    prompt: local.prompt,
    aspectRatio: local.aspectRatio,
    mockupUrl: local.mockupUrl,
    instructions: local.instructions,
    presetJson: local.presetJson,
    createdAt: local.createdAt, // We'll just use the number timestamp for now
  };
}

export async function saveWidget(data: Omit<WidgetData, 'id' | 'createdAt'>) {
  const now = Date.now();
  const localWidget: Omit<LocalWidget, 'id'> = {
    ...data,
    createdAt: now,
    updatedAt: now,
  };
  
  try {
    // Save locally first
    const id = await localDb.widgets.add(localWidget as LocalWidget);
    
    // Try to sync to cloud in background (fire and forget)
    if (auth.currentUser) {
      addDoc(collection(db, 'widgets'), {
        ...data,
        createdAt: serverTimestamp(),
      }).then(async (docRef) => {
        // Update local record with cloud ID
        await localDb.widgets.update(id, { cloudId: docRef.id });
      }).catch(e => console.warn("Background sync failed", e));
    }
    
    return id.toString();
  } catch (error) {
    console.error("Failed to save widget locally:", error);
    throw error;
  }
}

export async function updateWidget(widgetId: string, data: Partial<Omit<WidgetData, 'id' | 'createdAt' | 'userId'>>) {
  try {
    // Update locally
    await localDb.widgets.update(widgetId, {
      ...data,
      updatedAt: Date.now()
    });

    // Try to sync to cloud if it has a cloudId
    const widget = await localDb.widgets.get(widgetId);
    if (widget?.cloudId && auth.currentUser) {
      updateDoc(doc(db, 'widgets', widget.cloudId), data)
        .catch(e => console.warn("Background sync failed", e));
    }
  } catch (error) {
    console.error("Failed to update widget locally:", error);
    throw error;
  }
}

export async function loadWidgets(userId: string): Promise<WidgetData[]> {
  try {
    // Load from local DB
    const localWidgets = await localDb.widgets
      .where('userId')
      .equals(userId)
      .reverse()
      .sortBy('createdAt');
      
    return localWidgets.map(mapLocalToWidgetData);
  } catch (error) {
    console.error("Failed to load widgets locally:", error);
    return [];
  }
}

export async function getWidget(widgetId: string): Promise<WidgetData | null> {
  try {
    const localWidget = await localDb.widgets.get(widgetId);
    if (localWidget) {
      return mapLocalToWidgetData(localWidget);
    }
    return null;
  } catch (error) {
    console.error("Failed to get widget locally:", error);
    return null;
  }
}

export async function deleteWidget(widgetId: string) {
  try {
    const widget = await localDb.widgets.get(widgetId);
    
    // Delete locally
    await localDb.widgets.delete(widgetId);

    // Try to delete from cloud if it has a cloudId
    if (widget?.cloudId && auth.currentUser) {
      deleteDoc(doc(db, 'widgets', widget.cloudId))
        .catch(e => console.warn("Background sync failed", e));
    }
  } catch (error) {
    console.error("Failed to delete widget locally:", error);
    throw error;
  }
}

export async function saveFavoriteColors(userId: string, colors: string[]) {
  try {
    // Save locally
    await localDb.userSettings.put({
      userId,
      favoriteColors: colors,
      updatedAt: Date.now()
    });

    // Try to sync to cloud
    if (auth.currentUser) {
      setDoc(doc(db, 'userSettings', userId), {
        userId: userId,
        favoriteColors: colors,
      }, { merge: true }).catch(e => console.warn("Background sync failed", e));
    }
  } catch (error) {
    console.error("Failed to save favorite colors locally:", error);
    throw error;
  }
}

export async function loadFavoriteColors(userId: string): Promise<string[]> {
  try {
    // Try local first
    const localSettings = await localDb.userSettings.get(userId);
    if (localSettings) {
      return localSettings.favoriteColors;
    }

    // If not local, try cloud as fallback
    if (auth.currentUser) {
      try {
        const snapshot = await getDoc(doc(db, 'userSettings', userId));
        if (snapshot.exists()) {
          const colors = snapshot.data()?.favoriteColors || [];
          // Save to local for next time
          await saveFavoriteColors(userId, colors);
          return colors;
        }
      } catch (cloudError: any) {
        if (cloudError?.message?.includes('offline')) {
          console.warn("Cloud fallback for favorite colors skipped (client is offline).");
        } else {
          console.warn("Cloud fallback for favorite colors failed:", cloudError);
        }
      }
    }
    return [];
  } catch (error) {
    console.error("Failed to load favorite colors:", error);
    return [];
  }
}

export async function saveCustomPalette(userId: string, palette: { id: string; name: string; colors: string[] }) {
  try {
    const settings = await localDb.userSettings.get(userId) || { userId, favoriteColors: [], updatedAt: Date.now() };
    const customPalettes = settings.customPalettes || [];
    
    const existingIndex = customPalettes.findIndex(p => p.id === palette.id);
    if (existingIndex >= 0) {
      customPalettes[existingIndex] = palette;
    } else {
      customPalettes.push(palette);
    }

    await localDb.userSettings.put({
      ...settings,
      customPalettes,
      updatedAt: Date.now()
    });
  } catch (error) {
    console.error("Failed to save custom palette:", error);
    throw error;
  }
}

export async function loadCustomPalettes(userId: string) {
  try {
    const settings = await localDb.userSettings.get(userId);
    return settings?.customPalettes || [];
  } catch (error) {
    console.error("Failed to load custom palettes:", error);
    return [];
  }
}

export async function deleteCustomPalette(userId: string, paletteId: string) {
  try {
    const settings = await localDb.userSettings.get(userId);
    if (settings && settings.customPalettes) {
      settings.customPalettes = settings.customPalettes.filter(p => p.id !== paletteId);
      await localDb.userSettings.put({
        ...settings,
        updatedAt: Date.now()
      });
    }
  } catch (error) {
    console.error("Failed to delete custom palette:", error);
    throw error;
  }
}

export async function saveAsset(userId: string, type: 'font' | 'icon' | 'bitmap', name: string, file: File) {
  try {
    await localDb.assets.add({
      userId,
      type,
      name,
      data: file,
      createdAt: Date.now()
    });
  } catch (error) {
    console.error("Failed to save asset:", error);
    throw error;
  }
}

export async function loadAssets(userId: string, type: 'font' | 'icon' | 'bitmap') {
  try {
    return await localDb.assets
      .where('userId').equals(userId)
      .and(asset => asset.type === type)
      .toArray();
  } catch (error) {
    console.error("Failed to load assets:", error);
    return [];
  }
}

export async function deleteAsset(assetId: string) {
  try {
    await localDb.assets.delete(assetId);
  } catch (error) {
    console.error("Failed to delete asset:", error);
    throw error;
  }
}
