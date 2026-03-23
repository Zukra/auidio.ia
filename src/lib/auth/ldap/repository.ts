import type { Client, Entry } from 'ldapts';
import type { AdUser } from '@/lib/auth/ldap/types';

const LDAP_ATTRIBUTES = [
  'cn',
  'employeeType',
  'sAMAccountName',
  'displayName',
  'mail',
  'department',
  'title',
  'memberOf',
  'objectGUID',
  'manager',
] as const;

function toRecord(entry: Entry): Record<string, unknown> {
  return entry as unknown as Record<string, unknown>;
}

function toStringValue(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    const firstString = value.find((item) => typeof item === 'string');
    return typeof firstString === 'string' ? firstString : '';
  }

  return '';
}

function toStringOrEmptyArray(value: unknown): string | [] {
  if (typeof value === 'string') {
    return value;
  }

  return [];
}

function toNullableStringArray(value: unknown): Array<string | null> {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => (typeof item === 'string' ? item : null));
}

function mapSearchEntryToAdUser(entry: Entry): AdUser {
  const record = toRecord(entry);

  return {
    dn: toStringValue(record.dn),
    cn: toStringValue(record.cn),
    title: toStringValue(record.title),
    displayName: toStringValue(record.displayName),
    objectGUID: toStringValue(record.objectGUID),
    sAMAccountName: toStringValue(record.sAMAccountName),
    mail: toStringValue(record.mail),
    employeeType: toStringOrEmptyArray(record.employeeType),
    department: toStringOrEmptyArray(record.department),
    memberOf: toNullableStringArray(record.memberOf),
    manager: toStringOrEmptyArray(record.manager),
    isDisabled: null,
  };
}

export async function findUserByLogin(client: Client, baseDn: string, login: string): Promise<AdUser | null> {
  const { searchEntries } = await client.search(baseDn, {
    scope: 'sub',
    filter: `(&(objectClass=person)(sAMAccountName=${login}))`,
    sizeLimit: 1,
    timeLimit: 10,
    attributes: [...LDAP_ATTRIBUTES],
  });

  if (!searchEntries.length) {
    return null;
  }

  return mapSearchEntryToAdUser(searchEntries[0]);
}
