import { existsSync } from 'node:fs';
import { rm, readdir } from 'node:fs/promises';
import path from 'node:path';

const repoRoot = process.cwd();
const retentionRoots = ['data', 'photos'];
const endDate = process.env.FOOD_RETENTION_END_DATE?.trim() || getTodayInBrisbane();
const cutoffDate = getOneMonthAgoDate(endDate);
const removedFiles = [];

for (const rootName of retentionRoots) {
  const rootPath = path.join(repoRoot, rootName);

  if (!existsSync(rootPath)) {
    continue;
  }

  const files = await findFiles(rootPath);

  for (const filePath of files) {
    const relativePath = toRepositoryPath(filePath);
    const foodDate = getFoodDateFromPath(relativePath);

    if (foodDate && foodDate < cutoffDate) {
      await rm(filePath);
      removedFiles.push(relativePath);
    }
  }

  await removeEmptyDirectories(rootPath);
}

console.log(
  `Food retention complete. Cutoff ${cutoffDate}. Removed ${removedFiles.length} old file(s).`,
);

if (removedFiles.length > 0) {
  console.log(removedFiles.map((filePath) => `- ${filePath}`).join('\n'));
}

async function findFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await findFiles(entryPath)));
    } else if (entry.isFile()) {
      files.push(entryPath);
    }
  }

  return files.sort();
}

async function removeEmptyDirectories(directory) {
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    await removeEmptyDirectories(path.join(directory, entry.name));
  }

  const remainingEntries = await readdir(directory);

  if (remainingEntries.length === 0 && directory !== path.join(repoRoot, path.basename(directory))) {
    await rm(directory, { recursive: true });
  }
}

function toRepositoryPath(filePath) {
  return path.relative(repoRoot, filePath).split(path.sep).join('/');
}

function getFoodDateFromPath(filePath) {
  const dataMatch = /^data\/\d{4}\/\d{2}\/(\d{4}-\d{2}-\d{2})\.json$/.exec(filePath);

  if (dataMatch) {
    return dataMatch[1];
  }

  return /^photos\/\d{4}\/\d{2}\/(\d{4}-\d{2}-\d{2})\//.exec(filePath)?.[1] ?? null;
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

function getOneMonthAgoDate(fromDate) {
  const [year, month, day] = fromDate.split('-').map(Number);
  const targetMonthIndex = month - 2;
  const targetYear = targetMonthIndex < 0 ? year - 1 : year;
  const normalizedTargetMonthIndex = (targetMonthIndex + 12) % 12;
  const lastDayInTargetMonth = new Date(Date.UTC(targetYear, normalizedTargetMonthIndex + 1, 0)).getUTCDate();
  const targetDay = Math.min(day, lastDayInTargetMonth);

  return new Date(Date.UTC(targetYear, normalizedTargetMonthIndex, targetDay)).toISOString().slice(0, 10);
}

function getDatePart(parts, type) {
  const value = parts.find((part) => part.type === type)?.value;

  if (!value) {
    throw new Error(`Unable to format date part: ${type}`);
  }

  return value.padStart(2, '0');
}
