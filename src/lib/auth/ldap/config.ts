import type { LdapConfig } from '@/lib/auth/ldap/types';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

export function getLdapConfig(): LdapConfig {
  return {
    serverUri: requireEnv('AUTH_LDAP_SERVER_URI'),
    baseDn: requireEnv('AUTH_LDAP_BASE_DN'),
    // domain: requireEnv('AUTH_LDAP_DOMAIN'),
  };
}
