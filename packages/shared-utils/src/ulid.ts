/**
 * Tiny ULID-like generator for stable, sortable, type-prefixed ids.
 * Format: `<prefix>_<26-char Crockford base32>` — e.g. `wf_01HXYZABC...`
 *
 * NOT a cryptographic primitive. For real ULID, depend on `ulid` npm package.
 * This keeps the package zero-dependency for now.
 */

const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

const ULID_RE = /^[A-Z0-9]{2,8}_[0-9A-HJKMNP-TV-Z]{26}$/;

export function ulid(prefix: string, now: number = Date.now()): string {
  if (!/^[a-z]{2,8}$/.test(prefix)) {
    throw new Error(`Invalid prefix "${prefix}". Use 2-8 lowercase letters.`);
  }
  let timestamp = now;
  const time: string[] = [];
  for (let i = 0; i < 10; i++) {
    time.unshift(ALPHABET[timestamp % 32]!);
    timestamp = Math.floor(timestamp / 32);
  }
  let random = '';
  for (let i = 0; i < 16; i++) {
    random += ALPHABET[Math.floor(Math.random() * 32)];
  }
  return `${prefix}_${time.join('')}${random}`;
}

export function isUlid(value: unknown, prefix?: string): value is string {
  if (typeof value !== 'string') return false;
  if (!ULID_RE.test(value)) return false;
  if (prefix != null && !value.startsWith(`${prefix}_`)) return false;
  return true;
}
