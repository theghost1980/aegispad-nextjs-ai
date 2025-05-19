const DB_NAME = "AegisPadDB";
const DB_VERSION = 1;
const STORE_NAME = "userSessionData";

export type IndexedDBKey =
  | "currentUserHiveUsername"
  | "lastLoginTimestamp"
  | "sessionTokensUsed"
  | "refreshToken"
  | "accessToken";

interface StoredItem {
  key: IndexedDBKey;
  value: any;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error("IndexedDB error:", request.error);
      reject(new Error(`IndexedDB error: ${request.error?.message}`));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "key" });
      }
    };
  });
}

export async function getItem<T>(key: IndexedDBKey): Promise<T | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(key);

    request.onerror = () => {
      reject(new Error(`Error getting item ${key}: ${request.error?.message}`));
    };

    request.onsuccess = () => {
      if (request.result) {
        resolve(request.result.value as T);
      } else {
        resolve(null);
      }
    };
  });
}

export async function setItem(key: IndexedDBKey, value: any): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const item: StoredItem = { key, value };
    const request = store.put(item);

    request.onerror = () => {
      reject(new Error(`Error setting item ${key}: ${request.error?.message}`));
    };

    request.onsuccess = () => {
      resolve();
    };
  });
}

export async function removeItem(key: IndexedDBKey): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(key);

    request.onerror = () => {
      reject(
        new Error(`Error removing item ${key}: ${request.error?.message}`)
      );
    };

    request.onsuccess = () => {
      resolve();
    };
  });
}

export async function clearUserSessionData(): Promise<void> {
  const keysToClear: IndexedDBKey[] = [
    "currentUserHiveUsername",
    "lastLoginTimestamp",
    "sessionTokensUsed",
    "refreshToken",
    "accessToken",
  ];
  for (const key of keysToClear) {
    await removeItem(key);
  }
}
