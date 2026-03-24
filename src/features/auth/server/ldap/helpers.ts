import type { AdUser } from '@/features/auth/server/ldap/types';

export function isAccountDisabled(user: AdUser): boolean {
  return user.dn.toUpperCase().includes('OU=DISABLED USERS'.toUpperCase());
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
