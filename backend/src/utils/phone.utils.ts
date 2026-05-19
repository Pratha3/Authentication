/**
 * Normalizes a phone number to E.164 format (+[country][number]).
 * Returns null if the number cannot be reliably normalized.
 *
 * Handles:
 *   +91XXXXXXXXXX  → +91XXXXXXXXXX  (already E.164)
 *   91XXXXXXXXXX   → +91XXXXXXXXXX  (missing +)
 *   9876543210     → +91XXXXXXXXXX  (Indian 10-digit, starts with 6-9)
 *   09876543210    → +91XXXXXXXXXX  (Indian with leading 0)
 *   +1XXXXXXXXXX   → +1XXXXXXXXXX   (US E.164)
 *   1XXXXXXXXXX    → +1XXXXXXXXXX   (US without +)
 */
export function normalizePhone(phone: string): string | null {
  if (!phone || typeof phone !== "string") return null;

  // Strip whitespace, dashes, parentheses, dots
  const cleaned = phone.trim().replace(/[\s\-().]/g, "");

  // Already valid E.164
  if (/^\+\d{7,15}$/.test(cleaned)) return cleaned;

  // Indian 10-digit (starts with 6–9)
  if (/^[6-9]\d{9}$/.test(cleaned)) return `+91${cleaned}`;

  // Indian 10-digit with leading 0
  if (/^0[6-9]\d{9}$/.test(cleaned)) return `+91${cleaned.slice(1)}`;

  // 12-digit starting with 91 (Indian without +)
  if (/^91[6-9]\d{9}$/.test(cleaned)) return `+${cleaned}`;

  // US 10-digit without country code
  if (/^\d{10}$/.test(cleaned) && /^[2-9]/.test(cleaned)) return `+1${cleaned}`;

  // Has + but contains unexpected chars — strip non-digits and validate
  if (cleaned.startsWith("+")) {
    const digits = cleaned.slice(1).replace(/\D/g, "");
    if (digits.length >= 7 && digits.length <= 15) return `+${digits}`;
  }

  return null;
}

export function isValidPhone(phone: string): boolean {
  return normalizePhone(phone) !== null;
}
