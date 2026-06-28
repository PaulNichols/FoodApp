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

export type FoodAnalysisSource = 'manual' | 'openai' | 'codex';

export type FoodAnalysisConfidence = 'low' | 'medium' | 'high';

export interface FoodNutritionBreakdown {
  proteinGrams: number | null;
  carbohydrateGrams: number | null;
  fatGrams: number | null;
  sugarGrams: number | null;
  fibreGrams: number | null;
}

export interface FoodItemAnalysis {
  itemName: string;
  calories: number | null;
  nutrition?: FoodNutritionBreakdown;
  confidence: FoodAnalysisConfidence | null;
  source: FoodAnalysisSource;
  notes: string;
  updatedAt: string;
  inputHash?: string;
}

export interface MealLog {
  slot: MealSlot;
  label: string;
  templateId: string;
  templateName: string;
  usedDefault: boolean;
  notes: string;
  photoPath: string | null;
  analysis?: FoodItemAnalysis;
  ingredients?: string[];
}

export interface SnackLog {
  id: string;
  notes: string;
  photoPath: string | null;
  analysis?: FoodItemAnalysis;
}

export interface WaterIntakeEntry {
  id: string;
  label: string;
  amountMl: string;
  consumed: boolean;
}

export interface WaterIntakeLog {
  entries: WaterIntakeEntry[];
}

export interface FoodLogDay {
  date: string;
  timezone: string;
  supplements: SupplementLog;
  meals: MealLog[];
  snacks: SnackLog[];
  waterIntake: WaterIntakeLog;
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
  'spinach or kale: 1 cup',
  'avocado: 1/2',
  'frozen mixed berries: 1/2 cup',
  'oats: 1/4 cup',
  'ground flaxseeds or walnuts: 2 tbsp',
  'protein powder: 1 scoop',
  'soy milk: 1 cup',
  'cinnamon powder: 1/2 tsp',
  'cacao nibs: 1 tsp',
  'plant sterol powder: 1 tsp optional',
  'Default lunch shake calories: about 500 Cal with flaxseeds and WPI; walnuts, soy milk brand, avocado size, and plant sterol powder may change this',
];

export const supplementNames = ['Creatine', 'AgeMate', 'Collagen peptides'];

const deprecatedSupplementNames = new Set(['Other daily supplements']);

export const defaultWaterIntakeEntries: WaterIntakeEntry[] = [
  { id: 'coffee', label: 'Coffee', amountMl: '400', consumed: true },
  { id: 'water-bottle', label: 'Bottle of water', amountMl: '700', consumed: true },
  { id: 'agemate', label: 'AgeMate', amountMl: '240', consumed: true },
  { id: 'water-glass', label: 'Glass of water', amountMl: '400', consumed: true },
];

export const wpiProteinServingNutrition = [
  'WPI protein serving: 2 scoops = 30 g',
  'WPI protein per 30 g serving: 124 Cal (519 kJ)',
  'WPI protein per 30 g serving: 24 g protein',
  'WPI protein per 30 g serving: 1.8 g fat, 1.5 g saturated fat',
  'WPI protein per 30 g serving: 1.8 g carbohydrate, 1.8 g sugars/lactose',
  'WPI protein per 30 g serving: 0 g fibre, 93 mg sodium, 123 mg calcium',
];

export const manShakeServingNutrition = [
  'Man Shake serving: 56 g',
  'Man Shake per 56 g serving: 203 Cal (850 kJ)',
  'Man Shake per 56 g serving: 29.4 g protein',
  'Man Shake per 56 g serving: 2.5 g fat, 2.0 g saturated fat',
  'Man Shake per 56 g serving: 9.9 g carbohydrate, 2.3 g sugars',
  'Man Shake per 56 g serving: 6.9 g dietary fibre',
  'Man Shake per 56 g serving: 160 mg sodium, 40 mg potassium',
  'Man Shake per 56 g serving: 400 mg calcium, 3.3 mg iron, 130 mg magnesium',
  'Man Shake per 56 g serving: 380 mg phosphorus, 4.8 mg zinc',
  'Default Man Shake + WPI calories: 327 Cal (203 Cal Man Shake + 124 Cal WPI)',
];

const manShakeWpiIngredients = [...manShakeServingNutrition, ...wpiProteinServingNutrition];

export const createDefaultMealAnalysis = (meal: MealLog, updatedAt: string): FoodItemAnalysis | undefined => {
  if (!meal.usedDefault) {
    return undefined;
  }

  if (meal.templateId === 'man-shake-wpi') {
    return {
      itemName: meal.templateName,
      calories: 327,
      nutrition: {
        proteinGrams: 53.4,
        carbohydrateGrams: 11.7,
        fatGrams: 4.3,
        sugarGrams: 4.1,
        fibreGrams: 6.9,
      },
      confidence: 'high',
      source: 'codex',
      notes: 'Label-based default: Man Shake 56 g serving = 203 Cal plus WPI 2 scoops/30 g = 124 Cal.',
      updatedAt,
      inputHash: `codex:${meal.slot}:man-shake-wpi:v3-man-shake-label`,
    };
  }

  if (meal.templateId === 'paul-lunch-shake') {
    return {
      itemName: meal.templateName,
      calories: 500,
      nutrition: {
        proteinGrams: 27,
        carbohydrateGrams: 40,
        fatGrams: 25,
        sugarGrams: 8,
        fibreGrams: 15,
      },
      confidence: 'medium',
      source: 'codex',
      notes:
        'Recipe-based estimate from saved quantities: 1 cup greens, 1/2 avocado, 1/2 cup berries, 1/4 cup oats, 2 tbsp flaxseeds or walnuts, 1 scoop protein powder, 1 cup soy milk, cinnamon, cacao nibs, optional plant sterol powder.',
      updatedAt,
      inputHash: `codex:${meal.slot}:paul-lunch-shake:v2-recipe-quantities`,
    };
  }

  return undefined;
};

export const mealTemplates: MealLog[] = [
  {
    slot: 'breakfast',
    label: 'Breakfast',
    templateId: 'man-shake-wpi',
    templateName: 'Man Shake + 2 scoops WPI protein',
    usedDefault: true,
    notes: '',
    photoPath: null,
    ingredients: manShakeWpiIngredients,
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
    ingredients: manShakeWpiIngredients,
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
  meals: mealTemplates.map((meal) => ({
    ...meal,
    ingredients: meal.ingredients ? [...meal.ingredients] : undefined,
    analysis: createDefaultMealAnalysis(meal, now),
  })),
  snacks: [],
  waterIntake: {
    entries: defaultWaterIntakeEntries.map((entry) => ({ ...entry })),
  },
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
  waterIntake: normalizeWaterIntake(day.waterIntake),
});

export const parseWaterAmountMl = (amountMl: string): number | null => {
  const match = amountMl.replace(',', '').match(/\d+(\.\d+)?/);
  const value = match ? Number(match[0]) : Number.NaN;

  return Number.isFinite(value) && value >= 0 ? value : null;
};

export const getWaterIntakeTotalMl = (waterIntake: WaterIntakeLog | undefined): number | null => {
  const values = (waterIntake?.entries ?? [])
    .filter((entry) => entry.consumed)
    .map((entry) => parseWaterAmountMl(entry.amountMl))
    .filter((value): value is number => value !== null);

  if (values.length === 0) {
    return null;
  }

  return values.reduce((total, value) => total + value, 0);
};

const normalizeWaterIntake = (waterIntake: WaterIntakeLog | undefined): WaterIntakeLog => {
  const existingEntries = Array.isArray(waterIntake?.entries) ? waterIntake.entries : [];
  const entriesById = new Map(existingEntries.map((entry) => [entry.id, entry]));
  const defaults = defaultWaterIntakeEntries.map((entry) => ({ ...entry, ...entriesById.get(entry.id) }));
  const extraEntries = existingEntries.filter((entry) => !defaultWaterIntakeEntries.some((item) => item.id === entry.id));

  return {
    entries: [...defaults, ...extraEntries].map((entry) => ({
      id: entry.id,
      label: entry.label,
      amountMl: entry.amountMl,
      consumed: Boolean(entry.consumed),
    })),
  };
};

export const getMeal = (day: FoodLogDay, slot: MealSlot): MealLog => {
  const meal = day.meals.find((item) => item.slot === slot);

  if (!meal) {
    throw new Error(`Missing meal slot: ${slot}`);
  }

  return meal;
};
