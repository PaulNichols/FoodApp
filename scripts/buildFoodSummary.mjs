import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const repoRoot = process.cwd();
const dataRoot = path.join(repoRoot, 'data');
const summaryPath = path.join(dataRoot, 'codex-food-summary.json');
const windowDays = normalizePositiveInteger(process.env.FOOD_SUMMARY_DAYS, 31);
const endDate = process.env.FOOD_SUMMARY_END_DATE?.trim() || getTodayInBrisbane();
const expectedDates = getLastNDates(windowDays, endDate);
const expectedDateSet = new Set(expectedDates);
const dailyFiles = existsSync(dataRoot) ? await findDailyFoodLogFiles(dataRoot) : [];
const daysByDate = new Map();

for (const filePath of dailyFiles) {
  const fileDate = getFoodDateFromPath(filePath);

  if (!fileDate || !expectedDateSet.has(fileDate)) {
    continue;
  }

  const rawJson = await readFile(filePath, 'utf8');
  daysByDate.set(fileDate, JSON.parse(rawJson));
}

const days = expectedDates.map((date) => summarizeDay(date, daysByDate.get(date) ?? null));
const loggedDays = days.filter((day) => day.logged);
const sourceUpdatedAt = getLatestSourceUpdatedAt(loggedDays);
const summary = {
  schemaVersion: 1,
  sourceUpdatedAt,
  timezone: 'Australia/Brisbane',
  source: 'FoodApp repository data',
  window: {
    days: windowDays,
    startDate: expectedDates.at(-1) ?? endDate,
    endDate,
  },
  totals: {
    loggedDays: loggedDays.length,
    missingDays: days.length - loggedDays.length,
    supplementCompleteDays: loggedDays.filter((day) => day.supplements.complete).length,
    defaultMealCount: sum(loggedDays, (day) => day.meals.filter((meal) => meal.usedDefault).length),
    replacedMealCount: sum(loggedDays, (day) => day.meals.filter((meal) => !meal.usedDefault).length),
    snackCount: sum(loggedDays, (day) => day.snackCount),
    photoCount: sum(loggedDays, (day) => day.photoCount),
    waterMl: sumNullable(loggedDays, (day) => day.waterIntake.totalMl),
    daysWithWaterEstimate: loggedDays.filter((day) => day.waterIntake.totalMl !== null).length,
    estimatedCalories: sumNullable(loggedDays, (day) => day.estimatedCalories),
    nutrition: sumNutrition(loggedDays.map((day) => day.nutrition)),
    daysWithEstimatedCalories: loggedDays.filter((day) => day.estimatedCalories !== null).length,
    manualAnalysisItems: sum(loggedDays, (day) => day.analysis.manualItems),
    openAiAnalysisItems: sum(loggedDays, (day) => day.analysis.openAiItems),
    codexAnalysisItems: sum(loggedDays, (day) => day.analysis.codexItems),
    unanalysedItems: sum(loggedDays, (day) => day.analysis.unanalysedItems),
    daysWithDailyNotes: loggedDays.filter((day) => day.dailyNotesPresent).length,
  },
  days,
};

await mkdir(path.dirname(summaryPath), { recursive: true });
await writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');

console.log(
  `Food summary complete. Wrote ${path.relative(repoRoot, summaryPath)} for ${loggedDays.length}/${days.length} logged day(s).`,
);

async function findDailyFoodLogFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await findDailyFoodLogFiles(entryPath)));
    } else if (/[/\\]\d{4}-\d{2}-\d{2}\.json$/.test(entryPath)) {
      files.push(entryPath);
    }
  }

  return files.sort();
}

function summarizeDay(date, day) {
  if (!day) {
    return {
      date,
      logged: false,
    };
  }

  const meals = (day.meals ?? []).map(summarizeMeal);
  const snacks = (day.snacks ?? []).map(summarizeSnack);
  const allItems = [...meals, ...snacks];
  const estimatedCalories = sumNullable(allItems, (item) => item.analysis.calories);
  const nutrition = sumNutrition(allItems.map((item) => item.analysis.nutrition));
  const waterIntake = summarizeWaterIntake(day.waterIntake);

  return {
    date,
    logged: true,
    updatedAt: normalizeString(day.updatedAt),
    supplements: summarizeSupplements(day.supplements),
    meals,
    snackCount: snacks.length,
    snacks,
    photoCount: allItems.filter((item) => item.hasPhoto).length,
    waterIntake,
    estimatedCalories,
    nutrition,
    dailyNotesPresent: hasText(day.dailyNotes),
    analysis: summarizeAnalysis(allItems),
  };
}

function summarizeSupplements(supplements) {
  const items = Array.isArray(supplements?.items) ? supplements.items : [];
  const missedItems = items.filter((item) => !item.taken).map((item) => normalizeString(item.name)).filter(Boolean);

  return {
    morningSupplementsTaken: Boolean(supplements?.morningSupplementsTaken),
    takenCount: items.length - missedItems.length,
    totalCount: items.length,
    complete: Boolean(supplements?.morningSupplementsTaken) && missedItems.length === 0,
    missedItems,
    notesPresent: hasText(supplements?.notes),
  };
}

function summarizeMeal(meal) {
  return {
    slot: normalizeString(meal.slot),
    label: normalizeString(meal.label),
    usedDefault: Boolean(meal.usedDefault),
    templateName: normalizeString(meal.templateName),
    ingredients: summarizeIngredients(meal.ingredients),
    servingDetailPresent: hasText(meal.servingDescription),
    hasNotes: hasText(meal.notes),
    hasPhoto: hasText(meal.photoPath),
    analysis: summarizeFoodAnalysis(meal.analysis),
  };
}

function summarizeIngredients(ingredients) {
  return Array.isArray(ingredients) ? ingredients.map(normalizeString).filter(Boolean) : [];
}

function summarizeSnack(snack) {
  return {
    id: normalizeString(snack.id),
    servingDetailPresent: hasText(snack.servingDescription),
    hasNotes: hasText(snack.notes),
    hasPhoto: hasText(snack.photoPath),
    analysis: summarizeFoodAnalysis(snack.analysis),
  };
}

function summarizeWaterIntake(waterIntake) {
  const entries = Array.isArray(waterIntake?.entries) ? waterIntake.entries : [];
  const summarizedEntries = entries.map((entry) => ({
    id: normalizeString(entry.id),
    label: normalizeString(entry.label),
    amountMl: normalizeString(entry.amountMl),
    consumed: Boolean(entry.consumed),
    parsedMl: entry.consumed ? parseWaterAmountMl(entry.amountMl) : null,
  }));

  return {
    totalMl: sumNullable(summarizedEntries, (entry) => entry.parsedMl),
    entries: summarizedEntries,
  };
}

function summarizeFoodAnalysis(analysis) {
  if (!analysis) {
    return {
      itemName: '',
      calories: null,
      nutrition: emptyNutrition(),
      confidence: null,
      source: null,
      notesPresent: false,
      updatedAt: '',
    };
  }

  return {
    itemName: normalizeString(analysis.itemName),
    calories: normalizeCalories(analysis.calories),
    nutrition: summarizeNutrition(analysis.nutrition),
    confidence: ['low', 'medium', 'high'].includes(analysis.confidence) ? analysis.confidence : null,
    source: ['manual', 'openai', 'codex'].includes(analysis.source) ? analysis.source : null,
    notesPresent: hasText(analysis.notes),
    updatedAt: normalizeString(analysis.updatedAt),
  };
}

function summarizeAnalysis(items) {
  return {
    manualItems: items.filter((item) => item.analysis.source === 'manual').length,
    openAiItems: items.filter((item) => item.analysis.source === 'openai').length,
    codexItems: items.filter((item) => item.analysis.source === 'codex').length,
    unanalysedItems: items.filter((item) => item.analysis.source === null).length,
  };
}

function getFoodDateFromPath(filePath) {
  return /data[/\\]\d{4}[/\\]\d{2}[/\\](\d{4}-\d{2}-\d{2})\.json$/.exec(filePath)?.[1] ?? null;
}

function getLatestSourceUpdatedAt(days) {
  const timestamps = days.map((day) => day.updatedAt).filter(Boolean).sort();

  return timestamps.at(-1) ?? null;
}

function getTodayInBrisbane() {
  const parts = new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Brisbane',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  return `${getDatePart(parts, 'year')}-${getDatePart(parts, 'month')}-${getDatePart(parts, 'day')}`;
}

function getLastNDates(days, fromDate) {
  const [year, month, day] = fromDate.split('-').map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day));

  return Array.from({ length: days }, (_, index) => {
    const item = new Date(utcDate);
    item.setUTCDate(utcDate.getUTCDate() - index);

    return item.toISOString().slice(0, 10);
  });
}

function getDatePart(parts, type) {
  const value = parts.find((part) => part.type === type)?.value;

  if (!value) {
    throw new Error(`Unable to format date part: ${type}`);
  }

  return value.padStart(2, '0');
}

function normalizePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value ?? '', 10);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeCalories(value) {
  return Number.isFinite(value) && value >= 0 ? Math.round(value) : null;
}

function parseWaterAmountMl(value) {
  const match = normalizeString(value).replace(',', '').match(/\d+(\.\d+)?/);
  const parsed = match ? Number(match[0]) : Number.NaN;

  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed) : null;
}

function summarizeNutrition(nutrition) {
  if (!nutrition || typeof nutrition !== 'object') {
    return emptyNutrition();
  }

  return {
    proteinGrams: normalizeMacro(nutrition.proteinGrams),
    carbohydrateGrams: normalizeMacro(nutrition.carbohydrateGrams),
    fatGrams: normalizeMacro(nutrition.fatGrams),
    sugarGrams: normalizeMacro(nutrition.sugarGrams),
    fibreGrams: normalizeMacro(nutrition.fibreGrams),
  };
}

function emptyNutrition() {
  return {
    proteinGrams: null,
    carbohydrateGrams: null,
    fatGrams: null,
    sugarGrams: null,
    fibreGrams: null,
  };
}

function normalizeMacro(value) {
  return Number.isFinite(value) && value >= 0 ? Math.round(value * 10) / 10 : null;
}

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function sum(items, selector) {
  return items.reduce((total, item) => total + selector(item), 0);
}

function sumNullable(items, selector) {
  let total = 0;
  let hasValue = false;

  for (const item of items) {
    const value = selector(item);

    if (Number.isFinite(value)) {
      total += value;
      hasValue = true;
    }
  }

  return hasValue ? total : null;
}

function sumNutrition(items) {
  const nutritionItems = items.filter((item) => item && typeof item === 'object');

  return {
    proteinGrams: sumNutritionField(nutritionItems, 'proteinGrams'),
    carbohydrateGrams: sumNutritionField(nutritionItems, 'carbohydrateGrams'),
    fatGrams: sumNutritionField(nutritionItems, 'fatGrams'),
    sugarGrams: sumNutritionField(nutritionItems, 'sugarGrams'),
    fibreGrams: sumNutritionField(nutritionItems, 'fibreGrams'),
  };
}

function sumNutritionField(items, field) {
  let total = 0;
  let hasValue = false;

  for (const item of items) {
    const value = item[field];

    if (Number.isFinite(value)) {
      total += value;
      hasValue = true;
    }
  }

  return hasValue ? normalizeMacro(total) : null;
}
