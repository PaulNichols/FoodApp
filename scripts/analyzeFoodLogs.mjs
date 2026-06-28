import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const repoRoot = process.cwd();
const apiKey = process.env.OPENAI_API_KEY?.trim();
const model = process.env.OPENAI_FOOD_ANALYSIS_MODEL?.trim() || 'gpt-4.1-mini';
const maxDays = Number.parseInt(process.env.FOOD_ANALYSIS_DAYS ?? '31', 10);

if (!apiKey) {
  console.log('OPENAI_API_KEY is not set; skipping food photo analysis.');
  process.exit(0);
}

const dataRoot = path.join(repoRoot, 'data');

if (!existsSync(dataRoot)) {
  console.log('No /data folder found; nothing to analyse.');
  process.exit(0);
}

const dataFiles = (await findJsonFiles(dataRoot))
  .filter((filePath) => /data[/\\]\d{4}[/\\]\d{2}[/\\]\d{4}-\d{2}-\d{2}\.json$/.test(filePath))
  .sort()
  .slice(-maxDays);

let changedFiles = 0;
let analysedItems = 0;

for (const filePath of dataFiles) {
  const rawJson = await readFile(filePath, 'utf8');
  const day = JSON.parse(rawJson);
  const candidates = await getCandidates(day);

  if (candidates.length === 0) {
    continue;
  }

  const analyses = await analyseDay(day, candidates);
  let changed = false;

  for (const candidate of candidates) {
    const result = analyses.get(candidate.id);

    if (!result) {
      continue;
    }

    const nextAnalysis = {
      itemName: normalizeText(result.itemName),
      calories: normalizeCalories(result.calories),
      nutrition: normalizeNutrition(result.nutrition),
      confidence: normalizeConfidence(result.confidence),
      source: 'openai',
      notes: normalizeText(result.notes),
      updatedAt: new Date().toISOString(),
      inputHash: candidate.inputHash,
    };

    if (candidate.kind === 'meal') {
      day.meals[candidate.index].analysis = nextAnalysis;
    } else {
      day.snacks[candidate.index].analysis = nextAnalysis;
    }

    changed = true;
    analysedItems += 1;
  }

  if (changed) {
    day.updatedAt = new Date().toISOString();
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, `${JSON.stringify(day, null, 2)}\n`, 'utf8');
    changedFiles += 1;
  }
}

console.log(`Food analysis complete. Analysed ${analysedItems} item(s) across ${changedFiles} file(s).`);

async function findJsonFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await findJsonFiles(entryPath)));
    } else if (entry.name.endsWith('.json')) {
      files.push(entryPath);
    }
  }

  return files;
}

async function getCandidates(day) {
  const candidates = [];

  for (const [index, meal] of (day.meals ?? []).entries()) {
    const candidate = await createCandidate({
      day,
      kind: 'meal',
      index,
      id: `meal:${meal.slot}`,
      label: meal.label,
      textContext: {
        slot: meal.slot,
        label: meal.label,
        templateName: meal.templateName,
        usedDefault: meal.usedDefault,
        notes: meal.notes,
        ingredients: meal.ingredients,
      },
      photoPath: meal.photoPath,
      analysis: meal.analysis,
    });

    if (candidate) {
      candidates.push(candidate);
    }
  }

  for (const [index, snack] of (day.snacks ?? []).entries()) {
    const candidate = await createCandidate({
      day,
      kind: 'snack',
      index,
      id: `snack:${snack.id}`,
      label: snack.id,
      textContext: {
        id: snack.id,
        notes: snack.notes,
      },
      photoPath: snack.photoPath,
      analysis: snack.analysis,
    });

    if (candidate) {
      candidates.push(candidate);
    }
  }

  return candidates;
}

async function createCandidate({ day, kind, index, id, label, textContext, photoPath, analysis }) {
  if (analysis?.source === 'manual') {
    return null;
  }

  const photo = await readPhoto(photoPath);
  const hasText = JSON.stringify(textContext).replace(/[{}\[\]",:]/g, '').trim().length > 0;

  if (!photo && !hasText) {
    return null;
  }

  const inputHash = hashJson({
    date: day.date,
    timezone: day.timezone,
    dailyNotes: day.dailyNotes,
    kind,
    label,
    textContext,
    photoPath,
    photoHash: photo?.hash ?? null,
  });

  if (analysis?.source === 'openai' && analysis.inputHash === inputHash) {
    return null;
  }

  return {
    id,
    kind,
    index,
    label,
    textContext,
    photo,
    inputHash,
  };
}

async function readPhoto(photoPath) {
  if (!photoPath) {
    return null;
  }

  const absolutePath = path.join(repoRoot, photoPath);

  if (!existsSync(absolutePath)) {
    return null;
  }

  const bytes = await readFile(absolutePath);
  const extension = path.extname(photoPath).toLowerCase();
  const mimeType = extension === '.jpg' || extension === '.jpeg' ? 'image/jpeg' : 'image/webp';

  return {
    path: photoPath,
    mimeType,
    base64: bytes.toString('base64'),
    hash: createHash('sha256').update(bytes).digest('hex'),
  };
}

async function analyseDay(day, candidates) {
  const content = [
    {
      type: 'input_text',
      text: createPrompt(day, candidates),
    },
  ];

  for (const candidate of candidates) {
    if (!candidate.photo) {
      continue;
    }

    content.push({
      type: 'input_text',
      text: `Photo for ${candidate.id}: ${candidate.photo.path}`,
    });
    content.push({
      type: 'input_image',
      image_url: `data:${candidate.photo.mimeType};base64,${candidate.photo.base64}`,
    });
  }

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: 'user',
          content,
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'food_log_analysis',
          strict: true,
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              items: {
                type: 'array',
                items: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    id: { type: 'string' },
                    itemName: { type: 'string' },
                    calories: { type: ['integer', 'null'] },
                    nutrition: {
                      type: 'object',
                      additionalProperties: false,
                      properties: {
                        proteinGrams: { type: ['number', 'null'] },
                        carbohydrateGrams: { type: ['number', 'null'] },
                        fatGrams: { type: ['number', 'null'] },
                        sugarGrams: { type: ['number', 'null'] },
                        fibreGrams: { type: ['number', 'null'] },
                      },
                      required: ['proteinGrams', 'carbohydrateGrams', 'fatGrams', 'sugarGrams', 'fibreGrams'],
                    },
                    confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
                    notes: { type: 'string' },
                  },
                  required: ['id', 'itemName', 'calories', 'nutrition', 'confidence', 'notes'],
                },
              },
            },
            required: ['items'],
          },
        },
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI food analysis failed (${response.status}): ${errorBody}`);
  }

  const payload = await response.json();
  const text = extractOutputText(payload);
  const parsed = JSON.parse(text);
  const validIds = new Set(candidates.map((candidate) => candidate.id));

  return new Map((parsed.items ?? []).filter((item) => validIds.has(item.id)).map((item) => [item.id, item]));
}

function createPrompt(day, candidates) {
  return [
    'Estimate the food item name and calories for each food log entry.',
    'Also estimate protein, carbohydrate, fat, sugar, and fibre grams for the same serving.',
    'Use the photo when supplied. If no photo is supplied, infer from the entry notes, template, and ingredients.',
    'Return conservative approximate calories for the visible or described serving only.',
    'If calories or nutrition cannot be estimated, use null values and low confidence.',
    'Do not include medical advice.',
    '',
    `Date: ${day.date}`,
    `Timezone: ${day.timezone}`,
    `Daily notes: ${day.dailyNotes ?? ''}`,
    '',
    'Entries:',
    JSON.stringify(
      candidates.map((candidate) => ({
        id: candidate.id,
        kind: candidate.kind,
        label: candidate.label,
        context: candidate.textContext,
        hasPhoto: Boolean(candidate.photo),
      })),
      null,
      2,
    ),
  ].join('\n');
}

function extractOutputText(payload) {
  if (typeof payload.output_text === 'string') {
    return payload.output_text;
  }

  for (const output of payload.output ?? []) {
    for (const content of output.content ?? []) {
      if (typeof content.text === 'string') {
        return content.text;
      }
    }
  }

  throw new Error('OpenAI response did not include text output.');
}

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeCalories(value) {
  return Number.isInteger(value) && value >= 0 ? value : null;
}

function normalizeNutrition(value) {
  if (!value || typeof value !== 'object') {
    return {
      proteinGrams: null,
      carbohydrateGrams: null,
      fatGrams: null,
      sugarGrams: null,
      fibreGrams: null,
    };
  }

  return {
    proteinGrams: normalizeMacro(value.proteinGrams),
    carbohydrateGrams: normalizeMacro(value.carbohydrateGrams),
    fatGrams: normalizeMacro(value.fatGrams),
    sugarGrams: normalizeMacro(value.sugarGrams),
    fibreGrams: normalizeMacro(value.fibreGrams),
  };
}

function normalizeMacro(value) {
  return Number.isFinite(value) && value >= 0 ? Math.round(value * 10) / 10 : null;
}

function normalizeConfidence(value) {
  return ['low', 'medium', 'high'].includes(value) ? value : 'low';
}

function hashJson(value) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}
