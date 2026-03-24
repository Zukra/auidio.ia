import type { User } from 'next-auth';
import { createLdapClient } from '@/features/auth/server/ldap/client';
import { getLdapConfig } from '@/features/auth/server/ldap/config';
import { LdapAuthError } from '@/features/auth/server/ldap/errors';
import { isAccountDisabled, normalizeBindUsername, normalizeLogin } from '@/features/auth/server/ldap/helpers';
import { findUserByLogin } from '@/features/auth/server/ldap/repository';
import type { AuthorizeCredentials, AuthenticatedUser } from '@/features/auth/server/ldap/types';

function mapLdapError(error: unknown): LdapAuthError {
  const rawCode = String((error as { code?: unknown })?.code ?? '').toUpperCase();
  const rawName = String((error as { name?: unknown })?.name ?? '').toUpperCase();
  const rawMessage = String((error as { message?: unknown })?.message ?? '').toUpperCase();

  const serverUnavailableMarkers = ['ENOTFOUND', 'ECONNREFUSED', 'ETIMEDOUT', 'EHOSTUNREACH'];
  if (serverUnavailableMarkers.some((marker) => rawCode.includes(marker) || rawMessage.includes(marker))) {
    return new LdapAuthError('LDAP_SERVER_UNREACHABLE');
  }

  if (rawCode === '49' || rawName.includes('INVALID') || rawMessage.includes('INVALIDCREDENTIALS')) {
    return new LdapAuthError('LDAP_INVALID_CREDENTIALS');
  }

  return new LdapAuthError('LDAP_AUTH_FAILED');
}

export async function authenticateWithLdap(credentials: AuthorizeCredentials): Promise<User> {
  if (!credentials) {
    throw new LdapAuthError('LDAP_INVALID_CREDENTIALS');
  }

  const bindUsername = credentials.username ? normalizeBindUsername(credentials.username) : '';
  const bindPassword = credentials.password ?? '';

  if (!bindUsername || !bindPassword) {
    throw new LdapAuthError('LDAP_INVALID_CREDENTIALS');
  }

  let config: ReturnType<typeof getLdapConfig>;
  try {
    config = getLdapConfig();
  } catch {
    throw new LdapAuthError('LDAP_CONFIG_ERROR');
  }

  const client = createLdapClient(config);
  let user: AuthenticatedUser | null = null;

  try {
    await client.bind(bindUsername, bindPassword);

    const login = normalizeLogin(bindUsername);
    const foundUser = await findUserByLogin(client, config.baseDn, login);
    user = foundUser ? { id: foundUser.sAMAccountName, ...foundUser } : null;
  } catch (error) {
    throw mapLdapError(error);
  } finally {
    try {
      await client.unbind();
    } catch {
      // Игнорируем ошибки unbind
    }
  }

  if (!user) {
    throw new LdapAuthError('LDAP_USER_NOT_FOUND');
  }

  user.isDisabled = isAccountDisabled(user);
  if (user.isDisabled) {
    throw new LdapAuthError('LDAP_ACCOUNT_DISABLED');
  }

  return user;
}
