import {
  DEFAULT_JWT_MAX_AGE_SECONDS,
  DEFAULT_LDAP_RECHECK_INTERVAL_SECONDS,
  DEFAULT_SESSION_MAX_AGE_SECONDS,
} from '@/features/auth/config/constants';

type RequiredServerSetting = {
  name: 'NEXTAUTH_URL' | 'NEXTAUTH_SECRET' | 'AUTH_LDAP_SERVER_URI' | 'AUTH_LDAP_BASE_DN';
  value: string;
};

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

function getRequiredServerSettings(): RequiredServerSetting[] {
  return [
    { name: 'NEXTAUTH_URL', value: process.env.NEXTAUTH_URL ?? '' },
    { name: 'NEXTAUTH_SECRET', value: process.env.NEXTAUTH_SECRET ?? '' },
    { name: 'AUTH_LDAP_SERVER_URI', value: process.env.AUTH_LDAP_SERVER_URI ?? '' },
    { name: 'AUTH_LDAP_BASE_DN', value: process.env.AUTH_LDAP_BASE_DN ?? '' },
  ];
}

function requireServerSetting(name: RequiredServerSetting['name']): string {
  const item = getRequiredServerSettings().find((setting) => setting.name === name);
  const value = item?.value.trim() ?? '';

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
