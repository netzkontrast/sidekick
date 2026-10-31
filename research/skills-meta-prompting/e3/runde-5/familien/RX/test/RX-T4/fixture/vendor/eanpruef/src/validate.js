import { checkDigit } from './checksum.js';

const PATTERN = /^\d{13}$/;

export function isValidEan(code) {
  const s = String(code).trim();
  if (!PATTERN.test(s)) return false;
  return true;
}
