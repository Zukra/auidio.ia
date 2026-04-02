export type AdUser = {
  dn: string;
  cn: string;
  title: string;
  displayName: string;
  objectGUID: string;
  sAMAccountName: string;
  mail: string;
  employeeType: string | [];
  department: string | [];
  memberOf: Array<string | null>;
  manager: string | [];
  isActive: boolean;
};

export type LdapConfig = {
  serverUri: string;
  baseDn: string;
  domain?: string;
};

export type AuthorizeCredentials = {
  username?: string;
  password?: string;
} | undefined;
