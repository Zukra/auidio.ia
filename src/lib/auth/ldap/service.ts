import type { User } from 'next-auth';
import { createLdapClient } from '@/lib/auth/ldap/client';
import { getLdapConfig } from '@/lib/auth/ldap/config';
import { isAccountDisabled, normalizeBindUsername, normalizeLogin } from '@/lib/auth/ldap/helpers';
import { findUserByLogin } from '@/lib/auth/ldap/repository';
import type { AuthorizeCredentials, AuthenticatedUser } from '@/lib/auth/ldap/types';

export async function authenticateWithLdap(credentials: AuthorizeCredentials): Promise<User | null> {
  if (!credentials) {
    return null;
  }

  credentials.username = process.env.AUTH_LDAP_SERVICE_USER;
  credentials.password = process.env.AUTH_LDAP_SERVICE_PASS;

  const bindUsername = credentials.username ? normalizeBindUsername(credentials.username) : '';
  const bindPassword = credentials.password ?? '';

  if (!bindUsername || !bindPassword) {
    return null;
  }

  const config = getLdapConfig();
  const client = createLdapClient(config);

  try {
    await client.bind(bindUsername, bindPassword);

    const login = normalizeLogin(bindUsername);
    const user = await findUserByLogin(client, config.baseDn, login);

    if (!user) {
      console.log('Пользователь не найден');

      return null;
    }

    user.isDisabled = isAccountDisabled(user);
    if (user.isDisabled) {
      return null;
    }

    const authenticatedUser: AuthenticatedUser = {
      id: user.sAMAccountName,
      ...user,
    };

    return authenticatedUser;
  } catch (error) {
    console.error('LDAP authentication failed:', error);
    return null;
  } finally {
    try {
      await client.unbind();
    } catch {
      // Игнорируем ошибки unbind
    }
  }
}
