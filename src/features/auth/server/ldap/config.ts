import type { LdapConfig } from '@/features/auth/server/ldap/types';
import { getAuthSettings } from '@/features/auth/config/auth-settings';

export function getLdapConfig(): LdapConfig {
  const settings = getAuthSettings();

  return {
    serverUri: settings.ldapServerUri,
    baseDn: settings.ldapBaseDn,
    // domain: requireEnv('AUTH_LDAP_DOMAIN'),
  };
}
