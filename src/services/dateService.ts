import { TIMEZONE } from '../models/foodLog';

const numberPart = (parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): string => {
  const value = parts.find((part) => part.type === type)?.value;

  if (!value) {
    throw new Error(`Unable to format date part: ${type}`);
  }

  return value.padStart(2, '0');
};

export const getTodayInBrisbane = (): string => {
  const parts = new Intl.DateTimeFormat('en-AU', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  return `${numberPart(parts, 'year')}-${numberPart(parts, 'month')}-${numberPart(parts, 'day')}`;
};

export const toBrisbaneTimestamp = (date = new Date()): string => {
  const parts = new Intl.DateTimeFormat('en-AU', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);

  return `${numberPart(parts, 'year')}-${numberPart(parts, 'month')}-${numberPart(parts, 'day')}T${numberPart(
    parts,
    'hour',
  )}:${numberPart(parts, 'minute')}:${numberPart(parts, 'second')}+10:00`;
};

export const getLastNDates = (days: number, fromDate = getTodayInBrisbane()): string[] => {
  const [year, month, day] = fromDate.split('-').map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day));

  return Array.from({ length: days }, (_, index) => {
    const item = new Date(utcDate);
    item.setUTCDate(utcDate.getUTCDate() - index);

    return item.toISOString().slice(0, 10);
  });
};

export const addDays = (date: string, days: number): string => {
  const [year, month, day] = date.split('-').map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day));

  utcDate.setUTCDate(utcDate.getUTCDate() + days);

  return utcDate.toISOString().slice(0, 10);
};

export const getFoodLogJsonPath = (date: string): string => {
  const [year, month] = date.split('-');
  return `data/${year}/${month}/${date}.json`;
};

export const getFoodPhotoPath = (date: string, name: string): string => {
  const [year, month] = date.split('-');
  return `photos/${year}/${month}/${date}/${name}.webp`;
};

export const getOneMonthAgoDate = (fromDate = getTodayInBrisbane()): string => {
  const [year, month, day] = fromDate.split('-').map(Number);
  const targetMonthIndex = month - 2;
  const targetYear = targetMonthIndex < 0 ? year - 1 : year;
  const normalizedTargetMonthIndex = (targetMonthIndex + 12) % 12;
  const lastDayInTargetMonth = new Date(Date.UTC(targetYear, normalizedTargetMonthIndex + 1, 0)).getUTCDate();
  const targetDay = Math.min(day, lastDayInTargetMonth);

  return new Date(Date.UTC(targetYear, normalizedTargetMonthIndex, targetDay)).toISOString().slice(0, 10);
};

export const getFoodDateFromPath = (path: string): string | null => {
  const dataMatch = /^data\/\d{4}\/\d{2}\/(\d{4}-\d{2}-\d{2})\.json$/.exec(path);

  if (dataMatch) {
    return dataMatch[1];
  }

  return /^photos\/\d{4}\/\d{2}\/(\d{4}-\d{2}-\d{2})\//.exec(path)?.[1] ?? null;
};
