import type { FoodLogDay, FoodLogRepository, FoodPhoto } from '../models/foodLog';
import { getFoodDateFromPath, getLastNDates } from '../services/dateService';

interface StoredPhoto {
  path: string;
  blob: Blob;
  contentType: string;
  updatedAt: string;
}

const DB_NAME = 'food-log-tracker';
const DB_VERSION = 1;
const DAYS_STORE = 'days';
const PHOTOS_STORE = 'photos';

const openDatabase = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(DAYS_STORE)) {
        db.createObjectStore(DAYS_STORE, { keyPath: 'date' });
      }

      if (!db.objectStoreNames.contains(PHOTOS_STORE)) {
        db.createObjectStore(PHOTOS_STORE, { keyPath: 'path' });
      }
    };

    request.onerror = () => reject(request.error ?? new Error('Unable to open local food log storage.'));
    request.onsuccess = () => resolve(request.result);
  });

const requestToPromise = <T>(request: IDBRequest<T>): Promise<T> =>
  new Promise((resolve, reject) => {
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed.'));
    request.onsuccess = () => resolve(request.result);
  });

const transactionDone = (transaction: IDBTransaction): Promise<void> =>
  new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB transaction failed.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB transaction aborted.'));
  });

export class LocalFoodLogRepository implements FoodLogRepository {
  async getDay(date: string): Promise<FoodLogDay | null> {
    const db = await openDatabase();
    const transaction = db.transaction(DAYS_STORE, 'readonly');
    const result = await requestToPromise<FoodLogDay | undefined>(transaction.objectStore(DAYS_STORE).get(date));

    db.close();
    return result ?? null;
  }

  async saveDay(day: FoodLogDay, photos: FoodPhoto[]): Promise<void> {
    const db = await openDatabase();
    const transaction = db.transaction([DAYS_STORE, PHOTOS_STORE], 'readwrite');

    transaction.objectStore(DAYS_STORE).put(day);

    for (const photo of photos) {
      const storedPhoto: StoredPhoto = {
        path: photo.path,
        blob: photo.blob,
        contentType: photo.contentType,
        updatedAt: day.updatedAt,
      };
      transaction.objectStore(PHOTOS_STORE).put(storedPhoto);
    }

    await transactionDone(transaction);
    db.close();
  }

  async getRecentDays(days: number): Promise<FoodLogDay[]> {
    const dates = getLastNDates(days);
    const results = await Promise.all(dates.map((date) => this.getDay(date)));

    return results.filter((day): day is FoodLogDay => day !== null);
  }

  async getPhoto(path: string): Promise<FoodPhoto | null> {
    const db = await openDatabase();
    const transaction = db.transaction(PHOTOS_STORE, 'readonly');
    const result = await requestToPromise<StoredPhoto | undefined>(transaction.objectStore(PHOTOS_STORE).get(path));

    db.close();

    return result ? { path: result.path, blob: result.blob, contentType: result.contentType } : null;
  }

  async clearAll(): Promise<void> {
    const db = await openDatabase();
    const transaction = db.transaction([DAYS_STORE, PHOTOS_STORE], 'readwrite');

    transaction.objectStore(DAYS_STORE).clear();
    transaction.objectStore(PHOTOS_STORE).clear();

    await transactionDone(transaction);
    db.close();
  }

  async cleanupOlderThan(cutoffDate: string): Promise<number> {
    const db = await openDatabase();
    const transaction = db.transaction([DAYS_STORE, PHOTOS_STORE], 'readwrite');
    const dayStore = transaction.objectStore(DAYS_STORE);
    const photoStore = transaction.objectStore(PHOTOS_STORE);
    let deletedCount = 0;

    const dayKeys = await requestToPromise<IDBValidKey[]>(dayStore.getAllKeys());
    for (const key of dayKeys) {
      if (typeof key === 'string' && key < cutoffDate) {
        dayStore.delete(key);
        deletedCount += 1;
      }
    }

    const photoKeys = await requestToPromise<IDBValidKey[]>(photoStore.getAllKeys());
    for (const key of photoKeys) {
      if (typeof key !== 'string') {
        continue;
      }

      const photoDate = getFoodDateFromPath(key);

      if (photoDate && photoDate < cutoffDate) {
        photoStore.delete(key);
        deletedCount += 1;
      }
    }

    await transactionDone(transaction);
    db.close();

    return deletedCount;
  }
}
