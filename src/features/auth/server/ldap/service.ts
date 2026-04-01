import type { User } from 'next-auth';
import { getAuthSettings } from '@/features/auth/config/auth-settings';
import { createLdapClient } from '@/features/auth/server/ldap/client';
import { getLdapConfig } from '@/features/auth/server/ldap/config';
import { LdapAuthError } from '@/features/auth/server/ldap/errors';
import { isAccountDisabled, normalizeBindUsername, normalizeLogin } from '@/features/auth/server/ldap/helpers';
import { findUserByLogin } from '@/features/auth/server/ldap/repository';
import type { AdUser, AuthorizeCredentials } from '@/features/auth/server/ldap/types';

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

function getLdapConfigOrThrow(): ReturnType<typeof getLdapConfig> {
  try {
    return getLdapConfig();
  } catch {
    throw new LdapAuthError('LDAP_CONFIG_ERROR');
  }
}

async function withBoundLdapClient<T>(
  bindUsername: string,
  bindPassword: string,
  operation: (context: {
    client: ReturnType<typeof createLdapClient>;
    config: ReturnType<typeof getLdapConfig>;
  }) => Promise<T>,
): Promise<T> {
  const config = getLdapConfigOrThrow();
  const client = createLdapClient(config);

  try {
    await client.bind(bindUsername, bindPassword);

    return await operation({ client, config });
  } catch (error) {
    throw mapLdapError(error);
  } finally {
    try {
      await client.unbind();
    } catch {
      // Ignore unbind errors.
    }
  }
}

export async function authenticateLdap(credentials: AuthorizeCredentials): Promise<User> {
  if (!credentials) {
    throw new LdapAuthError('LDAP_INVALID_CREDENTIALS');
  }

  const bindUsername = credentials.username ? normalizeBindUsername(credentials.username) : '';
  const bindPassword = credentials.password ?? '';

  if (!bindUsername || !bindPassword) {
    throw new LdapAuthError('LDAP_INVALID_CREDENTIALS');
  }

  const user = await withBoundLdapClient(bindUsername, bindPassword, async ({ client, config }) => {
    const login = normalizeLogin(bindUsername);
    const foundUser = await findUserByLogin(client, config.baseDn, login);

    return foundUser ? { id: foundUser.sAMAccountName, ...foundUser } : null;
  }) as (User & AdUser) | null;

  if (!user) {
    throw new LdapAuthError('LDAP_USER_NOT_FOUND');
  }

  user.isDisabled = isAccountDisabled(user);
  if (user.isDisabled) {
    throw new LdapAuthError('LDAP_ACCOUNT_DISABLED');
  }

  return user;
}

function getServiceCredentials(): { username: string; password: string } {
  const settings = getAuthSettings();
  const username = settings.ldapServiceUser;
  const password = settings.ldapServicePass;

  if (!username || !password) {
    throw new LdapAuthError('LDAP_CONFIG_ERROR');
  }

  return { username, password };
}

export async function getLdapUserByLogin(login: string): Promise<User & AdUser> {
  const normalizedLogin = normalizeLogin(login);
  if (!normalizedLogin) {
    throw new LdapAuthError('LDAP_INVALID_CREDENTIALS');
  }

  const serviceCredentials = getServiceCredentials();
  const user = await withBoundLdapClient(
    normalizeBindUsername(serviceCredentials.username),
    serviceCredentials.password,
    async ({ client, config }) => {
      const foundUser = await findUserByLogin(client, config.baseDn, normalizedLogin);
      return foundUser ? { id: foundUser.sAMAccountName, ...foundUser } : null;
    },
  ) as (User & AdUser) | null;

  if (!user) {
    throw new LdapAuthError('LDAP_USER_NOT_FOUND');
  }

  user.isDisabled = isAccountDisabled(user);

  return user;
}
