/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const DB_NAME = 'MoleMadnessDB';
const DB_VERSION = 1;
const STORE_NAME = 'custom_assets';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject(new Error('Failed to open IndexedDB database.'));
    };
  });
}

export async function savePhotosToDB(key: 'hisPhotos' | 'herPhotos', photos: string[]): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(photos, key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`Failed to save ${key} to IndexedDB.`));
    });
  } catch (error) {
    console.error('IndexedDB Error:', error);
  }
}

export async function loadPhotosFromDB(key: 'hisPhotos' | 'herPhotos'): Promise<string[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result || []);
      };
      request.onerror = () => reject(new Error(`Failed to load ${key} from IndexedDB.`));
    });
  } catch (error) {
    console.error('IndexedDB Error:', error);
    return [];
  }
}

export async function clearPhotosDB(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const req1 = store.delete('hisPhotos');
      const req2 = store.delete('herPhotos');

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(new Error('Failed to clear photo records from IndexedDB.'));
    });
  } catch (error) {
    console.error('IndexedDB Error:', error);
  }
}
