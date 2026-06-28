export type MealSlot = 'breakfast' | 'lunch' | 'evening-meal';

export interface SupplementItem {
  name: string;
  taken: boolean;
  notes: string;
}

export interface SupplementLog {
  morningSupplementsTaken: boolean;
  items: SupplementItem[];
  notes: string;
}

export interface MealLog {
  slot: MealSlot;
  label: string;
  templateId: string;
  templateName: string;
  usedDefault: boolean;
  notes: string;
  photoPath: string | null;
  ingredients?: string[];
}

export interface SnackLog {
  id: string;
  notes: string;
  photoPath: string | null;
}

export interface FoodLogDay {
  date: string;
  timezone: string;
  supplements: SupplementLog;
  meals: MealLog[];
  snacks: SnackLog[];
  dailyNotes: string;
  createdAt: string;
  updatedAt: string;
}

export interface FoodPhoto {
  path: string;
  blob: Blob;
  contentType: string;
}

export type StorageMode = 'local' | 'github';

export interface StorageSettings {
  mode: StorageMode;
  githubOwner: string;
  githubRepo: string;
  branch: string;
}

export interface FoodLogRepository {
  getDay(date: string): Promise<FoodLogDay | null>;
  saveDay(day: FoodLogDay, photos: FoodPhoto[]): Promise<void>;
  getRecentDays(days: number): Promise<FoodLogDay[]>;
}

export const TIMEZONE = 'Australia/Brisbane';

export const lunchShakeIngredients = [
  'spinach or kale',
  'oats',
  'ground flaxseed or walnuts',
  'avocado',
  'frozen berries',
  'soy milk',
  'water',
  'cinnamon',
  'optional psyllium husk',
];

export const supplementNames = ['Creatine', 'AgeMate', 'Collagen peptides'];

const deprecatedSupplementNames = new Set(['Other daily supplements']);

export const mealTemplates: MealLog[] = [
  {
    slot: 'breakfast',
    label: 'Breakfast',
    templateId: 'man-shake-wpi',
    templateName: 'Man Shake + 2 scoops WPI protein',
    usedDefault: true,
    notes: '',
    photoPath: null,
  },
  {
    slot: 'lunch',
    label: 'Lunch',
    templateId: 'paul-lunch-shake',
    templateName: "Paul's lunch shake",
    usedDefault: true,
    notes: '',
    photoPath: null,
    ingredients: lunchShakeIngredients,
  },
  {
    slot: 'evening-meal',
    label: 'Evening meal',
    templateId: 'man-shake-wpi',
    templateName: 'Man Shake + 2 scoops WPI protein',
    usedDefault: true,
    notes: '',
    photoPath: null,
  },
];

export const createDefaultFoodLogDay = (date: string, now: string): FoodLogDay => ({
  date,
  timezone: TIMEZONE,
  supplements: {
    morningSupplementsTaken: true,
    items: supplementNames.map((name) => ({ name, taken: true, notes: '' })),
    notes: '',
  },
  meals: mealTemplates.map((meal) => ({ ...meal, ingredients: meal.ingredients ? [...meal.ingredients] : undefined })),
  snacks: [],
  dailyNotes: '',
  createdAt: now,
  updatedAt: now,
});

export const normalizeFoodLogDay = (day: FoodLogDay): FoodLogDay => ({
  ...day,
  supplements: {
    ...day.supplements,
    items: day.supplements.items.filter((item) => !deprecatedSupplementNames.has(item.name)),
  },
});

export const getMeal = (day: FoodLogDay, slot: MealSlot): MealLog => {
  const meal = day.meals.find((item) => item.slot === slot);

  if (!meal) {
    throw new Error(`Missing meal slot: ${slot}`);
  }

  return meal;
};
