import { z } from "zod";

export const PHONE_LENGTH = 10;
export const PHONE_ERROR_MESSAGE =
  "Please enter a valid 10-digit mobile number using numbers only.";

/** Strip every non-digit and cap at 10 digits (typing-time sanitiser). */
export function sanitizePhone(value: string): string {
  return String(value ?? "").replace(/\D/g, "").slice(0, PHONE_LENGTH);
}

/** Exactly 10 digits, nothing else. */
export function isValidPhone(value: string): boolean {
  return /^[0-9]{10}$/.test(String(value ?? ""));
}

/** Zod schema: rejects anything that is not exactly 10 digits. */
export const phoneSchema = z
  .string()
  .refine(isValidPhone, { message: PHONE_ERROR_MESSAGE });
