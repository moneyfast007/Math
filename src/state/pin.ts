import type { PinRecord } from './schema';

/**
 * The parent PIN keeps curious children out of the parent screen. It is not a
 * security boundary (the data is on the same device and not secret), so a
 * salted SHA-256 is enough; the point is only that the code is not stored in
 * plain text where a backup file could reveal it.
 */
export const PIN_LENGTH = 4;

export function isValidPin(pin: string): boolean {
  return new RegExp(`^\\d{${PIN_LENGTH}}$`).test(pin);
}

function toHex(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
}

async function digest(pin: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${pin}`);
  return toHex(await crypto.subtle.digest('SHA-256', data));
}

export async function createPinRecord(pin: string): Promise<PinRecord> {
  if (!isValidPin(pin)) throw new RangeError('PIN must be 4 digits');
  const salt = toHex(crypto.getRandomValues(new Uint8Array(16)));
  return { salt, hash: await digest(pin, salt) };
}

export async function verifyPin(pin: string, record: PinRecord): Promise<boolean> {
  if (!isValidPin(pin)) return false;
  return (await digest(pin, record.salt)) === record.hash;
}
