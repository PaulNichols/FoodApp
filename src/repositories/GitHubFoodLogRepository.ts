import type { FoodLogDay, FoodLogRepository, FoodPhoto, StorageSettings } from '../models/foodLog';
import { getFoodDateFromPath, getLastNDates } from '../services/dateService';
import {
  deleteContentFile,
  getContentJson,
  listRepositoryTree,
  putContentFile,
  testRepositoryAccess,
} from '../services/githubContentApi';

export class GitHubFoodLogRepository implements FoodLogRepository {
  constructor(
    private readonly settings: StorageSettings,
    private readonly token: string,
  ) {}

  async getDay(date: string): Promise<FoodLogDay | null> {
    const path = getDataPath(date);

    try {
      return await getContentJson<FoodLogDay>(this.settings, this.token, path);
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return null;
      }

      throw error;
    }
  }

  async saveDay(day: FoodLogDay, photos: FoodPhoto[]): Promise<void> {
    if (!this.token.trim()) {
      throw new Error('GitHub token is missing. Enter a fine-grained token so Save can update this repo.');
    }

    await testRepositoryAccess(this.settings, this.token);

    const dataPath = getDataPath(day.date);
    const existingDay = await this.getDay(day.date);
    const dayMessage = existingDay ? `Update food log for ${day.date}` : `Add food log for ${day.date}`;

    await putContentFile(this.settings, this.token, {
      path: dataPath,
      message: dayMessage,
      content: new Blob([JSON.stringify(day, null, 2)], { type: 'application/json' }),
    });

    for (const photo of photos) {
      await putContentFile(this.settings, this.token, {
        path: photo.path,
        message: `Update food photo for ${day.date}`,
        content: photo.blob,
      });
    }
  }

  async getRecentDays(days: number): Promise<FoodLogDay[]> {
    const dates = getLastNDates(days);
    const results = await Promise.all(dates.map((date) => this.getDay(date)));

    return results.filter((day): day is FoodLogDay => day !== null);
  }

  async cleanupOlderThan(cutoffDate: string): Promise<number> {
    const tree = await listRepositoryTree(this.settings, this.token);
    const oldFoodFiles = tree.filter((item) => {
      if (item.type !== 'blob') {
        return false;
      }

      const fileDate = getFoodDateFromPath(item.path);

      return fileDate !== null && fileDate < cutoffDate;
    });

    for (const file of oldFoodFiles) {
      await deleteContentFile(
        this.settings,
        this.token,
        file.path,
        file.sha,
        `Remove old food log data before ${cutoffDate}`,
      );
    }

    return oldFoodFiles.length;
  }
}

const getDataPath = (date: string): string => {
  const [year, month] = date.split('-');
  return `data/${year}/${month}/${date}.json`;
};
