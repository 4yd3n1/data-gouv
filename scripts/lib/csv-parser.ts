/**
 * CSV parsing utility wrapping papaparse.
 * Handles BOM, delimiter detection, type coercion.
 */

import Papa from "papaparse";

interface ParseCsvOptions {
  delimiter?: string; // Default: auto-detect
  header?: boolean; // Default: true
  skipEmptyLines?: boolean; // Default: true
}

/**
 * Parse a CSV string into typed objects.
 */
export function parseCsv<T = Record<string, string>>(
  content: string,
  options: ParseCsvOptions = {}
): T[] {
  // Strip BOM if present
  const clean = content.charCodeAt(0) === 0xfeff ? content.slice(1) : content;

  const result = Papa.parse<T>(clean, {
    header: options.header ?? true,
    delimiter: options.delimiter,
    skipEmptyLines: options.skipEmptyLines ?? true,
    dynamicTyping: false, // We handle type coercion explicitly
  });

  if (result.errors.length > 0) {
    const firstErrors = result.errors.slice(0, 3);
    console.warn(
      `CSV parse warnings (${result.errors.length} total):`,
      firstErrors.map((e) => `row ${e.row}: ${e.message}`)
    );
  }

  return result.data;
}

// ─── Type coercion helpers ───

export function parseIntSafe(val: unknown): number | null {
  if (val === null || val === undefined || val === "") return null;
  const n = parseInt(String(val), 10);
  return isNaN(n) ? null : n;
}

export function parseFloatSafe(val: unknown): number | null {
  if (val === null || val === undefined || val === "") return null;
  // Handle French decimal separator
  const s = String(val).replace(",", ".").replace(/\s/g, "");
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

/**
 * Parse a date string into a Date object.
 * Handles common French date formats: DD/MM/YYYY, YYYY-MM-DD, DD-MM-YYYY
 */
export function parseDateSafe(val: unknown): Date | null {
  if (val === null || val === undefined || val === "") return null;
  const s = String(val).trim();

  // DD/MM/YYYY or DD-MM-YYYY
  const frMatch = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (frMatch) {
    const [, day, month, year] = frMatch;
    const d = new Date(parseInt(year!), parseInt(month!) - 1, parseInt(day!));
    return isNaN(d.getTime()) ? null : d;
  }

  // YYYY-MM-DD (ISO)
  const isoMatch = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }

  // Try native Date parse as fallback
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}
