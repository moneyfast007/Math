import { normalizeEmail } from './protocol';

/**
 * The password never leaves the device: it is stretched here (PBKDF2-SHA-256,
 * salted with the email, many rounds) into a 32-byte key, and only that key is
 * sent, base64url. The server keeps a salted hash of the key (worker/accounts.ts).
 * The rounds run on the device because the server has little time per request.
 */
export const KDF_ITERATIONS = 200_000;

function base64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export async function deriveAccountKey(
  email: string,
  password: string,
  iterations = KDF_ITERATIONS,
): Promise<string> {
  const enc = new TextEncoder();
  const base = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, [
    'deriveBits',
  ]);
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: enc.encode(`plusi-account:v1:${normalizeEmail(email)}`),
      iterations,
    },
    base,
    256,
  );
  return base64url(new Uint8Array(bits));
}
