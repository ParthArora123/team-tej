import { z } from "zod";

export const NAME_MAX_LENGTH = 100;
export const NAME_ERROR_MESSAGE =
  "Please enter a valid name using letters, spaces, hyphens, apostrophes, or periods.";

// One name token: Unicode letters (any script, incl. Devanagari and accented
// Latin) plus combining marks, joined by single hyphens/apostrophes/periods,
// with an optional trailing period for initials ("A.").
const TOKEN_PATTERN =
  /^\p{L}[\p{L}\p{M}]*(?:['\u2019.\-]\p{L}[\p{L}\p{M}]*)*\.?$/u;

// Defence in depth: explicitly reject injection-ish payloads even if the
// pattern above somehow allowed them.
const FORBIDDEN = /[<>{}\[\]();=|`~!@#$%^&*_+\\/?:",\d]/;
const SCRIPTISH = /(<\s*\/?\s*\w|javascript\s*:|data\s*:|on\w+\s*=|&#|--|\/\*)/i;

/** Collapse whitespace and trim; keeps the user's characters intact. */
export function normalizeName(value: string): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

export function isValidName(value: string): boolean {
  const v = normalizeName(value);
  if (v.length < 2 || v.length > NAME_MAX_LENGTH) return false;
  if (FORBIDDEN.test(v) || SCRIPTISH.test(v)) return false;
  return v.split(" ").every((t) => TOKEN_PATTERN.test(t));
}


/** Zod schema: trims/normalizes then validates. */
export const nameSchema = z
  .string()
  .transform(normalizeName)
  .refine(isValidName, { message: NAME_ERROR_MESSAGE });

/** Optional variant that allows an empty value. */
export const optionalNameSchema = z
  .string()
  .transform(normalizeName)
  .refine((v) => v === "" || isValidName(v), { message: NAME_ERROR_MESSAGE });

/**
 * Neutralise spreadsheet formula injection for CSV/Excel exports.
 * Values starting with = + - @ tab or CR are prefixed with a single quote.
 */
export function csvSafe(value: unknown): string {
  const s = String(value ?? "");
  return /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
}
