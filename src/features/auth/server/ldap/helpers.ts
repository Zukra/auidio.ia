import type { AdUser } from '@/features/auth/server/ldap/types';

export function isAccountActive(user: AdUser): boolean {
  return !user.dn.toUpperCase().includes('OU=DISABLED USERS'.toUpperCase());
}

export function normalizeLogin(raw: string): string {
  const value = raw.trim();

  if (value.includes('\\')) {
    return value.split('\\').pop()!.trim().toLowerCase();
  }

  if (value.includes('@')) {
    return value.split('@')[0]!.trim().toLowerCase();
  }

  return value.toLowerCase();
}

export function normalizeBindUsername(value: string): string {
  return value
    .replace(/\\\\/g, '\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/\t/g, '\\t');
}

export function bufferToStr(buf: Buffer | string | null) {
  if (!Buffer.isBuffer(buf) || buf.length !== 16) {
    throw new Error('Expected 16-byte Buffer');
  }
  const b = buf;
  const reordered = [
    b[3], b[2], b[1], b[0],
    b[5], b[4],
    b[7], b[6],
    b[8], b[9], b[10], b[11], b[12], b[13], b[14], b[15],
  ];
  const hex = reordered.map(x => x.toString(16).padStart(2, '0')).join('');

  return hex.replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5');
}