export type LdapAuthErrorCode =
  | 'LDAP_SERVER_UNREACHABLE'
  | 'LDAP_INVALID_CREDENTIALS'
  | 'LDAP_USER_NOT_FOUND'
  | 'LDAP_ACCOUNT_DISABLED'
  | 'LDAP_CONFIG_ERROR'
  | 'LDAP_AUTH_FAILED';

export class LdapAuthError extends Error {
  code: LdapAuthErrorCode;

  constructor(code: LdapAuthErrorCode, message?: string) {
    super(message ?? code);
    this.name = 'LdapAuthError';
    this.code = code;
  }
}
