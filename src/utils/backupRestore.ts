import { localDb } from '../services/localDb';

export async function exportAllData() {
  try {
    const widgets = await localDb.widgets.toArray();
    const userSettings = await localDb.userSettings.toArray();
    const assets = await localDb.assets.toArray();

    // Convert blobs to base64 for JSON export
    const serializedAssets = await Promise.all(
      assets.map(async (asset) => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve({
              ...asset,
              data: reader.result, // base64 string
            });
          };
          reader.readAsDataURL(asset.data);
        });
      })
    );

    const backupData = {
      version: 1,
      timestamp: Date.now(),
      data: {
        widgets,
        userSettings,
        assets: serializedAssets,
      },
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `kwgtmaker_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Export failed:', error);
    throw error;
  }
}

export async function importData(file: File) {
  try {
    const text = await file.text();
    const backupData = JSON.parse(text);

    if (!backupData.version || !backupData.data) {
      throw new Error('Invalid backup file format');
    }

    const { widgets, userSettings, assets } = backupData.data;

    await localDb.transaction('rw', localDb.widgets, localDb.userSettings, localDb.assets, async () => {
      // Clear existing data (optional, maybe ask user first in UI)
      // await localDb.widgets.clear();
      // await localDb.userSettings.clear();
      // await localDb.assets.clear();

      if (widgets && widgets.length > 0) {
        await localDb.widgets.bulkPut(widgets);
      }
      
      if (userSettings && userSettings.length > 0) {
        await localDb.userSettings.bulkPut(userSettings);
      }

      if (assets && assets.length > 0) {
        // Convert base64 back to Blob
        const deserializedAssets = await Promise.all(
          assets.map(async (asset: any) => {
            const res = await fetch(asset.data);
            const blob = await res.blob();
            return {
              ...asset,
              data: blob,
            };
          })
        );
        await localDb.assets.bulkPut(deserializedAssets);
      }
    });

    return true;
  } catch (error) {
    console.error('Import failed:', error);
    throw error;
  }
}
