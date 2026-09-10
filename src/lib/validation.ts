import { z } from "zod";

// Shared validation rules for public-facing forms (signup, login, ticket submission).
// Keeping these in one place means the client-side checks and the server-side
// zod schemas can never drift apart.

/** Pakistan is currently the only country this portal accepts phone numbers for
 *  (JazzCash / EasyPaisa payments are Pakistan-only). Shown as a fixed prefix
 *  badge on phone fields so it's clear which country's code applies. */
export const PAKISTAN_DIAL_CODE = "+92";

// Local mobile format, e.g. 03001234567 (stored as-is, including the leading 0).
export const PHONE_REGEX = /^03\d{9}$/;
export const PHONE_ERROR = "Enter a valid Pakistani mobile number (e.g. 03001234567)";

// Letters, spaces, and a few common name punctuation marks only — no digits or
// symbols like 123!@#$%^&.
export const NAME_REGEX = /^[A-Za-z][A-Za-z .'-]*$/;
export const NAME_ERROR = "Name can only contain letters (no numbers or special characters)";

export const CITY_REGEX = /^[A-Za-z][A-Za-z .'-]*$/;
export const CITY_ERROR = "City can only contain letters (no numbers or special characters)";

export const CNIC_REGEX = /^\d{5}-\d{7}-\d{1}$/;
export const CNIC_ERROR = "CNIC should look like 12345-1234567-1";

/** True if `value` has at least two letters once name-punctuation is stripped —
 *  rejects strings like "..." or "-" that the character-class regex alone would
 *  let through. */
function hasEnoughLetters(value: string, min = 2) {
  return (value.match(/[A-Za-z]/g) || []).length >= min;
}

export const nameSchema = z
  .string()
  .trim()
  .min(3, "Please enter your full name (min 3 characters)")
  .max(100, "Name is too long")
  .regex(NAME_REGEX, NAME_ERROR)
  .refine(hasEnoughLetters, NAME_ERROR);

export const phoneSchema = z.string().trim().regex(PHONE_REGEX, PHONE_ERROR);

export const citySchema = z
  .string()
  .trim()
  .min(2, "Please enter your city")
  .max(60, "City name is too long")
  .regex(CITY_REGEX, CITY_ERROR)
  .refine((v) => hasEnoughLetters(v, 2), CITY_ERROR);

export const cnicSchema = z.string().trim().regex(CNIC_REGEX, CNIC_ERROR).optional().or(z.literal(""));

// One person's share when a multi-ticket submission is split across several names
// (e.g. buying 10 tickets as 4 for one person, 2 for another, 4 for a third).
export const ticketHolderSchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
  quantity: z.coerce.number().int().positive("Enter a valid ticket count"),
});
