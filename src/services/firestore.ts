import { collection, addDoc, getDocs, query, where, orderBy, deleteDoc, doc, serverTimestamp, getDocFromServer, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';

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
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
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
  kodes?: string;
  createdAt: any;
}

export async function saveWidget(data: Omit<WidgetData, 'id' | 'createdAt'>) {
  const path = 'widgets';
  try {
    const docRef = await addDoc(collection(db, path), {
      ...data,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateWidget(widgetId: string, data: Partial<Omit<WidgetData, 'id' | 'createdAt' | 'userId'>>) {
  const path = `widgets/${widgetId}`;
  try {
    await updateDoc(doc(db, 'widgets', widgetId), {
      ...data,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function loadWidgets(userId: string): Promise<WidgetData[]> {
  const path = 'widgets';
  try {
    const q = query(
      collection(db, path),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WidgetData));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function getWidget(widgetId: string): Promise<WidgetData | null> {
  const path = `widgets/${widgetId}`;
  try {
    const snapshot = await getDocFromServer(doc(db, 'widgets', widgetId));
    if (snapshot.exists()) {
      return { id: snapshot.id, ...snapshot.data() } as WidgetData;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

export async function deleteWidget(widgetId: string) {
  const path = `widgets/${widgetId}`;
  try {
    await deleteDoc(doc(db, 'widgets', widgetId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
