import { Client } from 'ldapts';
import type { LdapConfig } from '@/lib/auth/ldap/types';

export function createLdapClient(config: LdapConfig): Client {
  return new Client({
    url: config.serverUri,
    timeout: 10 * 1000,
    connectTimeout: 10 * 1000,
    strictDN: false,
  });
}
