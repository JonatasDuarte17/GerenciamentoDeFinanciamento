import { Financiamento } from '../types';
import { getSampleFinancings } from './financing';

const STORAGE_KEY = 'gestao_financiamentos_v2';

/**
 * Loads financings list from localStorage. Defaults to an empty array.
 */
export function loadFinancingsFromStorage(): Financiamento[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveFinancingsToStorage([]);
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    saveFinancingsToStorage([]);
    return [];
  } catch (err) {
    console.error('Failed to load financings from storage:', err);
    return [];
  }
}

/**
 * Saves financings list to localStorage
 */
export function saveFinancingsToStorage(data: Financiamento[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (err) {
    console.error('Failed to save financings to storage:', err);
    return false;
  }
}

/**
 * Resets storage back to initial sample dataset
 */
export function resetToSampleData(): Financiamento[] {
  const sample = getSampleFinancings();
  saveFinancingsToStorage(sample);
  return sample;
}

/**
 * Clears all data from storage
 */
export function clearAllFinancings(): void {
  saveFinancingsToStorage([]);
}

/**
 * Exports data as a JSON file download
 */
export function exportDataAsJSON(data: Financiamento[]): void {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `financiamentos-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Parses and validates an imported JSON string as Financiamento[]
 */
export function importDataFromJSON(jsonString: string): Financiamento[] | null {
  try {
    const parsed = JSON.parse(jsonString);
    if (!Array.isArray(parsed)) return null;

    // Basic structural check
    for (const item of parsed) {
      if (!item.id || !item.name || !item.installments || !Array.isArray(item.installments)) {
        return null;
      }
    }
    return parsed as Financiamento[];
  } catch (err) {
    console.error('Invalid JSON import:', err);
    return null;
  }
}
