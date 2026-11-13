/** Minimal IndexedDB wrapper: projects, blobs (photos, logo, custom music), local templates. */
const DB_NAME = 'lamsa';
const VERSION = 1;
export type StoreName = 'projects' | 'blobs' | 'localTemplates';

let dbp: Promise<IDBDatabase> | null = null;

function open(): Promise<IDBDatabase> {
  if (!dbp) {
    dbp = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        for (const s of ['projects', 'blobs', 'localTemplates']) if (!db.objectStoreNames.contains(s)) db.createObjectStore(s);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbp;
}

function tx<T>(store: StoreName, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(store, mode);
        const req = fn(t.objectStore(store));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      }),
  );
}

export const db = {
  get: <T>(store: StoreName, key: string) => tx<T | undefined>(store, 'readonly', (s) => s.get(key)),
  put: <T>(store: StoreName, key: string, value: T) => tx(store, 'readwrite', (s) => s.put(value, key)).then(() => {}),
  del: (store: StoreName, key: string) => tx(store, 'readwrite', (s) => s.delete(key)).then(() => {}),
  all: <T>(store: StoreName) => tx<T[]>(store, 'readonly', (s) => s.getAll()),
  keys: (store: StoreName) => tx<IDBValidKey[]>(store, 'readonly', (s) => s.getAllKeys()),
};

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

// ---- blobs → object URLs (kept for the session) -----------------------------------

const urlCache = new Map<string, string>();

export async function putBlob(blob: Blob): Promise<string> {
  const id = uid();
  await db.put('blobs', id, blob);
  urlCache.set(id, URL.createObjectURL(blob));
  return id;
}

export async function blobUrl(id: string): Promise<string | undefined> {
  const hit = urlCache.get(id);
  if (hit) return hit;
  const b = await db.get<Blob>('blobs', id);
  if (!b) return undefined;
  const u = URL.createObjectURL(b);
  urlCache.set(id, u);
  return u;
}

export async function getBlob(id: string) {
  return db.get<Blob>('blobs', id);
}
