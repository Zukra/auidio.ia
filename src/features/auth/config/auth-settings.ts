import {
  DEFAULT_JWT_MAX_AGE_SECONDS,
  DEFAULT_LDAP_RECHECK_INTERVAL_SECONDS,
  DEFAULT_SESSION_MAX_AGE_SECONDS,
} from '@/features/auth/config/constants';

type RequiredServerSetting =
  'NEXTAUTH_URL' | 'NEXTAUTH_SECRET' | 'AUTH_LDAP_SERVER_URI' | 'AUTH_LDAP_BASE_DN';

export type AuthSettings = {
  nextAuthUrl: string;
  nextAuthSecret: string;
  ldapServerUri: string;
  ldapBaseDn: string;
  ldapServiceUser: string | null;
  ldapServicePass: string | null;
  sessionMaxAgeSeconds: number;
  jwtMaxAgeSeconds: number;
  ldapRecheckIntervalSeconds: number;
};

function requireServerSetting(name: RequiredServerSetting): string {
  const value = process.env[name]?.trim() ?? '';

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

export function getAuthSettings(): AuthSettings {
  return {
    nextAuthUrl: requireServerSetting('NEXTAUTH_URL'),
    nextAuthSecret: requireServerSetting('NEXTAUTH_SECRET'),
    ldapServerUri: requireServerSetting('AUTH_LDAP_SERVER_URI'),
    ldapBaseDn: requireServerSetting('AUTH_LDAP_BASE_DN'),
    ldapServiceUser: process.env.AUTH_LDAP_SERVICE_USER?.trim() || null,
    ldapServicePass: process.env.AUTH_LDAP_SERVICE_PASS?.trim() || null,
    sessionMaxAgeSeconds: parsePositiveInt(process.env.AUTH_SESSION_MAX_AGE_SECONDS, DEFAULT_SESSION_MAX_AGE_SECONDS),
    jwtMaxAgeSeconds: parsePositiveInt(process.env.AUTH_JWT_MAX_AGE_SECONDS, DEFAULT_JWT_MAX_AGE_SECONDS),
    ldapRecheckIntervalSeconds: parsePositiveInt(process.env.AUTH_LDAP_RECHECK_INTERVAL_SECONDS, DEFAULT_LDAP_RECHECK_INTERVAL_SECONDS),
  };
}
